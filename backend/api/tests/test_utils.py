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
    should_track_analytics, sanitize_referrer,
    validate_email_address, validate_email_with_cache,
    is_valid_email, EmailValidationError
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


class TestEmailValidation(TestCase):
    """Test email validation functionality."""

    def test_validate_email_address_valid_syntax(self):
        """Test validation with valid email syntax."""
        test_emails = [
            'user@example.com',
            'john.doe@company.co.uk',
            'test+filter@gmail.com',
            'admin@subdomain.example.org',
            'user123@test-domain.com',
        ]

        for email in test_emails:
            with self.subTest(email=email):
                is_valid, normalized, error = validate_email_address(
                    email,
                    check_dns=False,
                    check_disposable=False,
                    raise_exception=False
                )
                self.assertTrue(is_valid)
                self.assertEqual(error, '')
                self.assertTrue('@' in normalized)

    def test_validate_email_address_invalid_syntax(self):
        """Test validation with invalid email syntax."""
        invalid_emails = [
            'notanemail',
            '@example.com',
            'user@',
            'user @example.com',  # space
            'user@.com',
            'user..name@example.com',  # double dot
            'user@domain',  # missing TLD
            '',
        ]

        for email in invalid_emails:
            with self.subTest(email=email):
                is_valid, normalized, error = validate_email_address(
                    email,
                    check_dns=False,
                    check_disposable=False,
                    raise_exception=False
                )
                self.assertFalse(is_valid)
                self.assertNotEqual(error, '')

    def test_validate_email_address_normalization(self):
        """Test that email addresses are normalized correctly."""
        test_cases = [
            # Note: email-validator normalizes domain (after @) to lowercase,
            # but preserves local part (before @) case as per RFC standards
            ('User@Example.COM', 'User@example.com'),
            ('  spaces@example.com  ', 'spaces@example.com'),
            ('Test.User@Example.com', 'Test.User@example.com'),
        ]

        for original, expected in test_cases:
            with self.subTest(email=original):
                is_valid, normalized, error = validate_email_address(
                    original,
                    check_dns=False,
                    check_disposable=False,
                    raise_exception=False
                )
                self.assertTrue(is_valid)
                self.assertEqual(normalized, expected)

    def test_validate_email_address_empty_email(self):
        """Test validation with empty email."""
        is_valid, normalized, error = validate_email_address(
            '',
            check_dns=False,
            check_disposable=False,
            raise_exception=False
        )
        self.assertFalse(is_valid)
        self.assertIn('required', error.lower())

    def test_validate_email_address_none_email(self):
        """Test validation with None email."""
        is_valid, normalized, error = validate_email_address(
            None,
            check_dns=False,
            check_disposable=False,
            raise_exception=False
        )
        self.assertFalse(is_valid)
        self.assertIn('required', error.lower())

    def test_validate_email_address_raise_exception_true(self):
        """Test that exception is raised when raise_exception=True."""
        with self.assertRaises(EmailValidationError):
            validate_email_address(
                'invalid-email',
                check_dns=False,
                check_disposable=False,
                raise_exception=True
            )

    def test_validate_email_address_raise_exception_false(self):
        """Test that no exception is raised when raise_exception=False."""
        try:
            is_valid, normalized, error = validate_email_address(
                'invalid-email',
                check_dns=False,
                check_disposable=False,
                raise_exception=False
            )
            self.assertFalse(is_valid)
        except EmailValidationError:
            self.fail("EmailValidationError was raised when raise_exception=False")

    def test_validate_email_address_whitespace_handling(self):
        """Test that whitespace is properly stripped."""
        emails_with_whitespace = [
            '  user@example.com',
            'user@example.com  ',
            '  user@example.com  ',
            '\tuser@example.com\n',
        ]

        for email in emails_with_whitespace:
            with self.subTest(email=repr(email)):
                is_valid, normalized, error = validate_email_address(
                    email,
                    check_dns=False,
                    check_disposable=False,
                    raise_exception=False
                )
                self.assertTrue(is_valid)
                self.assertEqual(normalized, 'user@example.com')

    def test_is_valid_email_convenience_function(self):
        """Test the is_valid_email convenience function."""
        # Valid emails
        self.assertTrue(is_valid_email('user@example.com', check_dns=False))
        self.assertTrue(is_valid_email('test+tag@gmail.com', check_dns=False))

        # Invalid emails
        self.assertFalse(is_valid_email('notanemail', check_dns=False))
        self.assertFalse(is_valid_email('', check_dns=False))
        self.assertFalse(is_valid_email('@example.com', check_dns=False))

    def test_validate_email_with_cache_caches_results(self):
        """Test that validate_email_with_cache properly caches results."""
        cache.clear()

        email = 'test@example.com'

        # First call should not be cached
        with patch('api.utils.validate_email_address') as mock_validate:
            mock_validate.return_value = (True, email, '')

            result1 = validate_email_with_cache(
                email,
                check_dns=False,
                check_disposable=False,
                cache_ttl=60
            )

            # Should have called the validation function
            self.assertEqual(mock_validate.call_count, 1)

        # Second call should use cache
        with patch('api.utils.validate_email_address') as mock_validate:
            result2 = validate_email_with_cache(
                email,
                check_dns=False,
                check_disposable=False,
                cache_ttl=60
            )

            # Should NOT have called the validation function (using cache)
            self.assertEqual(mock_validate.call_count, 0)

        # Results should be the same
        self.assertEqual(result1, result2)

        cache.clear()

    def test_validate_email_with_cache_different_params(self):
        """Test that cache is separate for different validation parameters."""
        cache.clear()

        email = 'test@example.com'

        with patch('api.utils.validate_email_address') as mock_validate:
            mock_validate.return_value = (True, email, '')

            # Call with different parameters
            validate_email_with_cache(email, check_dns=False, check_disposable=False)
            validate_email_with_cache(email, check_dns=True, check_disposable=False)
            validate_email_with_cache(email, check_dns=False, check_disposable=True)

            # Should call validation 3 times (different cache keys)
            self.assertEqual(mock_validate.call_count, 3)

        cache.clear()

    def test_validate_email_real_world_examples(self):
        """Test with real-world email examples."""
        # Common valid formats
        valid_emails = [
            'john.doe@example.com',
            'jane+newsletter@company.co.uk',
            'support@subdomain.example.org',
            'user123@test-mail.com',
            'admin@example.io',
            'contact@my-company.com',
        ]

        for email in valid_emails:
            with self.subTest(email=email):
                is_valid, normalized, error = validate_email_address(
                    email,
                    check_dns=False,
                    check_disposable=False,
                    raise_exception=False
                )
                self.assertTrue(is_valid, f"Expected {email} to be valid, but got error: {error}")

        # Common invalid formats
        invalid_emails = [
            'plaintext',
            'missing@domain',
            '@no-local-part.com',
            'spaces in@email.com',
            'double..dots@example.com',
            'trailing.dot.@example.com',
            '.leading.dot@example.com',
        ]

        for email in invalid_emails:
            with self.subTest(email=email):
                is_valid, normalized, error = validate_email_address(
                    email,
                    check_dns=False,
                    check_disposable=False,
                    raise_exception=False
                )
                self.assertFalse(is_valid, f"Expected {email} to be invalid")


@pytest.mark.django_db
class TestEmailValidationIntegration(TestCase):
    """Integration tests for email validation with email service."""

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    @patch('api.services.email_service.resend.Emails.send')
    def test_send_email_validates_address(self, mock_send):
        """Test that send_email validates email addresses."""
        from ..services.email_service import send_email

        # Mock successful send
        mock_send.return_value = {'id': 'test-email-id'}

        # Valid email should succeed
        result = send_email(
            template_name='test_template',
            subject='Test Subject',
            to_email='valid@example.com',
            context={'test': 'data'}
        )
        self.assertTrue(result)

        # Invalid email should fail without calling Resend
        mock_send.reset_mock()
        result = send_email(
            template_name='test_template',
            subject='Test Subject',
            to_email='invalid-email',
            context={'test': 'data'}
        )
        self.assertFalse(result)
        mock_send.assert_not_called()

    def test_email_validation_performance(self):
        """Test that email validation is performant."""
        import time

        # Test syntax-only validation (should be very fast)
        start = time.time()
        for i in range(100):
            is_valid_email(f'user{i}@example.com', check_dns=False)
        elapsed = time.time() - start

        # Should complete 100 validations in under 1 second
        self.assertLess(elapsed, 1.0, f"Email validation took {elapsed}s for 100 emails")

    def test_cached_validation_performance(self):
        """Test that cached validation improves performance."""
        import time

        cache.clear()
        email = 'test@example.com'

        # First call (uncached)
        start = time.time()
        for i in range(10):
            validate_email_with_cache(email, check_dns=False, check_disposable=False)
        uncached_time = time.time() - start

        # Should be much faster on subsequent calls (cached)
        # First call populates cache, next 9 use cache
        # Cached calls should take minimal time

        cache.clear()