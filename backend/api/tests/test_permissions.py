"""
Test cases for custom permission classes.
"""
import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()
from rest_framework.test import APIRequestFactory
from rest_framework import status
from unittest.mock import Mock

from ..models import UserProfile, CustomLink, SocialIcon, CTABanner
from ..permissions import (
    IsOwnerOrReadOnly, IsOwner, MaxCustomLinksPermission,
    MaxSocialIconsPermission, MaxCTABannersPermission
)


class BasePermissionTestCase(TestCase):
    """Base test case for permission tests."""
    
    def setUp(self):
        self.factory = APIRequestFactory()
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


@pytest.mark.django_db
class TestIsOwnerOrReadOnlyPermission(BasePermissionTestCase):
    """Test IsOwnerOrReadOnly permission class."""
    
    def setUp(self):
        super().setUp()
        self.permission = IsOwnerOrReadOnly()
        self.custom_link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Test Link',
            url='https://example.com'
        )
    
    def test_anonymous_user_read_permission(self):
        """Test anonymous user can read but not write."""
        request = self.factory.get('/')
        request.user = AnonymousUser()
        
        # Should allow read operations
        self.assertTrue(self.permission.has_permission(request, None))
        
        # Should allow object-level read
        view = Mock()
        view.action = 'retrieve'
        self.assertTrue(
            self.permission.has_object_permission(request, view, self.custom_link)
        )
    
    def test_anonymous_user_write_permission_denied(self):
        """Test anonymous user cannot perform write operations."""
        request = self.factory.post('/')
        request.user = AnonymousUser()
        
        # Should deny write operations at permission level
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_authenticated_user_read_permission(self):
        """Test authenticated user can read any object."""
        request = self.factory.get('/')
        request.user = self.user2  # Different user
        
        view = Mock()
        view.action = 'retrieve'
        
        # Should allow read operations
        self.assertTrue(
            self.permission.has_object_permission(request, view, self.custom_link)
        )
    
    def test_owner_write_permission(self):
        """Test owner can perform write operations."""
        request = self.factory.put('/')
        request.user = self.user1  # Owner
        
        view = Mock()
        view.action = 'update'
        
        # Should allow write operations for owner
        self.assertTrue(
            self.permission.has_object_permission(request, view, self.custom_link)
        )
    
    def test_non_owner_write_permission_denied(self):
        """Test non-owner cannot perform write operations."""
        request = self.factory.put('/')
        request.user = self.user2  # Not the owner
        
        view = Mock()
        view.action = 'update'
        
        # Should deny write operations for non-owner
        self.assertFalse(
            self.permission.has_object_permission(request, view, self.custom_link)
        )
    
    def test_safe_methods_allowed(self):
        """Test that safe methods (GET, HEAD, OPTIONS) are always allowed."""
        safe_methods = ['GET', 'HEAD', 'OPTIONS']
        
        for method in safe_methods:
            with self.subTest(method=method):
                request = getattr(self.factory, method.lower())('/')
                request.user = self.user2  # Different user
                
                view = Mock()
                view.action = 'retrieve'
                
                self.assertTrue(
                    self.permission.has_object_permission(request, view, self.custom_link)
                )


@pytest.mark.django_db
class TestIsOwnerPermission(BasePermissionTestCase):
    """Test IsOwner permission class."""
    
    def setUp(self):
        super().setUp()
        self.permission = IsOwner()
        self.custom_link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Test Link',
            url='https://example.com'
        )
    
    def test_anonymous_user_denied(self):
        """Test anonymous user is denied access."""
        request = self.factory.get('/')
        request.user = AnonymousUser()
        
        # Should deny at permission level
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_owner_allowed(self):
        """Test owner is allowed access."""
        request = self.factory.get('/')
        request.user = self.user1  # Owner
        
        view = Mock()
        
        # Should allow access for owner
        self.assertTrue(
            self.permission.has_object_permission(request, view, self.custom_link)
        )
    
    def test_non_owner_denied(self):
        """Test non-owner is denied access."""
        request = self.factory.get('/')
        request.user = self.user2  # Not the owner
        
        view = Mock()
        
        # Should deny access for non-owner
        self.assertFalse(
            self.permission.has_object_permission(request, view, self.custom_link)
        )


@pytest.mark.django_db
class TestMaxCustomLinksPermission(BasePermissionTestCase):
    """Test MaxCustomLinksPermission class."""
    
    def setUp(self):
        super().setUp()
        self.permission = MaxCustomLinksPermission()
    
    def test_anonymous_user_denied(self):
        """Test anonymous user is denied."""
        request = self.factory.post('/')
        request.user = AnonymousUser()
        
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_get_request_allowed(self):
        """Test GET requests are always allowed."""
        request = self.factory.get('/')
        request.user = self.user1
        
        self.assertTrue(self.permission.has_permission(request, None))
    
    def test_under_limit_allowed(self):
        """Test creation allowed when under the limit."""
        # Create 5 links (under the 10 limit)
        for i in range(5):
            CustomLink.objects.create(
                user_profile=self.profile1,
                text=f'Link {i}',
                url=f'https://example{i}.com',
                is_active=True
            )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        self.assertTrue(self.permission.has_permission(request, None))
    
    def test_at_limit_denied(self):
        """Test creation denied when at the limit."""
        # Create 10 links (at the limit)
        for i in range(10):
            CustomLink.objects.create(
                user_profile=self.profile1,
                text=f'Link {i}',
                url=f'https://example{i}.com',
                is_active=True
            )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_inactive_links_not_counted(self):
        """Test that inactive links are not counted toward the limit."""
        # Create 10 active links
        for i in range(10):
            CustomLink.objects.create(
                user_profile=self.profile1,
                text=f'Link {i}',
                url=f'https://example{i}.com',
                is_active=True
            )
        
        # Create 5 inactive links
        for i in range(5):
            CustomLink.objects.create(
                user_profile=self.profile1,
                text=f'Inactive Link {i}',
                url=f'https://inactive{i}.com',
                is_active=False
            )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        # Should be denied because we have 10 active links
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_no_user_profile_handled(self):
        """Test graceful handling when user has no profile."""
        # Create user without profile (though this shouldn't happen in practice)
        user_no_profile = User.objects.create_user(
            username='noprofile',
            email='noprofile@example.com',
            password='testpass123'
        )
        # Delete the auto-created profile
        user_no_profile.profile.delete()
        
        request = self.factory.post('/')
        request.user = user_no_profile
        
        # Should be allowed because profile gets auto-recreated when accessed
        self.assertTrue(self.permission.has_permission(request, None))


@pytest.mark.django_db
class TestMaxSocialIconsPermission(BasePermissionTestCase):
    """Test MaxSocialIconsPermission class."""
    
    def setUp(self):
        super().setUp()
        self.permission = MaxSocialIconsPermission()
    
    def test_under_limit_allowed(self):
        """Test creation allowed when under the limit."""
        # Create 3 icons (under the 8 limit)
        for i in range(3):
            SocialIcon.objects.create(
                user_profile=self.profile1,
                platform=f'Platform {i}',
                url=f'https://platform{i}.com/user',
                is_active=True
            )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        self.assertTrue(self.permission.has_permission(request, None))
    
    def test_at_limit_denied(self):
        """Test creation denied when at the limit."""
        # Create 8 icons (at the limit)
        for i in range(8):
            SocialIcon.objects.create(
                user_profile=self.profile1,
                platform=f'Platform {i}',
                url=f'https://platform{i}.com/user',
                is_active=True
            )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_inactive_icons_not_counted(self):
        """Test that inactive icons are not counted toward the limit."""
        # Create 5 active icons
        for i in range(5):
            SocialIcon.objects.create(
                user_profile=self.profile1,
                platform=f'Platform {i}',
                url=f'https://platform{i}.com/user',
                is_active=True
            )
        
        # Create 10 inactive icons
        for i in range(10):
            SocialIcon.objects.create(
                user_profile=self.profile1,
                platform=f'Inactive Platform {i}',
                url=f'https://inactive{i}.com/user',
                is_active=False
            )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        # Should be allowed because we only have 5 active icons
        self.assertTrue(self.permission.has_permission(request, None))


@pytest.mark.django_db
class TestMaxCTABannersPermission(BasePermissionTestCase):
    """Test MaxCTABannersPermission class."""
    
    def setUp(self):
        super().setUp()
        self.permission = MaxCTABannersPermission()
    
    def test_no_banners_allowed(self):
        """Test creation allowed when no banners exist."""
        request = self.factory.post('/')
        request.user = self.user1
        
        self.assertTrue(self.permission.has_permission(request, None))
    
    def test_at_limit_denied(self):
        """Test creation denied when at the limit (1 banner)."""
        CTABanner.objects.create(
            user_profile=self.profile1,
            text='Existing Banner',
            button_text='Click Me',
            button_url='https://example.com',
            is_active=True
        )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        self.assertFalse(self.permission.has_permission(request, None))
    
    def test_inactive_banner_allows_creation(self):
        """Test that inactive banners don't prevent creation."""
        CTABanner.objects.create(
            user_profile=self.profile1,
            text='Inactive Banner',
            button_text='Click Me',
            button_url='https://example.com',
            is_active=False
        )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        # Should be allowed because the existing banner is inactive
        self.assertTrue(self.permission.has_permission(request, None))
    
    def test_update_operations_allowed(self):
        """Test that update operations are always allowed."""
        CTABanner.objects.create(
            user_profile=self.profile1,
            text='Existing Banner',
            button_text='Click Me',
            button_url='https://example.com',
            is_active=True
        )
        
        request = self.factory.put('/')
        request.user = self.user1
        
        # Updates should be allowed even when at limit
        self.assertTrue(self.permission.has_permission(request, None))


@pytest.mark.django_db
class TestPermissionIntegration(BasePermissionTestCase):
    """Integration tests for permission classes."""
    
    def test_permission_chain_evaluation(self):
        """Test how permissions work together in a typical scenario."""
        # Create a custom link
        link = CustomLink.objects.create(
            user_profile=self.profile1,
            text='Test Link',
            url='https://example.com'
        )
        
        # Test IsOwnerOrReadOnly with different scenarios
        is_owner_permission = IsOwnerOrReadOnly()
        
        # Owner should be able to update
        request = self.factory.put('/')
        request.user = self.user1
        view = Mock()
        view.action = 'update'
        
        self.assertTrue(
            is_owner_permission.has_object_permission(request, view, link)
        )
        
        # Non-owner should not be able to update
        request.user = self.user2
        self.assertFalse(
            is_owner_permission.has_object_permission(request, view, link)
        )
        
        # But non-owner should be able to read
        request = self.factory.get('/')  # Use GET request for read
        request.user = self.user2
        view.action = 'retrieve'
        self.assertTrue(
            is_owner_permission.has_object_permission(request, view, link)
        )
    
    def test_multiple_limit_permissions(self):
        """Test behavior when user is at multiple limits."""
        # Create maximum custom links
        for i in range(10):
            CustomLink.objects.create(
                user_profile=self.profile1,
                text=f'Link {i}',
                url=f'https://example{i}.com',
                is_active=True
            )
        
        # Create maximum social icons
        for i in range(8):
            SocialIcon.objects.create(
                user_profile=self.profile1,
                platform=f'Platform {i}',
                url=f'https://platform{i}.com/user',
                is_active=True
            )
        
        # Create maximum CTA banners
        CTABanner.objects.create(
            user_profile=self.profile1,
            text='Banner',
            button_text='Click Me',
            button_url='https://example.com',
            is_active=True
        )
        
        request = self.factory.post('/')
        request.user = self.user1
        
        # All limit permissions should deny creation
        self.assertFalse(MaxCustomLinksPermission().has_permission(request, None))
        self.assertFalse(MaxSocialIconsPermission().has_permission(request, None))
        self.assertFalse(MaxCTABannersPermission().has_permission(request, None))
    
    def test_permission_error_handling(self):
        """Test permission behavior with edge cases."""
        # Test with user that has no userprofile (edge case)
        user_no_profile = User.objects.create_user(
            username='noprofile',
            email='noprofile@example.com',
            password='testpass123'
        )
        user_no_profile.profile.delete()
        
        request = self.factory.post('/')
        request.user = user_no_profile
        
        # Permissions should handle missing profile gracefully
        permissions = [
            MaxCustomLinksPermission(),
            MaxSocialIconsPermission(),
            MaxCTABannersPermission()
        ]
        
        for permission in permissions:
            with self.subTest(permission=permission.__class__.__name__):
                # Should not raise an exception and should allow creation 
                # since profile gets auto-recreated
                result = permission.has_permission(request, None)
                self.assertTrue(result)