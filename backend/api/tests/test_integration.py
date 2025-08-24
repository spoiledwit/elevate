"""
Integration tests for the complete storefront workflow.
"""
import pytest
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

from ..models import UserProfile, CustomLink, SocialIcon, CTABanner, ProfileView, LinkClick


@pytest.mark.django_db
class TestStorefrontIntegrationWorkflow(TransactionTestCase):
    """Test complete storefront creation and management workflow."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='storefront_user',
            email='storefront@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_complete_storefront_setup_workflow(self):
        """Test the complete workflow of setting up a storefront."""
        
        # Step 1: Update user profile
        profile_data = {
            'bio': 'Welcome to my digital storefront!',
            'website': 'https://mywebsite.com',
            'is_public': True
        }
        
        url = reverse('userprofile-detail', kwargs={'pk': self.profile.pk})
        response = self.client.patch(url, profile_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify profile was updated
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.bio, 'Welcome to my digital storefront!')
        self.assertTrue(self.profile.is_public)
        
        # Step 2: Create custom links
        links_data = [
            {
                'title': 'My Blog',
                'url': 'https://myblog.com',
                'description': 'Read my latest posts',
                'order': 1
            },
            {
                'title': 'My Portfolio',
                'url': 'https://portfolio.com',
                'description': 'Check out my work',
                'order': 2
            },
            {
                'title': 'Contact Me',
                'url': 'https://contact.me',
                'description': 'Get in touch',
                'order': 3
            }
        ]
        
        created_links = []
        for link_data in links_data:
            url = reverse('customlink-list')
            response = self.client.post(url, link_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_links.append(response.data['data'])
        
        # Verify links were created and ordered correctly
        self.assertEqual(len(created_links), 3)
        self.assertEqual(created_links[0]['order'], 1)
        self.assertEqual(created_links[1]['order'], 2)
        self.assertEqual(created_links[2]['order'], 3)
        
        # Step 3: Create social icons
        social_data = [
            {
                'platform': 'Twitter',
                'url': 'https://twitter.com/storefront_user',
                'icon_class': 'fab fa-twitter',
                'order': 1
            },
            {
                'platform': 'GitHub',
                'url': 'https://github.com/storefront_user',
                'icon_class': 'fab fa-github',
                'order': 2
            }
        ]
        
        created_icons = []
        for icon_data in social_data:
            url = reverse('socialicon-list')
            response = self.client.post(url, icon_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_icons.append(response.data['data'])
        
        self.assertEqual(len(created_icons), 2)
        
        # Step 4: Create CTA banner
        cta_data = {
            'title': 'Subscribe to Newsletter',
            'subtitle': 'Get weekly updates on new content',
            'button_text': 'Subscribe Now',
            'button_url': 'https://newsletter.signup.com',
            'background_color': '#007bff',
            'text_color': '#ffffff'
        }
        
        url = reverse('ctabanner-list')
        response = self.client.post(url, cta_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cta_banner = response.data['data']
        
        # Step 5: Verify complete storefront via public API
        url = reverse('userprofile-retrieve-public', kwargs={'username': 'storefront_user'})
        
        # Test without authentication (public access)
        public_client = APIClient()
        with patch('api.utils.should_track_analytics') as mock_track:
            mock_track.return_value = True
            response = public_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        public_data = response.data['data']
        
        # Verify all components are included
        self.assertEqual(public_data['username'], 'storefront_user')
        self.assertEqual(public_data['bio'], 'Welcome to my digital storefront!')
        self.assertEqual(public_data['website'], 'https://mywebsite.com')
        
        # Check custom links
        self.assertEqual(len(public_data['custom_links']), 3)
        self.assertEqual(public_data['custom_links'][0]['title'], 'My Blog')
        
        # Check social icons
        self.assertEqual(len(public_data['social_icons']), 2)
        self.assertEqual(public_data['social_icons'][0]['platform'], 'Twitter')
        
        # Check CTA banner
        self.assertEqual(len(public_data['cta_banners']), 1)
        self.assertEqual(public_data['cta_banners'][0]['title'], 'Subscribe to Newsletter')
        
        # Step 6: Verify analytics tracking
        self.assertTrue(ProfileView.objects.filter(user_profile=self.profile).exists())
        
        # Step 7: Test link click tracking
        first_link_id = created_links[0]['id']
        with patch('api.utils.should_track_analytics') as mock_track:
            mock_track.return_value = True
            
            url = reverse('customlink-track-click', kwargs={'pk': first_link_id})
            response = public_client.post(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify click was tracked
        link = CustomLink.objects.get(id=first_link_id)
        self.assertEqual(link.click_count, 1)
        self.assertTrue(LinkClick.objects.filter(custom_link=link).exists())
    
    def test_storefront_modification_workflow(self):
        """Test modifying an existing storefront."""
        
        # Create initial setup
        link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Original Link',
            url='https://original.com',
            order=1
        )
        
        icon = SocialIcon.objects.create(
            user_profile=self.profile,
            platform='Twitter',
            url='https://twitter.com/original'
        )
        
        # Step 1: Update existing link
        url = reverse('customlink-detail', kwargs={'pk': link.pk})
        update_data = {
            'title': 'Updated Link',
            'description': 'Now with description',
            'url': 'https://updated.com'
        }
        response = self.client.patch(url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        link.refresh_from_db()
        self.assertEqual(link.title, 'Updated Link')
        self.assertEqual(link.description, 'Now with description')
        
        # Step 2: Deactivate link
        deactivate_data = {'is_active': False}
        response = self.client.patch(url, deactivate_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        link.refresh_from_db()
        self.assertFalse(link.is_active)
        
        # Step 3: Verify inactive link doesn't appear in public view
        public_url = reverse('userprofile-retrieve-public', kwargs={'username': self.user.username})
        self.profile.is_public = True
        self.profile.save()
        
        public_client = APIClient()
        with patch('api.utils.should_track_analytics') as mock_track:
            mock_track.return_value = False  # Don't track for this test
            response = public_client.get(public_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not include inactive link
        self.assertEqual(len(response.data['data']['custom_links']), 0)
        
        # Step 4: Delete social icon
        icon_url = reverse('socialicon-detail', kwargs={'pk': icon.pk})
        response = self.client.delete(icon_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify deletion
        self.assertFalse(SocialIcon.objects.filter(pk=icon.pk).exists())


@pytest.mark.django_db
class TestAnalyticsIntegrationWorkflow(TransactionTestCase):
    """Test analytics tracking integration workflow."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='analytics_user',
            email='analytics@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.profile.is_public = True
        self.profile.save()
        
        self.link = CustomLink.objects.create(
            user_profile=self.profile,
            title='Tracked Link',
            url='https://tracked.com'
        )
        
        self.client = APIClient()
    
    @patch('api.utils.get_client_ip')
    @patch('api.utils.should_track_analytics')
    def test_profile_view_analytics_workflow(self, mock_should_track, mock_get_ip):
        """Test complete profile view analytics workflow."""
        mock_should_track.return_value = True
        mock_get_ip.return_value = '192.168.1.100'
        
        # Step 1: View profile multiple times from different IPs
        ips = ['192.168.1.100', '192.168.1.101', '192.168.1.102']
        
        for ip in ips:
            mock_get_ip.return_value = ip
            url = reverse('userprofile-retrieve-public', kwargs={'username': 'analytics_user'})
            
            # Add user agent and referrer
            response = self.client.get(
                url,
                HTTP_USER_AGENT='Test Browser 1.0',
                HTTP_REFERER='https://google.com'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 2: Verify analytics were recorded
        views = ProfileView.objects.filter(user_profile=self.profile)
        self.assertEqual(views.count(), 3)
        
        # Check that different IPs were recorded
        recorded_ips = set(view.ip_address for view in views)
        self.assertEqual(len(recorded_ips), 3)
        
        # Step 3: Access analytics as profile owner
        self.client.force_authenticate(user=self.user)
        url = reverse('profileview-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 3)
        
        # Verify analytics data structure
        first_view = response.data['data'][0]  # Most recent first
        expected_fields = {'id', 'user_profile', 'ip_address', 'user_agent', 'referrer', 'timestamp'}
        self.assertEqual(set(first_view.keys()), expected_fields)
    
    @patch('api.utils.get_client_ip')
    @patch('api.utils.should_track_analytics')
    def test_link_click_analytics_workflow(self, mock_should_track, mock_get_ip):
        """Test complete link click analytics workflow."""
        mock_should_track.return_value = True
        mock_get_ip.return_value = '203.0.113.195'
        
        # Step 1: Track multiple clicks on the link
        for i in range(5):
            url = reverse('customlink-track-click', kwargs={'pk': self.link.pk})
            response = self.client.post(
                url,
                HTTP_USER_AGENT=f'Browser {i}',
                HTTP_REFERER=f'https://referrer{i}.com'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 2: Verify click count was incremented
        self.link.refresh_from_db()
        self.assertEqual(self.link.click_count, 5)
        
        # Step 3: Verify click analytics were recorded
        clicks = LinkClick.objects.filter(custom_link=self.link)
        self.assertEqual(clicks.count(), 5)
        
        # Step 4: Access click analytics as profile owner
        self.client.force_authenticate(user=self.user)
        url = reverse('linkclick-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 5)
        
        # Verify all clicks belong to the user's links
        for click_data in response.data['data']:
            self.assertEqual(click_data['custom_link'], self.link.id)
    
    @patch('api.utils.is_rate_limited')
    def test_rate_limiting_integration(self, mock_is_rate_limited):
        """Test rate limiting integration with analytics."""
        # Step 1: First request should not be rate limited
        mock_is_rate_limited.return_value = False
        
        url = reverse('userprofile-retrieve-public', kwargs={'username': 'analytics_user'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should create analytics record
        self.assertEqual(ProfileView.objects.filter(user_profile=self.profile).count(), 1)
        
        # Step 2: Subsequent request should be rate limited
        mock_is_rate_limited.return_value = True
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Still returns profile
        
        # Should not create additional analytics record
        self.assertEqual(ProfileView.objects.filter(user_profile=self.profile).count(), 1)


@pytest.mark.django_db
class TestMultiUserInteractionIntegration(TransactionTestCase):
    """Test multi-user interaction scenarios."""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        self.profile1 = self.user1.profile
        self.profile2 = self.user2.profile
        
        # Make both profiles public
        self.profile1.is_public = True
        self.profile1.save()
        self.profile2.is_public = True
        self.profile2.save()
        
        self.client = APIClient()
    
    def test_cross_user_profile_viewing(self):
        """Test users viewing each other's public profiles."""
        
        # Create content for both users
        CustomLink.objects.create(
            user_profile=self.profile1,
            title='User1 Link',
            url='https://user1.com'
        )
        CustomLink.objects.create(
            user_profile=self.profile2,
            title='User2 Link',
            url='https://user2.com'
        )
        
        # User1 views User2's profile
        with patch('api.utils.should_track_analytics') as mock_track:
            mock_track.return_value = True
            
            url = reverse('userprofile-retrieve-public', kwargs={'username': 'user2'})
            response = self.client.get(url)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['data']['username'], 'user2')
        
        # Verify analytics were tracked for user2's profile
        self.assertTrue(ProfileView.objects.filter(user_profile=self.profile2).exists())
        
        # User2 views User1's profile
        with patch('api.utils.should_track_analytics') as mock_track:
            mock_track.return_value = True
            
            url = reverse('userprofile-retrieve-public', kwargs={'username': 'user1'})
            response = self.client.get(url)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['data']['username'], 'user1')
        
        # Verify analytics were tracked for user1's profile
        self.assertTrue(ProfileView.objects.filter(user_profile=self.profile1).exists())
        
        # Verify each user can only see their own analytics
        self.client.force_authenticate(user=self.user1)
        url = reverse('profileview-list')
        response = self.client.get(url)
        
        # User1 should only see views of their own profile
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for view_data in response.data['data']:
            self.assertEqual(view_data['user_profile'], self.profile1.id)
    
    def test_data_isolation_between_users(self):
        """Test that user data is properly isolated."""
        
        # Create data for both users
        link1 = CustomLink.objects.create(
            user_profile=self.profile1,
            title='User1 Private Link',
            url='https://user1-private.com'
        )
        link2 = CustomLink.objects.create(
            user_profile=self.profile2,
            title='User2 Private Link',
            url='https://user2-private.com'
        )
        
        # User1 should only see their own links
        self.client.force_authenticate(user=self.user1)
        url = reverse('customlink-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['title'], 'User1 Private Link')
        
        # User1 should not be able to access User2's link directly
        url = reverse('customlink-detail', kwargs={'pk': link2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # User2 should only see their own links
        self.client.force_authenticate(user=self.user2)
        url = reverse('customlink-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['title'], 'User2 Private Link')
        
        # User2 should not be able to access User1's link directly
        url = reverse('customlink-detail', kwargs={'pk': link1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@pytest.mark.django_db
class TestErrorHandlingIntegration(TransactionTestCase):
    """Test error handling in integration scenarios."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='error_test_user',
            email='error@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.client = APIClient()
    
    def test_graceful_degradation_on_errors(self):
        """Test that system handles errors gracefully."""
        
        # Test with invalid data
        self.client.force_authenticate(user=self.user)
        
        invalid_link_data = {
            'title': '',  # Empty title
            'url': 'not-a-valid-url',  # Invalid URL
            'order': -1  # Invalid order
        }
        
        url = reverse('customlink-list')
        response = self.client.post(url, invalid_link_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data['error'])
        self.assertIn('details', response.data)
        
        # Verify no partial data was created
        self.assertEqual(CustomLink.objects.filter(user_profile=self.profile).count(), 0)
    
    def test_transaction_rollback_on_error(self):
        """Test that database transactions are properly rolled back on errors."""
        
        # This would require a more complex scenario that causes a database error
        # For now, we test that the system handles validation errors properly
        
        self.client.force_authenticate(user=self.user)
        
        # Create valid link first
        valid_data = {
            'title': 'Valid Link',
            'url': 'https://valid.com',
            'order': 1
        }
        
        url = reverse('customlink-list')
        response = self.client.post(url, valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Now try invalid data
        invalid_data = {
            'title': 'Invalid Link',
            'url': 'javascript:alert("xss")',  # Should be rejected
            'order': 2
        }
        
        response = self.client.post(url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Valid link should still exist, invalid one should not
        self.assertEqual(CustomLink.objects.filter(user_profile=self.profile).count(), 1)
        self.assertTrue(
            CustomLink.objects.filter(
                user_profile=self.profile,
                title='Valid Link'
            ).exists()
        )
    
    @patch('api.models.ProfileView.objects.create')
    def test_analytics_failure_doesnt_break_profile_access(self, mock_create):
        """Test that analytics failures don't break profile access."""
        
        # Make analytics creation fail
        mock_create.side_effect = Exception('Database error')
        
        self.profile.is_public = True
        self.profile.save()
        
        # Profile should still be accessible even if analytics fail
        url = reverse('userprofile-retrieve-public', kwargs={'username': self.user.username})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['username'], self.user.username)
        
        # Verify no analytics record was created due to the error
        self.assertEqual(ProfileView.objects.filter(user_profile=self.profile).count(), 0)