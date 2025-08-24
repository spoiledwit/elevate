"""
Test cases for API serializers.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from rest_framework.exceptions import ValidationError

from ..models import UserProfile, CustomLink, SocialIcon, CTABanner, ProfileView, LinkClick
from ..serializers import (
    UserProfileSerializer, CustomLinkSerializer, SocialIconSerializer,
    CTABannerSerializer, ProfileViewSerializer, LinkClickSerializer,
    UserProfilePublicSerializer
)


@pytest.mark.django_db
class TestUserProfileSerializer(TestCase):
    """Test UserProfileSerializer functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_serializer_fields(self):
        """Test serializer includes expected fields."""
        serializer = UserProfileSerializer(instance=self.profile)
        expected_fields = {
            'id', 'user', 'username', 'bio', 'profile_picture', 'website',
            'is_public', 'created_at', 'updated_at', 'custom_links',
            'social_icons', 'cta_banners'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
    
    def test_serializer_read_only_fields(self):
        """Test that certain fields are read-only."""
        data = {
            'id': 999,
            'user': 999,
            'created_at': '2023-01-01T00:00:00Z',
            'updated_at': '2023-01-01T00:00:00Z',
            'username': 'newusername',
            'bio': 'New bio'
        }
        
        serializer = UserProfileSerializer(instance=self.profile, data=data)
        self.assertTrue(serializer.is_valid())
        
        # Update instance
        updated_profile = serializer.save()
        
        # Read-only fields should not have changed
        self.assertNotEqual(updated_profile.id, 999)
        self.assertNotEqual(updated_profile.user.id, 999)
        # But editable fields should have changed
        self.assertEqual(updated_profile.bio, 'New bio')
    
    def test_website_url_validation(self):
        """Test website URL validation."""
        # Valid URLs
        valid_urls = [
            'https://example.com',
            'http://example.com',
            'https://subdomain.example.com/path',
            ''  # Empty should be allowed
        ]
        
        for url in valid_urls:
            with self.subTest(url=url):
                data = {'website': url}
                serializer = UserProfileSerializer(instance=self.profile, data=data, partial=True)
                self.assertTrue(serializer.is_valid(), f"URL {url} should be valid")
        
        # Invalid URLs
        invalid_urls = [
            'ftp://example.com',
            'javascript:alert(1)',
            'not-a-url',
            'http://',
            'https://'
        ]
        
        for url in invalid_urls:
            with self.subTest(url=url):
                data = {'website': url}
                serializer = UserProfileSerializer(instance=self.profile, data=data, partial=True)
                self.assertFalse(serializer.is_valid(), f"URL {url} should be invalid")


@pytest.mark.django_db
class TestUserProfilePublicSerializer(TestCase):
    """Test PublicUserProfileSerializer functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_public_serializer_fields(self):
        """Test public serializer only includes safe fields."""
        serializer = UserProfilePublicSerializer(instance=self.profile)
        expected_fields = {
            'id', 'username', 'bio', 'profile_picture', 'website',
            'custom_links', 'social_icons', 'cta_banners'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
        
        # Should not include private fields
        private_fields = {'user', 'is_public', 'created_at', 'updated_at'}
        for field in private_fields:
            self.assertNotIn(field, serializer.data.keys())
    
    def test_nested_serializers_only_active(self):
        """Test that nested serializers only include active items."""
        # Create active and inactive items
        CustomLink.objects.create(
            user_profile=self.profile,
            title='Active Link',
            url='https://active.com',
            is_active=True
        )
        CustomLink.objects.create(
            user_profile=self.profile,
            title='Inactive Link',
            url='https://inactive.com',
            is_active=False
        )
        
        serializer = UserProfilePublicSerializer(instance=self.profile)
        
        # Should only include active links
        self.assertEqual(len(serializer.data['custom_links']), 1)
        self.assertEqual(serializer.data['custom_links'][0]['title'], 'Active Link')


@pytest.mark.django_db
class TestCustomLinkSerializer(TestCase):
    """Test CustomLinkSerializer functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_serializer_fields(self):
        """Test serializer includes expected fields."""
        link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Test Link',
            url='https://example.com'
        )
        
        serializer = CustomLinkSerializer(instance=link)
        expected_fields = {
            'id', 'title', 'url', 'description', 'order', 'is_active',
            'click_count', 'created_at', 'updated_at'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
    
    def test_url_validation(self):
        """Test URL validation for custom links."""
        # Valid URLs
        valid_urls = [
            'https://example.com',
            'http://example.com',
            'https://subdomain.example.com/path?param=value',
            'https://example.com:8080/path'
        ]
        
        for url in valid_urls:
            with self.subTest(url=url):
                data = {
                    'title': 'Test Link',
                    'url': url,
                    'order': 1
                }
                serializer = CustomLinkSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"URL {url} should be valid")
        
        # Invalid URLs
        invalid_urls = [
            '',  # Empty URL
            'ftp://example.com',
            'javascript:alert(1)',
            'data:text/html,<script>alert(1)</script>',
            'not-a-url',
            'http://',
            'https://'
        ]
        
        for url in invalid_urls:
            with self.subTest(url=url):
                data = {
                    'title': 'Test Link',
                    'url': url,
                    'order': 1
                }
                serializer = CustomLinkSerializer(data=data)
                self.assertFalse(serializer.is_valid(), f"URL {url} should be invalid")
    
    def test_title_validation(self):
        """Test title field validation."""
        # Valid titles
        valid_titles = [
            'My Website',
            'Link to Cool Stuff',
            'Test Link 123',
            'A' * 100  # Max length
        ]
        
        for title in valid_titles:
            with self.subTest(title=title):
                data = {
                    'title': title,
                    'url': 'https://example.com',
                    'order': 1
                }
                serializer = CustomLinkSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"Title '{title}' should be valid")
        
        # Invalid titles
        invalid_titles = [
            '',  # Empty title
            'A' * 101,  # Too long
        ]
        
        for title in invalid_titles:
            with self.subTest(title=title):
                data = {
                    'title': title,
                    'url': 'https://example.com',
                    'order': 1
                }
                serializer = CustomLinkSerializer(data=data)
                self.assertFalse(serializer.is_valid(), f"Title '{title}' should be invalid")
    
    def test_description_validation(self):
        """Test description field validation."""
        # Valid description (up to 200 characters)
        valid_description = 'A' * 200
        data = {
            'title': 'Test Link',
            'url': 'https://example.com',
            'description': valid_description,
            'order': 1
        }
        serializer = CustomLinkSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Invalid description (too long)
        invalid_description = 'A' * 201
        data = {
            'title': 'Test Link',
            'url': 'https://example.com',
            'description': invalid_description,
            'order': 1
        }
        serializer = CustomLinkSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_order_validation(self):
        """Test order field validation."""
        # Valid orders
        valid_orders = [1, 5, 10, 100]
        
        for order in valid_orders:
            with self.subTest(order=order):
                data = {
                    'title': 'Test Link',
                    'url': 'https://example.com',
                    'order': order
                }
                serializer = CustomLinkSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"Order {order} should be valid")
        
        # Invalid orders
        invalid_orders = [0, -1, -5]
        
        for order in invalid_orders:
            with self.subTest(order=order):
                data = {
                    'title': 'Test Link',
                    'url': 'https://example.com',
                    'order': order
                }
                serializer = CustomLinkSerializer(data=data)
                self.assertFalse(serializer.is_valid(), f"Order {order} should be invalid")


@pytest.mark.django_db
class TestSocialIconSerializer(TestCase):
    """Test SocialIconSerializer functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_serializer_fields(self):
        """Test serializer includes expected fields."""
        icon = SocialIcon.objects.create(
            user_profile=self.profile,
            platform='Twitter',
            url='https://twitter.com/user'
        )
        
        serializer = SocialIconSerializer(instance=icon)
        expected_fields = {
            'id', 'platform', 'url', 'icon_class', 'order', 'is_active',
            'created_at', 'updated_at'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
    
    def test_platform_validation(self):
        """Test platform field validation."""
        # Valid platforms
        valid_platforms = [
            'Twitter',
            'Facebook',
            'LinkedIn',
            'Instagram',
            'GitHub',
            'YouTube'
        ]
        
        for platform in valid_platforms:
            with self.subTest(platform=platform):
                data = {
                    'platform': platform,
                    'url': 'https://example.com/user',
                    'order': 1
                }
                serializer = SocialIconSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"Platform {platform} should be valid")
        
        # Invalid platforms
        invalid_platforms = [
            '',  # Empty
            'A' * 31,  # Too long
        ]
        
        for platform in invalid_platforms:
            with self.subTest(platform=platform):
                data = {
                    'platform': platform,
                    'url': 'https://example.com/user',
                    'order': 1
                }
                serializer = SocialIconSerializer(data=data)
                self.assertFalse(serializer.is_valid(), f"Platform {platform} should be invalid")
    
    def test_url_validation(self):
        """Test URL validation for social icons."""
        # Valid URLs
        valid_urls = [
            'https://twitter.com/username',
            'https://facebook.com/username',
            'https://linkedin.com/in/username',
            'https://github.com/username'
        ]
        
        for url in valid_urls:
            with self.subTest(url=url):
                data = {
                    'platform': 'Twitter',
                    'url': url,
                    'order': 1
                }
                serializer = SocialIconSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"URL {url} should be valid")


@pytest.mark.django_db
class TestCTABannerSerializer(TestCase):
    """Test CTABannerSerializer functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_serializer_fields(self):
        """Test serializer includes expected fields."""
        banner = CTABanner.objects.create(
            user_profile=self.profile,
            title='Subscribe',
            button_text='Sign Up',
            button_url='https://example.com/signup'
        )
        
        serializer = CTABannerSerializer(instance=banner)
        expected_fields = {
            'id', 'title', 'subtitle', 'button_text', 'button_url',
            'background_color', 'text_color', 'is_active',
            'created_at', 'updated_at'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
    
    def test_required_fields(self):
        """Test required field validation."""
        # Missing required fields
        data = {}
        serializer = CTABannerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        
        required_fields = ['title', 'button_text', 'button_url']
        for field in required_fields:
            self.assertIn(field, serializer.errors)
        
        # Valid data with required fields
        valid_data = {
            'title': 'Subscribe Now',
            'button_text': 'Subscribe',
            'button_url': 'https://example.com/subscribe'
        }
        serializer = CTABannerSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
    
    def test_title_validation(self):
        """Test title field validation."""
        # Valid title
        data = {
            'title': 'Subscribe to Newsletter',
            'button_text': 'Subscribe',
            'button_url': 'https://example.com/subscribe'
        }
        serializer = CTABannerSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Invalid title (too long)
        data = {
            'title': 'A' * 101,  # Max length is 100
            'button_text': 'Subscribe',
            'button_url': 'https://example.com/subscribe'
        }
        serializer = CTABannerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_button_url_validation(self):
        """Test button URL validation."""
        # Valid URLs
        valid_urls = [
            'https://example.com',
            'https://example.com/path',
            'https://subdomain.example.com'
        ]
        
        for url in valid_urls:
            with self.subTest(url=url):
                data = {
                    'title': 'Subscribe',
                    'button_text': 'Click Me',
                    'button_url': url
                }
                serializer = CTABannerSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"URL {url} should be valid")
        
        # Invalid URLs
        invalid_urls = [
            'ftp://example.com',
            'javascript:alert(1)',
            'not-a-url'
        ]
        
        for url in invalid_urls:
            with self.subTest(url=url):
                data = {
                    'title': 'Subscribe',
                    'button_text': 'Click Me',
                    'button_url': url
                }
                serializer = CTABannerSerializer(data=data)
                self.assertFalse(serializer.is_valid(), f"URL {url} should be invalid")
    
    def test_color_validation(self):
        """Test color field validation."""
        # Valid colors
        valid_colors = [
            '#FF0000',  # Red
            '#00FF00',  # Green
            '#0000FF',  # Blue
            '#123456',  # Custom hex
        ]
        
        for color in valid_colors:
            with self.subTest(color=color):
                data = {
                    'title': 'Subscribe',
                    'button_text': 'Click Me',
                    'button_url': 'https://example.com',
                    'background_color': color
                }
                serializer = CTABannerSerializer(data=data)
                self.assertTrue(serializer.is_valid(), f"Color {color} should be valid")
        
        # Invalid colors
        invalid_colors = [
            'red',  # Named colors not supported
            '#GGG',  # Invalid hex
            '#12345',  # Wrong length
            'rgb(255, 0, 0)'  # RGB format not supported
        ]
        
        for color in invalid_colors:
            with self.subTest(color=color):
                data = {
                    'title': 'Subscribe',
                    'button_text': 'Click Me',
                    'button_url': 'https://example.com',
                    'background_color': color
                }
                serializer = CTABannerSerializer(data=data)
                self.assertFalse(serializer.is_valid(), f"Color {color} should be invalid")


@pytest.mark.django_db
class TestAnalyticsSerializers(TestCase):
    """Test analytics serializers."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.custom_link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Test Link',
            url='https://example.com'
        )
    
    def test_profile_view_serializer(self):
        """Test ProfileViewSerializer functionality."""
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0 Test Browser',
            referrer='https://google.com'
        )
        
        serializer = ProfileViewSerializer(instance=view)
        expected_fields = {
            'id', 'user_profile', 'ip_address', 'user_agent',
            'referrer', 'timestamp'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
    
    def test_link_click_serializer(self):
        """Test LinkClickSerializer functionality."""
        click = LinkClick.objects.create(
            custom_link=self.custom_link,
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0 Test Browser',
            referrer='https://profile.com/testuser'
        )
        
        serializer = LinkClickSerializer(instance=click)
        expected_fields = {
            'id', 'custom_link', 'ip_address', 'user_agent',
            'referrer', 'timestamp'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)
    
    def test_analytics_serializers_read_only(self):
        """Test that analytics serializers are read-only."""
        # ProfileViewSerializer
        data = {
            'ip_address': '10.0.0.1',
            'user_agent': 'Different Browser',
            'referrer': 'https://example.com'
        }
        
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        
        serializer = ProfileViewSerializer(instance=view, data=data)
        self.assertTrue(serializer.is_valid())
        
        # Save and check that original values are preserved
        updated_view = serializer.save()
        self.assertEqual(updated_view.ip_address, '192.168.1.100')  # Should not change
        
        # LinkClickSerializer
        click_data = {
            'ip_address': '10.0.0.1',
            'user_agent': 'Different Browser'
        }
        
        click = LinkClick.objects.create(
            custom_link=self.custom_link,
            ip_address='192.168.1.100'
        )
        
        click_serializer = LinkClickSerializer(instance=click, data=click_data)
        self.assertTrue(click_serializer.is_valid())
        
        updated_click = click_serializer.save()
        self.assertEqual(updated_click.ip_address, '192.168.1.100')  # Should not change


@pytest.mark.django_db
class TestSerializerValidationEdgeCases(TestCase):
    """Test edge cases and validation scenarios."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_partial_updates(self):
        """Test partial updates work correctly."""
        link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Original Title',
            url='https://original.com'
        )
        
        # Partial update - only title
        data = {'title': 'Updated Title'}
        serializer = CustomLinkSerializer(instance=link, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_link = serializer.save()
        self.assertEqual(updated_link.title, 'Updated Title')
        self.assertEqual(updated_link.url, 'https://original.com')  # Should remain unchanged
    
    def test_empty_string_handling(self):
        """Test handling of empty strings in optional fields."""
        data = {
            'title': 'Test Link',
            'url': 'https://example.com',
            'description': '',  # Empty string
            'order': 1
        }
        
        serializer = CustomLinkSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Should handle empty description gracefully
        link = serializer.save(user_profile=self.profile)
        self.assertEqual(link.description, '')
    
    def test_unicode_handling(self):
        """Test handling of Unicode characters."""
        data = {
            'title': 'Test Link 🚀',
            'url': 'https://example.com',
            'description': 'Description with émojis and ünïcode',
            'order': 1
        }
        
        serializer = CustomLinkSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        link = serializer.save(user_profile=self.profile)
        self.assertEqual(link.title, 'Test Link 🚀')
        self.assertEqual(link.description, 'Description with émojis and ünïcode')