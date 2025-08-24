"""
Test cases for model functionality in the API app.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from ..models import UserProfile, CustomLink, SocialIcon, CTABanner, ProfileView, LinkClick


@pytest.mark.django_db
class TestUserProfile(TestCase):
    """Test UserProfile model functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_profile_auto_creation(self):
        """Test that UserProfile is automatically created for new users."""
        # Profile should be created via signal
        self.assertTrue(hasattr(self.user, 'profile'))
        profile = self.user.profile
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.slug, 'testuser')
    
    def test_user_profile_str_method(self):
        """Test UserProfile string representation."""
        profile = self.user.profile
        # Update display_name for testing string representation
        profile.display_name = 'Test User'
        profile.save()
        self.assertEqual(str(profile), 'testuser - Test User')
    
    def test_user_profile_fields(self):
        """Test UserProfile field defaults and constraints."""
        profile = self.user.profile
        
        # Test default values
        self.assertEqual(profile.bio, '')
        self.assertFalse(profile.profile_image)  # ImageField is False when empty
        self.assertEqual(profile.embedded_video, '')
        self.assertTrue(profile.is_active)
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.modified_at)
    
    def test_user_profile_slug_unique(self):
        """Test that slugs are unique."""
        # Create another user with different username
        user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        # Try to change slug to existing one
        profile2 = user2.profile
        profile2.slug = 'testuser'
        
        with self.assertRaises(IntegrityError):
            profile2.save()


@pytest.mark.django_db
class TestCustomLink(TestCase):
    """Test CustomLink model functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_custom_link_creation(self):
        """Test CustomLink creation and basic fields."""
        link = CustomLink.objects.create(
            user_profile=self.profile,
            text='Test Link',
            url='https://example.com'
        )
        
        self.assertEqual(link.text, 'Test Link')
        self.assertEqual(link.url, 'https://example.com')
        self.assertEqual(link.order, 0)
        self.assertTrue(link.is_active)
        self.assertIsNotNone(link.created_at)
        self.assertIsNotNone(link.modified_at)
    
    def test_custom_link_str_method(self):
        """Test CustomLink string representation."""
        link = CustomLink.objects.create(
            user_profile=self.profile,
            text='Test Link',
            url='https://example.com'
        )
        self.assertEqual(str(link), 'testuser - Test Link')
    
    def test_custom_link_ordering(self):
        """Test CustomLink default ordering."""
        link1 = CustomLink.objects.create(
            user_profile=self.profile,
            text='Link 1',
            url='https://example1.com',
            order=2
        )
        link2 = CustomLink.objects.create(
            user_profile=self.profile,
            text='Link 2',
            url='https://example2.com',
                    )
        
        links = list(CustomLink.objects.all())
        self.assertEqual(links[0], link2)  # Should be ordered by 'order' field
        self.assertEqual(links[1], link1)
    
    def test_custom_link_default_values(self):
        """Test CustomLink default values."""
        link = CustomLink.objects.create(
            user_profile=self.profile,
            text='Test Link',
            url='https://example.com'
        )
        self.assertEqual(link.order, 0)  # Default order
        self.assertTrue(link.is_active)  # Default active state
        self.assertFalse(link.thumbnail)  # ImageField is False when empty


@pytest.mark.django_db
class TestSocialIcon(TestCase):
    """Test SocialIcon model functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_social_icon_creation(self):
        """Test SocialIcon creation and basic fields."""
        icon = SocialIcon.objects.create(
            user_profile=self.profile,
            platform='twitter',
            url='https://twitter.com/testuser'
        )
        
        self.assertEqual(icon.platform, 'twitter')
        self.assertEqual(icon.url, 'https://twitter.com/testuser')
        self.assertTrue(icon.is_active)
    
    def test_social_icon_str_method(self):
        """Test SocialIcon string representation."""
        icon = SocialIcon.objects.create(
            user_profile=self.profile,
            platform='twitter',
            url='https://twitter.com/testuser'
        )
        self.assertEqual(str(icon), 'testuser - twitter')


@pytest.mark.django_db
class TestCTABanner(TestCase):
    """Test CTABanner model functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_cta_banner_creation(self):
        """Test CTABanner creation and basic fields."""
        banner = CTABanner.objects.create(
            user_profile=self.profile,
            text='Subscribe Now',
                        button_text='Subscribe',
            button_url='https://example.com/subscribe'
        )
        
        self.assertEqual(banner.text, 'Subscribe Now')
        self.assertEqual(banner.button_text, 'Subscribe')
        self.assertEqual(banner.button_url, 'https://example.com/subscribe')
        self.assertTrue(banner.is_active)
    
    def test_cta_banner_str_method(self):
        """Test CTABanner string representation."""
        banner = CTABanner.objects.create(
            user_profile=self.profile,
            text='Subscribe Now',
            button_text='Subscribe',
            button_url='https://example.com/subscribe'
        )
        self.assertEqual(str(banner), 'testuser - Subscribe Now')
    
    def test_cta_banner_optional_fields(self):
        """Test CTABanner with optional fields."""
        banner = CTABanner.objects.create(
            user_profile=self.profile,
            text='Subscribe Now',
            button_text='Subscribe',
            button_url='https://example.com/subscribe'
            # subtitle is optional
        )
        
                  # Default value
          # Default value


@pytest.mark.django_db
class TestProfileView(TestCase):
    """Test ProfileView analytics model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_profile_view_creation(self):
        """Test ProfileView creation and basic fields."""
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0 Test Browser',
            referrer='https://google.com'
        )
        
        self.assertEqual(view.user_profile, self.profile)
        self.assertEqual(view.ip_address, '192.168.1.100')
        self.assertEqual(view.user_agent, 'Mozilla/5.0 Test Browser')
        self.assertEqual(view.referrer, 'https://google.com')
        self.assertIsNotNone(view.viewed_at)
    
    def test_profile_view_str_method(self):
        """Test ProfileView string representation."""
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        # The actual __str__ method returns: f"{self.user_profile.user.username} - {self.viewed_at}"
        expected_start = f"testuser - "
        self.assertTrue(str(view).startswith(expected_start))
    
    def test_profile_view_ordering(self):
        """Test ProfileView default ordering (newest first)."""
        view1 = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        view2 = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.101'
        )
        
        views = list(ProfileView.objects.all())
        self.assertEqual(views[0], view2)  # Newest first
        self.assertEqual(views[1], view1)
    
    def test_profile_view_optional_fields(self):
        """Test ProfileView with minimal required fields."""
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        
        self.assertEqual(view.user_agent, '')
        self.assertEqual(view.referrer, '')
    
    def test_profile_view_related_name(self):
        """Test ProfileView related name on UserProfile."""
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        
        self.assertIn(view, self.profile.profile_views.all())


@pytest.mark.django_db
class TestLinkClick(TestCase):
    """Test LinkClick analytics model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.custom_link = CustomLink.objects.create(
            user_profile=self.profile,
            text='Test Link',
            url='https://example.com'
        )
    
    def test_link_click_creation(self):
        """Test LinkClick creation and basic fields."""
        click = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0 Test Browser',
            referrer='https://profile.com/testuser'
        )
        
        self.assertEqual(click.custom_link, self.custom_link)
        self.assertEqual(click.user_profile, self.profile)
        self.assertEqual(click.ip_address, '192.168.1.100')
        self.assertEqual(click.user_agent, 'Mozilla/5.0 Test Browser')
        self.assertEqual(click.referrer, 'https://profile.com/testuser')
        self.assertIsNotNone(click.clicked_at)
    
    def test_link_click_str_method(self):
        """Test LinkClick string representation."""
        click = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.100'
        )
        # The actual __str__ method returns: f"{self.user_profile.user.username} - {link_text} - {self.clicked_at}"
        expected_start = f"testuser - Test Link - "
        self.assertTrue(str(click).startswith(expected_start))
    
    def test_link_click_ordering(self):
        """Test LinkClick default ordering (newest first)."""
        click1 = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.100'
        )
        click2 = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.101'
        )
        
        clicks = list(LinkClick.objects.all())
        self.assertEqual(clicks[0], click2)  # Newest first
        self.assertEqual(clicks[1], click1)
    
    def test_link_click_optional_fields(self):
        """Test LinkClick with minimal required fields."""
        click = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.100'
        )
        
        self.assertEqual(click.user_agent, '')
        self.assertEqual(click.referrer, '')
    
    def test_link_click_related_name(self):
        """Test LinkClick related name on CustomLink."""
        click = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.100'
        )
        
        self.assertIn(click, self.custom_link.clicks.all())
    
    def test_link_click_cascade_delete(self):
        """Test that LinkClick is deleted when CustomLink is deleted."""
        click = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=self.custom_link,
            ip_address='192.168.1.100'
        )
        
        click_id = click.id
        self.custom_link.delete()
        
        # Click should be deleted due to CASCADE
        with self.assertRaises(LinkClick.DoesNotExist):
            LinkClick.objects.get(id=click_id)


@pytest.mark.django_db
class TestModelRelationships(TestCase):
    """Test model relationships and constraints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
    
    def test_user_profile_one_to_one(self):
        """Test User to UserProfile one-to-one relationship."""
        # Should only have one profile per user
        self.assertEqual(UserProfile.objects.filter(user=self.user).count(), 1)
        
        # Profile should be accessible via reverse relationship
        self.assertEqual(self.user.profile, self.profile)
    
    def test_custom_link_foreign_key(self):
        """Test CustomLink to UserProfile foreign key relationship."""
        link1 = CustomLink.objects.create(
            user_profile=self.profile,
            text='Link 1',
            url='https://example1.com'
        )
        link2 = CustomLink.objects.create(
            user_profile=self.profile,
            text='Link 2',
            url='https://example2.com'
        )
        
        # Profile should have multiple links
        self.assertEqual(self.profile.custom_links.count(), 2)
        self.assertIn(link1, self.profile.custom_links.all())
        self.assertIn(link2, self.profile.custom_links.all())
    
    def test_profile_view_foreign_key(self):
        """Test ProfileView to UserProfile foreign key relationship."""
        view1 = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        view2 = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.101'
        )
        
        # Profile should have multiple views
        self.assertEqual(self.profile.profile_views.count(), 2)
        self.assertIn(view1, self.profile.profile_views.all())
        self.assertIn(view2, self.profile.profile_views.all())
    
    def test_cascade_delete_behavior(self):
        """Test CASCADE delete behavior for related models."""
        # Create related objects
        link = CustomLink.objects.create(
            user_profile=self.profile,
            text='Test Link',
            url='https://example.com'
        )
        view = ProfileView.objects.create(
            user_profile=self.profile,
            ip_address='192.168.1.100'
        )
        click = LinkClick.objects.create(
            user_profile=self.profile,
            custom_link=link,
            ip_address='192.168.1.100'
        )
        
        link_id = link.id
        view_id = view.id
        click_id = click.id
        
        # Delete user (which should cascade to profile and all related objects)
        self.user.delete()
        
        # All related objects should be deleted
        self.assertFalse(UserProfile.objects.filter(id=self.profile.id).exists())
        self.assertFalse(CustomLink.objects.filter(id=link_id).exists())
        self.assertFalse(ProfileView.objects.filter(id=view_id).exists())
        self.assertFalse(LinkClick.objects.filter(id=click_id).exists())