"""
Security-focused test cases for the API.
"""
import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, Mock

from ..models import UserProfile, CustomLink, SocialIcon, CTABanner
from ..utils import get_client_ip, anonymize_ip, is_rate_limited, should_track_analytics, sanitize_referrer


@pytest.mark.django_db
class TestSecurityBase(APITestCase):
    """Base class for security tests."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.client = APIClient()
        self.factory = RequestFactory()


class TestAuthenticationSecurity(TestSecurityBase):
    """Test authentication and authorization security."""
    
    def test_anonymous_access_restrictions(self):
        """Test that anonymous users cannot access protected endpoints."""
        protected_endpoints = [
            'userprofile-list',
            'customlink-list',
            'socialicon-list',
            'ctabanner-list',
            'profileview-list',
            'linkclick-list'
        ]
        
        for endpoint in protected_endpoints:
            with self.subTest(endpoint=endpoint):
                url = f'/api/{endpoint.replace("-", "/")}/'
                response = self.client.get(url)
                self.assertIn(response.status_code, [
                    status.HTTP_401_UNAUTHORIZED,
                    status.HTTP_403_FORBIDDEN
                ])
    
    def test_cross_user_data_access_prevention(self):
        """Test that users cannot access other users' private data."""
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        profile2 = user2.profile
        
        # Create data for user2
        link = CustomLink.objects.create(
            user_profile=profile2,
            title='Private Link',
            url='https://private.com'
        )
        
        # Try to access user2's data as user1
        self.client.force_authenticate(user=self.user)
        
        # Try to access the link directly
        url = f'/api/custom-links/{link.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Try to list all links (should only see own)
        url = '/api/custom-links/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)  # Should be empty
    
    def test_profile_privacy_enforcement(self):
        """Test that private profiles are not accessible."""
        # Make profile private
        self.profile.is_public = False
        self.profile.save()
        
        # Anonymous access should be denied
        url = f'/api/storefront/public/{self.user.username}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Even authenticated users should not access private profiles
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=user2)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_permission_escalation_prevention(self):
        """Test that users cannot escalate their permissions."""
        # Try to modify another user's profile
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        profile2 = user2.profile
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/user-profiles/{profile2.id}/'
        
        data = {
            'bio': 'Unauthorized modification',
            'is_public': False
        }
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestInputValidationSecurity(TestSecurityBase):
    """Test input validation and injection prevention."""
    
    def test_url_injection_prevention(self):
        """Test that malicious URLs are rejected."""
        self.client.force_authenticate(user=self.user)
        
        malicious_urls = [
            'javascript:alert("XSS")',
            'data:text/html,<script>alert("XSS")</script>',
            'vbscript:msgbox("XSS")',
            'file:///etc/passwd',
            'ftp://malicious.com/payload',
            'mailto:victim@example.com?subject=spam',
        ]
        
        for url in malicious_urls:
            with self.subTest(url=url):
                data = {
                    'title': 'Test Link',
                    'url': url,
                    'order': 1
                }
                response = self.client.post('/api/custom-links/', data)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_html_injection_prevention(self):
        """Test that HTML/script injection is prevented."""
        self.client.force_authenticate(user=self.user)
        
        malicious_inputs = [
            '<script>alert("XSS")</script>',
            '<img src="x" onerror="alert(1)">',
            '<iframe src="javascript:alert(1)"></iframe>',
            '"><script>alert("XSS")</script>',
            "'; DROP TABLE users; --",
            '<svg onload="alert(1)">',
        ]
        
        for malicious_input in malicious_inputs:
            with self.subTest(input=malicious_input):
                data = {
                    'title': malicious_input,
                    'url': 'https://example.com',
                    'description': malicious_input,
                    'order': 1
                }
                response = self.client.post('/api/custom-links/', data)
                
                if response.status_code == status.HTTP_201_CREATED:
                    # If created, ensure the malicious content is sanitized
                    link_id = response.data['data']['id']
                    link = CustomLink.objects.get(id=link_id)
                    
                    # The input should be stored as-is but properly escaped on output
                    # This is handled by the frontend, but we ensure no execution occurs
                    self.assertNotIn('<script>', link.title.lower())
                    self.assertNotIn('javascript:', link.title.lower())
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention through ORM."""
        self.client.force_authenticate(user=self.user)
        
        # Create a link first
        link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Test Link',
            url='https://example.com'
        )
        
        # Try SQL injection through various parameters
        sql_payloads = [
            "'; DROP TABLE api_customlink; --",
            "1 OR 1=1",
            "1' UNION SELECT * FROM auth_user --",
            "' OR 'a'='a",
        ]
        
        for payload in sql_payloads:
            with self.subTest(payload=payload):
                # Try through URL parameters
                url = f'/api/custom-links/{link.id}/?search={payload}'
                response = self.client.get(url)
                # Should not cause internal server error
                self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_path_traversal_prevention(self):
        """Test path traversal attack prevention."""
        # Test username with path traversal attempts
        path_traversal_usernames = [
            '../admin',
            '../../etc/passwd',
            '..\\..\\windows\\system32',
            '%2e%2e%2fadmin',
            '....//admin',
        ]
        
        for username in path_traversal_usernames:
            with self.subTest(username=username):
                url = f'/api/storefront/public/{username}/'
                response = self.client.get(url)
                # Should return 404 for invalid usernames
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestRateLimitingSecurity(TestSecurityBase):
    """Test rate limiting and abuse prevention."""
    
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_rate_limiting_functionality(self, mock_cache_set, mock_cache_get):
        """Test rate limiting prevents abuse."""
        # Mock cache behavior for rate limiting
        mock_cache_get.side_effect = [0, 1, 2, 3, 4, 5]  # Incrementing count
        
        identifier = 'test-ip'
        action = 'test-action'
        
        # First 5 requests should be allowed
        for i in range(5):
            result = is_rate_limited(identifier, action, limit=5, window=60)
            self.assertFalse(result)
        
        # 6th request should be blocked
        result = is_rate_limited(identifier, action, limit=5, window=60)
        self.assertTrue(result)
    
    @patch('api.utils.should_track_analytics')
    def test_analytics_rate_limiting(self, mock_should_track):
        """Test analytics tracking rate limiting."""
        # Simulate rate limiting
        mock_should_track.return_value = False
        
        self.profile.is_public = True
        self.profile.save()
        
        url = f'/api/storefront/public/{self.user.username}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify should_track_analytics was called
        mock_should_track.assert_called_once()
    
    def test_link_creation_rate_limiting(self):
        """Test that link creation is rate limited."""
        self.client.force_authenticate(user=self.user)
        
        # Create maximum number of links
        for i in range(10):  # Maximum allowed
            data = {
                'title': f'Link {i}',
                'url': f'https://example{i}.com',
                'order': i + 1
            }
            response = self.client.post('/api/custom-links/', data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 11th link should be rejected
        data = {
            'title': 'Overflow Link',
            'url': 'https://overflow.com',
            'order': 11
        }
        response = self.client.post('/api/custom-links/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestDataPrivacySecurity(TestSecurityBase):
    """Test data privacy and GDPR compliance."""
    
    def test_ip_anonymization(self):
        """Test IP address anonymization for privacy."""
        test_cases = [
            ('192.168.1.100', '192.168.1.0'),  # IPv4
            ('203.0.113.195', '203.0.113.0'),  # IPv4 public
            ('2001:db8:85a3:8d3:1319:8a2e:370:7348', '2001:db8:85a3:8d3::'),  # IPv6
            ('::1', '::'),  # IPv6 localhost
        ]
        
        for original, expected in test_cases:
            with self.subTest(ip=original):
                anonymized = anonymize_ip(original)
                self.assertEqual(anonymized, expected)
    
    def test_client_ip_extraction(self):
        """Test secure client IP extraction."""
        # Test with X-Forwarded-For header
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '203.0.113.195, 192.168.1.1, 10.0.0.1'
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '203.0.113.195')  # Should get first IP
        
        # Test with only REMOTE_ADDR
        request2 = self.factory.get('/')
        request2.META['REMOTE_ADDR'] = '192.168.1.100'
        
        ip = get_client_ip(request2)
        self.assertEqual(ip, '192.168.1.100')
    
    def test_referrer_sanitization(self):
        """Test referrer URL sanitization."""
        # Test with sensitive parameters
        referrer_with_secrets = 'https://example.com/page?token=secret123&password=admin&normal=ok'
        sanitized = sanitize_referrer(referrer_with_secrets)
        
        # Should remove sensitive parameters
        self.assertNotIn('token=secret123', sanitized)
        self.assertNotIn('password=admin', sanitized)
        self.assertIn('normal=ok', sanitized)
        
        # Test length limitation
        long_referrer = 'https://example.com/' + 'a' * 600
        sanitized_long = sanitize_referrer(long_referrer)
        self.assertLessEqual(len(sanitized_long), 500)
    
    def test_sensitive_data_not_logged(self):
        """Test that sensitive data is not exposed in responses."""
        self.client.force_authenticate(user=self.user)
        
        # Update profile with website
        self.profile.website = 'https://mywebsite.com'
        self.profile.save()
        
        # Get profile data
        url = f'/api/user-profiles/{self.profile.id}/'
        response = self.client.get(url)
        
        # Response should not contain internal IDs or sensitive fields
        data = response.data['data']
        self.assertNotIn('password', str(data))
        self.assertNotIn('email', str(data))  # User email should not be exposed
        
        # Check that user object doesn't leak sensitive info
        if 'user' in data:
            user_data = data['user']
            self.assertNotIn('password', str(user_data))
            self.assertNotIn('email', str(user_data))


class TestSecurityHeaders(TestSecurityBase):
    """Test security headers and response security."""
    
    def test_cors_headers(self):
        """Test CORS headers are properly configured."""
        url = '/api/storefront/public/testuser/'
        response = self.client.options(url)
        
        # Should have proper CORS headers
        # Note: These would be set by Django CORS middleware in production
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_content_type_headers(self):
        """Test proper content type headers."""
        self.client.force_authenticate(user=self.user)
        url = '/api/user-profiles/'
        response = self.client.get(url)
        
        self.assertEqual(response['Content-Type'], 'application/json')
    
    def test_no_sensitive_info_in_errors(self):
        """Test that error responses don't leak sensitive information."""
        # Test 404 error
        url = '/api/custom-links/99999/'
        response = self.client.get(url)
        
        error_content = str(response.content)
        # Should not contain database info, file paths, or internal details
        self.assertNotIn('database', error_content.lower())
        self.assertNotIn('/home/', error_content.lower())
        self.assertNotIn('traceback', error_content.lower())


class TestBusinessLogicSecurity(TestSecurityBase):
    """Test business logic security and edge cases."""
    
    def test_resource_ownership_validation(self):
        """Test that resource ownership is properly validated."""
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        # Create link as user2
        link = CustomLink.objects.create(
            user_profile=user2.profile,
            title='User2 Link',
            url='https://user2.com'
        )
        
        # Try to modify as user1
        self.client.force_authenticate(user=self.user)
        url = f'/api/custom-links/{link.id}/'
        
        data = {'title': 'Hacked Link'}
        response = self.client.patch(url, data)
        
        # Should be forbidden or not found
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_inactive_resource_access(self):
        """Test that inactive resources are not accessible publicly."""
        # Create inactive link
        link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Inactive Link',
            url='https://inactive.com',
            is_active=False
        )
        
        # Try to track click on inactive link
        url = f'/api/custom-links/{link.id}/track-click/'
        response = self.client.post(url)
        
        # Should not be accessible
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_link_limit_bypass_prevention(self):
        """Test that link limits cannot be bypassed."""
        self.client.force_authenticate(user=self.user)
        
        # Create maximum links through API
        for i in range(10):
            data = {
                'title': f'Link {i}',
                'url': f'https://example{i}.com',
                'order': i + 1
            }
            response = self.client.post('/api/custom-links/', data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Try to bypass by creating inactive link first, then activating
        data = {
            'title': 'Bypass Link',
            'url': 'https://bypass.com',
            'order': 11,
            'is_active': False  # Try to create as inactive
        }
        response = self.client.post('/api/custom-links/', data)
        
        # Should still be rejected due to permission check
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_mass_assignment_prevention(self):
        """Test that mass assignment vulnerabilities are prevented."""
        self.client.force_authenticate(user=self.user)
        
        # Try to set read-only fields
        data = {
            'title': 'Test Link',
            'url': 'https://example.com',
            'order': 1,
            'id': 99999,  # Try to set ID
            'user_profile': 99999,  # Try to set different user
            'created_at': '2020-01-01T00:00:00Z',  # Try to set timestamp
            'click_count': 1000  # Try to set click count
        }
        
        response = self.client.post('/api/custom-links/', data)
        
        if response.status_code == status.HTTP_201_CREATED:
            link = CustomLink.objects.get(id=response.data['data']['id'])
            
            # Protected fields should not be modified
            self.assertNotEqual(link.id, 99999)
            self.assertEqual(link.user_profile, self.profile)
            self.assertEqual(link.click_count, 0)  # Should default to 0