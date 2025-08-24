from rest_framework import permissions
from django.core.exceptions import ObjectDoesNotExist


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_permission(self, request, view):
        """
        Allow authenticated users to perform any action,
        anonymous users can only read.
        """
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the profile/link.
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """

    def has_permission(self, request, view):
        """
        Only authenticated users can access.
        """
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # All permissions are only allowed to the owner
        if hasattr(obj, 'user_profile'):
            return obj.user_profile.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class PublicProfilePermission(permissions.BasePermission):
    """
    Allow public access to active profiles only.
    Used for public storefront views.
    """
    
    def has_permission(self, request, view):
        # Allow all safe methods (GET, HEAD, OPTIONS) for public access
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For non-safe methods, require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow public read access to active profiles
        if request.method in permissions.SAFE_METHODS:
            return obj.is_active
        
        # For write operations, only the owner can edit
        return obj.user == request.user


class StorefrontPermission(permissions.BasePermission):
    """
    Permissions for storefront components (CustomLink, SocialIcon, CTABanner).
    Only the profile owner can modify their storefront components.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Check if the object belongs to the requesting user's profile
        return obj.user_profile.user == request.user


class MaxCustomLinksPermission(permissions.BasePermission):
    """
    Ensure users don't exceed the maximum number of custom links (10).
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not request.user.is_authenticated:
            return False
            
        # Check if user already has maximum number of links
        try:
            user_profile = request.user.profile
            if user_profile and user_profile.pk:
                current_links = user_profile.custom_links.filter(is_active=True).count()
                if current_links >= 10:
                    return False
        except (AttributeError, ValueError, ObjectDoesNotExist):
            # User doesn't have a profile yet, allow creation
            pass
        
        return True


class MaxSocialIconsPermission(permissions.BasePermission):
    """
    Ensure users don't exceed the maximum number of social icons (8).
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not request.user.is_authenticated:
            return False
            
        # Check if user already has maximum number of icons
        try:
            user_profile = request.user.profile
            if user_profile and user_profile.pk:
                current_icons = user_profile.social_icons.filter(is_active=True).count()
                if current_icons >= 8:
                    return False
        except (AttributeError, ValueError, ObjectDoesNotExist):
            # User doesn't have a profile yet, allow creation
            pass
        
        return True


class MaxCTABannersPermission(permissions.BasePermission):
    """
    Ensure users don't exceed the maximum number of CTA banners (1).
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not request.user.is_authenticated:
            return False
            
        # Check if user already has maximum number of banners
        try:
            user_profile = request.user.profile
            if user_profile and user_profile.pk:
                current_banners = 1 if hasattr(user_profile, 'cta_banner') and user_profile.cta_banner.is_active else 0
                if current_banners >= 1:
                    return False
        except (AttributeError, ValueError, ObjectDoesNotExist):
            # User doesn't have a profile yet, allow creation
            pass
        
        return True