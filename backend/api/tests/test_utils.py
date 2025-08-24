"""
Test cases for utility functions in the storefront app.
"""
import pytest
from unittest.mock import Mock, patch
from django.test import TestCase, RequestFactory
from django.core.cache import cache
from django.http import HttpRequest

from ..utils import (
    get_client_ip, anonymize_ip, is_rate_limited,
    should_track_analytics, sanitize_referrer
)


class TestGetClientIP(TestCase):
    """Test client IP extraction functionality."""
    
    def setUp(self):
        self.factory = RequestFactory()
    
    def test_get_client_ip_from_remote_addr(self):
        """Test IP extraction from REMOTE_ADDR."""
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '192.168.1.100')
    
    def test_get_client_ip_from_x_forwarded_for(self):
        """Test IP extraction from X-Forwarded-For header."""
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '203.0.113.195, 192.168.1.1, 10.0.0.1'
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '203.0.113.195')  # Should return first IP
    
    def test_get_client_ip_x_forwarded_for_single(self):
        """Test IP extraction from single X-Forwarded-For."""
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '203.0.113.195'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '203.0.113.195')
    
    def test_get_client_ip_fallback_default(self):
        """Test fallback to default IP when no IP available."""
        request = self.factory.get('/')
        # No REMOTE_ADDR or X-Forwarded-For
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '127.0.0.1')
    
    def test_get_client_ip_strips_whitespace(self):
        """Test that IP addresses are stripped of whitespace."""
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '  203.0.113.195  , 192.168.1.1'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '203.0.113.195')


class TestAnonymizeIP(TestCase):
    """Test IP anonymization functionality."""
    
    def test_anonymize_ipv4(self):
        """Test IPv4 address anonymization."""
        # Test various IPv4 addresses
        test_cases = [
            ('192.168.1.100', '192.168.1.0'),
            ('10.0.0.255', '10.0.0.0'),
            ('203.0.113.195', '203.0.113.0'),
            ('127.0.0.1', '127.0.0.0'),
        ]
        
        for original, expected in test_cases:
            with self.subTest(ip=original):
                result = anonymize_ip(original)
                self.assertEqual(result, expected)
    
    def test_anonymize_ipv6(self):
        """Test IPv6 address anonymization."""
        test_cases = [
            ('2001:db8:85a3:8d3:1319:8a2e:370:7348', '2001:db8:85a3::'),
            ('::1', '::'),  # localhost
            ('2001:db8::1', '2001:db8::'),
        ]
        
        for original, expected in test_cases:
            with self.subTest(ip=original):
                result = anonymize_ip(original)
                self.assertEqual(result, expected)
    
    def test_anonymize_ip_empty_values(self):
        """Test anonymization with empty/None values."""
        self.assertEqual(anonymize_ip(''), '')
        self.assertEqual(anonymize_ip(None), None)
    
    def test_anonymize_ip_invalid_format(self):
        """Test anonymization with invalid IP formats."""
        # Should return original value if parsing fails
        invalid_ips = ['invalid-ip', 'hostname.example.com', '999.999.999.999']
        
        for invalid_ip in invalid_ips:
            with self.subTest(ip=invalid_ip):
                result = anonymize_ip(invalid_ip)
                self.assertEqual(result, invalid_ip)


class TestRateLimiting(TestCase):
    """Test rate limiting functionality."""
    
    def setUp(self):
        # Clear cache before each test
        cache.clear()
    
    def tearDown(self):
        # Clear cache after each test
        cache.clear()
    
    def test_is_rate_limited_first_request(self):
        """Test that first request is not rate limited."""
        result = is_rate_limited('test-identifier', 'test-action', limit=5, window=60)
        self.assertFalse(result)
    
    def test_is_rate_limited_within_limit(self):
        """Test requests within limit are allowed."""
        identifier = 'test-user-123'
        action = 'profile_view'
        
        # Make requests within limit
        for i in range(3):
            result = is_rate_limited(identifier, action, limit=5, window=60)
            self.assertFalse(result)
    
    def test_is_rate_limited_exceeds_limit(self):
        """Test that requests exceeding limit are blocked."""
        identifier = 'test-user-456'
        action = 'link_click'
        limit = 3
        
        # Make requests up to limit
        for i in range(limit):
            result = is_rate_limited(identifier, action, limit=limit, window=60)
            self.assertFalse(result)
        
        # Next request should be rate limited
        result = is_rate_limited(identifier, action, limit=limit, window=60)
        self.assertTrue(result)
    
    def test_is_rate_limited_different_identifiers(self):
        """Test that different identifiers have separate limits."""
        action = 'test-action'
        limit = 2
        
        # First identifier
        for i in range(limit):
            result = is_rate_limited('user-1', action, limit=limit, window=60)
            self.assertFalse(result)
        
        # Second identifier should not be affected
        result = is_rate_limited('user-2', action, limit=limit, window=60)
        self.assertFalse(result)
    
    def test_is_rate_limited_different_actions(self):
        """Test that different actions have separate limits."""
        identifier = 'test-user'
        limit = 2
        
        # First action
        for i in range(limit):
            result = is_rate_limited(identifier, 'action-1', limit=limit, window=60)
            self.assertFalse(result)
        
        # Second action should not be affected
        result = is_rate_limited(identifier, 'action-2', limit=limit, window=60)
        self.assertFalse(result)


class TestShouldTrackAnalytics(TestCase):
    """Test analytics tracking logic."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    def test_should_track_analytics_first_request(self):
        """Test that first request is tracked."""
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        
        result = should_track_analytics(request, user_profile_id=1)
        self.assertTrue(result)
    
    def test_should_track_analytics_rate_limited(self):
        """Test that requests are not tracked when rate limited."""
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        
        # Make requests up to rate limit
        for i in range(5):  # Default limit is 5
            result = should_track_analytics(request, user_profile_id=1)
        
        # Next request should not be tracked
        result = should_track_analytics(request, user_profile_id=1)
        self.assertFalse(result)
    
    def test_should_track_analytics_different_profiles(self):
        """Test that different profiles have separate tracking limits."""
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        
        # Make requests for profile 1 up to limit
        for i in range(5):
            result = should_track_analytics(request, user_profile_id=1)
        
        # Profile 2 should not be affected
        result = should_track_analytics(request, user_profile_id=2)
        self.assertTrue(result)


class TestSanitizeReferrer(TestCase):
    """Test referrer URL sanitization."""
    
    def test_sanitize_referrer_empty(self):
        """Test sanitization with empty/None referrer."""
        self.assertEqual(sanitize_referrer(''), '')
        self.assertEqual(sanitize_referrer(None), None)
    
    def test_sanitize_referrer_clean_url(self):
        """Test sanitization with clean URL."""
        clean_url = 'https://example.com/page?param=value'
        result = sanitize_referrer(clean_url)
        self.assertEqual(result, clean_url)
    
    def test_sanitize_referrer_removes_sensitive_params(self):
        """Test that sensitive parameters are removed."""
        test_cases = [
            (
                'https://example.com/page?token=secret123&param=value',
                'https://example.com/page?param=value'
            ),
            (
                'https://example.com/page?api_key=key123&safe=param',
                'https://example.com/page?safe=param'
            ),
            (
                'https://example.com/page?password=pass&secret=key&normal=ok',
                'https://example.com/page?normal=ok'
            ),
        ]
        
        for original, expected in test_cases:
            with self.subTest(url=original):
                result = sanitize_referrer(original)
                # Parse URLs to compare without parameter order dependency
                from urllib.parse import urlparse, parse_qs
                
                expected_parsed = urlparse(expected)
                result_parsed = urlparse(result)
                
                self.assertEqual(result_parsed.scheme, expected_parsed.scheme)
                self.assertEqual(result_parsed.netloc, expected_parsed.netloc)
                self.assertEqual(result_parsed.path, expected_parsed.path)
                
                # Compare query parameters (order independent)
                expected_params = parse_qs(expected_parsed.query)
                result_params = parse_qs(result_parsed.query)
                self.assertEqual(result_params, expected_params)
    
    def test_sanitize_referrer_length_limit(self):
        """Test that referrer is truncated to 500 characters."""
        long_url = 'https://example.com/' + 'a' * 600
        result = sanitize_referrer(long_url)
        self.assertEqual(len(result), 500)
    
    def test_sanitize_referrer_invalid_url(self):
        """Test sanitization with invalid URL format."""
        invalid_url = 'not-a-valid-url'
        result = sanitize_referrer(invalid_url)
        # Should return truncated original if parsing fails
        self.assertTrue(len(result) <= 500)
        self.assertTrue(invalid_url in result)


@pytest.mark.django_db
class TestUtilsIntegration(TestCase):
    """Integration tests for utility functions."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    def test_full_ip_handling_workflow(self):
        """Test complete IP handling workflow."""
        # Create request with forwarded IP
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '203.0.113.195, 192.168.1.1'
        
        # Extract IP
        ip = get_client_ip(request)
        self.assertEqual(ip, '203.0.113.195')
        
        # Anonymize IP
        anonymized = anonymize_ip(ip)
        self.assertEqual(anonymized, '203.0.113.0')
        
        # Test rate limiting
        self.assertFalse(is_rate_limited(anonymized, 'test', limit=1, window=60))
        self.assertTrue(is_rate_limited(anonymized, 'test', limit=1, window=60))
    
    def test_analytics_tracking_with_rate_limiting(self):
        """Test analytics tracking integrated with rate limiting."""
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        
        # Track analytics multiple times
        results = []
        for i in range(7):  # More than default limit of 5
            result = should_track_analytics(request, user_profile_id=1)
            results.append(result)
        
        # First 5 should be True, rest False
        self.assertTrue(all(results[:5]))
        self.assertFalse(any(results[5:]))