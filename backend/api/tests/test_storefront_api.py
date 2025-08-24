"""
Test cases for storefront API endpoints.
"""
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from unittest.mock import patch

from ..models import UserProfile, CustomLink, SocialIcon, CTABanner, ProfileView, LinkClick


@pytest.mark.django_db
class TestStorefrontAPIBase(APITestCase):
    """Base test class for storefront API tests."""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        self.profile1 = self.user1.profile
        self.profile2 = self.user2.profile
        
        self.client = APIClient()


class TestUserProfileViewSet(TestStorefrontAPIBase):
    """Test UserProfile ViewSet endpoints."""
    
    def test_list_profiles_authenticated(self):
        """Test listing profiles requires authentication."""
        url = reverse('storefront-profiles-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # With authentication
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_own_profile(self):
        """Test retrieving own profile."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-profiles-detail', kwargs={'pk': self.profile1.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'testuser1')
    
    def test_retrieve_other_profile_public(self):
        """Test retrieving other user's public profile by username."""
        self.profile2.is_active = True
        self.profile2.save()
        
        # Use the public endpoint which allows accessing other users' profiles
        url = f"/api/storefront/profiles/public/{self.user2.username}/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'testuser2')
    
    def test_retrieve_other_profile_private(self):
        """Test retrieving other user's inactive profile returns 404."""
        self.profile2.is_active = False
        self.profile2.save()
        
        # Use the public endpoint 
        url = f"/api/storefront/profiles/public/{self.user2.username}/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_own_profile(self):
        """Test updating own profile."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-profiles-detail', kwargs={'pk': self.profile1.pk})
        
        data = {
            'bio': 'Updated bio',
            'display_name': 'Updated Name'
        }
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile1.refresh_from_db()
        self.assertEqual(self.profile1.bio, 'Updated bio')
        self.assertEqual(self.profile1.display_name, 'Updated Name')
    
    def test_update_other_profile_forbidden(self):
        """Test updating other user's profile returns 404."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-profiles-detail', kwargs={'pk': self.profile2.pk})
        
        data = {'bio': 'Hacking attempt'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('api.utils.should_track_analytics')
    def test_retrieve_public_profile_by_username(self, mock_should_track):
        """Test retrieving public profile by username."""
        mock_should_track.return_value = True
        
        self.profile1.is_active = True
        self.profile1.save()
        
        url = reverse('storefront-profiles-retrieve-public', kwargs={'username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'testuser1')
        
        # Should create a ProfileView
        self.assertTrue(ProfileView.objects.filter(user_profile=self.profile1).exists())
    
    def test_retrieve_public_profile_private(self):
        """Test retrieving private profile by username returns 404."""
        self.profile1.is_active = False
        self.profile1.save()
        
        url = reverse('storefront-profiles-retrieve-public', kwargs={'username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_retrieve_public_profile_nonexistent(self):
        """Test retrieving nonexistent profile returns 404."""
        url = reverse('storefront-profiles-retrieve-public', kwargs={'username': 'nonexistent'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('api.utils.should_track_analytics')
    def test_analytics_not_tracked_when_rate_limited(self, mock_should_track):
        """Test analytics are not tracked when rate limited."""
        mock_should_track.return_value = False  # Simulate rate limiting
        
        self.profile1.is_active = True
        self.profile1.save()
        
        url = reverse('storefront-profiles-retrieve-public', kwargs={'username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should not create a ProfileView
        self.assertFalse(ProfileView.objects.filter(user_profile=self.profile1).exists())


class TestCustomLinkViewSet(TestStorefrontAPIBase):
    """Test CustomLink ViewSet endpoints."""
    
    def test_list_custom_links_authenticated(self):
        """Test listing custom links requires authentication."""
        url = reverse('storefront-links-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_own_custom_links(self):
        """Test listing own custom links."""
        # Create some links
        CustomLink.objects.create(
            user_profile=self.profile1,
            text='Link 1',
            url='https://example1.com',
            order=1
        )
        CustomLink.objects.create(
            user_profile=self.profile1,
            text='Link 2',
            url='https://example2.com',
            order=2
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_create_custom_link(self):
        """Test creating a custom link."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-list')
        
        data = {
            'text': 'New Link',
            'url': 'https://newlink.com',
            'description': 'A new link',
            'order': 1
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomLink.objects.filter(text='New Link').exists())
        
        # Check that user_profile is automatically set
        link = CustomLink.objects.get(text='New Link')
        self.assertEqual(link.user_profile, self.profile1)
    
    def test_create_custom_link_max_limit(self):
        """Test creating custom link when at maximum limit."""
        # Create 10 links (maximum allowed)
        for i in range(10):
            CustomLink.objects.create(
                user_profile=self.profile1,
                text=f'Link {i}',
                url=f'https://example{i}.com',
                order=i,
                is_active=True
            )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-list')
        
        data = {
            'text': 'Over Limit Link',
            'url': 'https://overlimit.com',
            'order': 11
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_retrieve_custom_link(self):
        """Test retrieving a specific custom link."""
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Test Link',
            url='https://test.com'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-detail', kwargs={'pk': link.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['title'], 'Test Link')
    
    def test_update_custom_link(self):
        """Test updating a custom link."""
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Original Title',
            url='https://original.com'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-detail', kwargs={'pk': link.pk})
        
        data = {
            'text': 'Updated Title',
            'description': 'Updated description'
        }
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        link.refresh_from_db()
        self.assertEqual(link.title, 'Updated Title')
        self.assertEqual(link.description, 'Updated description')
    
    def test_delete_custom_link(self):
        """Test deleting a custom link."""
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='To Delete',
            url='https://delete.com'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-detail', kwargs={'pk': link.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CustomLink.objects.filter(pk=link.pk).exists())
    
    def test_access_other_user_link_forbidden(self):
        """Test accessing other user's link is forbidden."""
        link = CustomLink.objects.create(
            user_profile=self.profile2,
            text='Other User Link',
            url='https://other.com'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-detail', kwargs={'pk': link.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('api.utils.should_track_analytics')
    def test_track_link_click(self, mock_should_track):
        """Test tracking link clicks."""
        mock_should_track.return_value = True
        
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Clickable Link',
            url='https://clickme.com'
        )
        
        url = reverse('storefront-links-track-click', kwargs={'pk': link.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should create a LinkClick record
        self.assertTrue(LinkClick.objects.filter(custom_link=link).exists())
        
        # Should increment click count
        link.refresh_from_db()
        self.assertEqual(link.click_count, 1)
    
    def test_track_inactive_link_click_forbidden(self):
        """Test tracking clicks on inactive links is forbidden."""
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Inactive Link',
            url='https://inactive.com',
            is_active=False
        )
        
        url = reverse('storefront-links-track-click', kwargs={'pk': link.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestSocialIconViewSet(TestStorefrontAPIBase):
    """Test SocialIcon ViewSet endpoints."""
    
    def test_create_social_icon(self):
        """Test creating a social icon."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-social-icons-list')
        
        data = {
            'platform': 'twitter',
            'url': 'https://twitter.com/testuser'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SocialIcon.objects.filter(platform='twitter').exists())
    
    def test_create_social_icon_max_limit(self):
        """Test creating social icon when at maximum limit."""
        # Create 8 icons (maximum allowed)
        platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'snapchat', 'pinterest']
        for i, platform in enumerate(platforms):
            SocialIcon.objects.create(
                user_profile=self.profile1,
                platform=platform,
                url=f'https://{platform}.com/user',
                is_active=True
            )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-social-icons-list')
        
        data = {
            'platform': 'Over Limit Platform',
            'url': 'https://overlimit.com/user',
            'order': 9
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_own_social_icons(self):
        """Test listing own social icons."""
        SocialIcon.objects.create(
            user_profile=self.profile1,
            platform='twitter',
            url='https://twitter.com/user'
        )
        SocialIcon.objects.create(
            user_profile=self.profile1,
            platform='github',
            url='https://github.com/user'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-social-icons-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class TestCTABannerViewSet(TestStorefrontAPIBase):
    """Test CTABanner ViewSet endpoints."""
    
    def test_create_cta_banner(self):
        """Test creating a CTA banner."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-cta-banners-list')
        
        data = {
            'text': 'Subscribe Now',
            'subtitle': 'Get updates',
            'button_text': 'Subscribe',
            'button_url': 'https://example.com/subscribe'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CTABanner.objects.filter(text='Subscribe Now').exists())
    
    def test_create_cta_banner_max_limit(self):
        """Test creating CTA banner when at maximum limit (1)."""
        # Create 1 banner (maximum allowed)
        CTABanner.objects.create(
            user_profile=self.profile1,
            text='Existing Banner',
            button_text='Click',
            button_url='https://existing.com',
            is_active=True
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-cta-banners-list')
        
        data = {
            'text': 'Second Banner',
            'button_text': 'Click Me',
            'button_url': 'https://second.com'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_cta_banner_allowed_at_limit(self):
        """Test updating CTA banner is allowed even when at limit."""
        banner = CTABanner.objects.create(
            user_profile=self.profile1,
            text='Original Title',
            button_text='Original Button',
            button_url='https://original.com',
            is_active=True
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-cta-banners-detail', kwargs={'pk': banner.pk})
        
        data = {
            'text': 'Updated Title',
            'subtitle': 'New subtitle'
        }
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        banner.refresh_from_db()
        self.assertEqual(banner.title, 'Updated Title')
        self.assertEqual(banner.subtitle, 'New subtitle')


class TestAnalyticsEndpoints(TestStorefrontAPIBase):
    """Test analytics-related endpoints."""
    
    def test_profile_analytics_action(self):
        """Test profile analytics action endpoint."""
        # Create some profile views
        ProfileView.objects.create(
            user_profile=self.profile1,
            ip_address='192.168.1.100',
            user_agent='Test Browser'
        )
        ProfileView.objects.create(
            user_profile=self.profile1,
            ip_address='192.168.1.101',
            user_agent='Another Browser'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-profiles-analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_views', response.data)
        self.assertEqual(response.data['total_views'], 2)
    
    def test_profile_analytics_other_user_forbidden(self):
        """Test accessing other user's analytics is forbidden."""
        ProfileView.objects.create(
            user_profile=self.profile2,
            ip_address='192.168.1.100'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-profiles-analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see own analytics (empty in this case)
        self.assertEqual(len(response.data['data']), 0)
    
    def test_link_click_analytics_list(self):
        """Test listing link click analytics."""
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Test Link',
            url='https://test.com'
        )
        
        LinkClick.objects.create(
            custom_link=link,
            ip_address='192.168.1.100'
        )
        LinkClick.objects.create(
            custom_link=link,
            ip_address='192.168.1.101'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('linkclick-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class TestAPIErrorHandling(TestStorefrontAPIBase):
    """Test API error handling and edge cases."""
    
    def test_invalid_data_validation_error(self):
        """Test proper error handling for invalid data."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-list')
        
        # Invalid URL
        data = {
            'text': 'Invalid Link',
            'url': 'not-a-valid-url',
            'order': 1
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data['error'])
        self.assertIn('url', response.data['details'])
    
    def test_missing_required_fields(self):
        """Test error handling for missing required fields."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-list')
        
        # Missing title and URL
        data = {
            'description': 'Link without title or URL'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data['error'])
    
    def test_unauthorized_access(self):
        """Test proper error response for unauthorized access."""
        url = reverse('storefront-links-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(response.data['error'])
        self.assertEqual(response.data['message'], 'Authentication required')
    
    def test_not_found_error(self):
        """Test proper error response for not found resources."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-detail', kwargs={'pk': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(response.data['error'])
        self.assertEqual(response.data['message'], 'Resource not found')
    
    def test_method_not_allowed(self):
        """Test proper error response for unsupported methods."""
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Test Link',
            url='https://test.com'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('storefront-links-track-click', kwargs={'pk': link.pk})
        
        # GET not allowed on track-click endpoint
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)