from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions, serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q

from .models import UserProfile, UserSocialLinks, UserPermissions, SocialIcon, IframeMenuItem, CustomLink, CollectInfoField, CollectInfoResponse, CTABanner, SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate, Plan, PlanFeature, Subscription, Folder, Media, ProfileView, LinkClick, Comment, AutomationRule, AutomationSettings, CommentReply, DirectMessage, DirectMessageReply, Order, StripeConnectAccount, PaymentTransaction, ConnectWebhookEvent, MiloPrompt, EmailAccount, EmailMessage, EmailAttachment, EmailDraft, SystemConfig

# Backwards compatibility aliases
CommentAutomationRule = AutomationRule
CommentAutomationSettings = AutomationSettings

User = get_user_model()


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset email using username."""
    username = serializers.CharField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a password reset using uid & token."""
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(style={"input_type": "password"}, write_only=True)
    password_retype = serializers.CharField(
        style={"input_type": "password"}, write_only=True
    )

    default_error_messages = {
        "password_mismatch": _("Passwords are not matching."),
        "password_invalid": _("Password does not meet all requirements."),
    }

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_retype"):
            raise serializers.ValidationError({"password_retype": self.default_error_messages["password_mismatch"]})

        try:
            validate_password(attrs.get("password"))
        except ValidationError as e:
            raise exceptions.ValidationError({"password": list(e.messages)}) from e

        return super().validate(attrs)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom serializer to allow login with username or email"""
    username_field = 'username'
    
    def validate(self, attrs):
        username_or_email = attrs.get(self.username_field)
        password = attrs.get('password')
        
        if username_or_email and password:
            # Try to find user by username or email
            user = User.objects.filter(
                Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)
            ).first()
            
            if user and user.check_password(password):
                if not user.is_active:
                    raise serializers.ValidationError(
                        _('No active account found with the given credentials'),
                        code='no_active_account'
                    )
                
                # Set the actual username (not email) for the parent serializer
                attrs[self.username_field] = user.username
                # Explicitly set the user object to ensure the token uses the correct user data
                self.user = user
                
                # Call parent validate to get tokens
                return super().validate(attrs)
        
        raise serializers.ValidationError(
            _('No active account found with the given credentials'),
            code='no_active_account'
        )
    
    @classmethod
    def get_token(cls, user):
        """Override to ensure token uses actual username from database"""
        token = super().get_token(user)
        # Ensure the username in the token is the actual database username, not email
        token['username'] = user.username
        return token


class UserCurrentSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "permissions"]
        extra_kwargs = {
            'username': {'required': False}
        }

    def get_permissions(self, obj):
        """Get user permissions or create default permissions if they don't exist"""
        try:
            permissions = obj.permissions
        except UserPermissions.DoesNotExist:
            # Create permissions if they don't exist
            permissions = UserPermissions.objects.create(user=obj)

        return UserPermissionsSerializer(permissions).data

    def validate_username(self, value):
        """Validate username is unique, excluding current user"""
        if value:
            # Check if username already exists for another user
            user_with_username = User.objects.filter(username__iexact=value).exclude(id=self.instance.id if self.instance else None).first()
            if user_with_username:
                raise serializers.ValidationError("This username is already taken.")
        return value


class UserCurrentErrorSerializer(serializers.Serializer):
    username = serializers.ListSerializer(child=serializers.CharField(), required=False)
    first_name = serializers.ListSerializer(
        child=serializers.CharField(), required=False
    )
    last_name = serializers.ListSerializer(
        child=serializers.CharField(), required=False
    )


class UserChangePasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(style={"input_type": "password"}, write_only=True)
    password_new = serializers.CharField(style={"input_type": "password"})
    password_retype = serializers.CharField(
        style={"input_type": "password"}, write_only=True
    )

    default_error_messages = {
        "password_mismatch": _("Current password is not matching"),
        "password_invalid": _("Password does not meet all requirements"),
        "password_same": _("Both new and current passwords are same"),
    }

    class Meta:
        model = User
        fields = ["password", "password_new", "password_retype"]

    def validate(self, attrs):
        request = self.context.get("request", None)

        if not request.user.check_password(attrs["password"]):
            raise serializers.ValidationError(
                {"password": self.default_error_messages["password_mismatch"]}
            )

        try:
            validate_password(attrs["password_new"])
        except ValidationError as e:
            raise exceptions.ValidationError({"password_new": list(e.messages)}) from e

        if attrs["password_new"] != attrs["password_retype"]:
            raise serializers.ValidationError(
                {"password_retype": self.default_error_messages["password_invalid"]}
            )

        if attrs["password_new"] == attrs["password"]:
            raise serializers.ValidationError(
                {"password_new": self.default_error_messages["password_same"]}
            )
        return super().validate(attrs)


class UserChangePasswordErrorSerializer(serializers.Serializer):
    password = serializers.ListSerializer(child=serializers.CharField(), required=False)
    password_new = serializers.ListSerializer(
        child=serializers.CharField(), required=False
    )
    password_retype = serializers.ListSerializer(
        child=serializers.CharField(), required=False
    )


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(style={"input_type": "password"}, write_only=True)
    password_retype = serializers.CharField(
        style={"input_type": "password"}, write_only=True
    )
    email = serializers.EmailField(required=True)
    
    # Optional social media links
    instagram = serializers.URLField(required=False, allow_blank=True, help_text="Instagram profile URL")
    facebook = serializers.URLField(required=False, allow_blank=True, help_text="Facebook profile URL")
    pinterest = serializers.URLField(required=False, allow_blank=True, help_text="Pinterest profile URL")
    linkedin = serializers.URLField(required=False, allow_blank=True, help_text="LinkedIn profile URL")
    tiktok = serializers.URLField(required=False, allow_blank=True, help_text="TikTok profile URL")
    youtube = serializers.URLField(required=False, allow_blank=True, help_text="YouTube channel URL")
    twitter = serializers.URLField(required=False, allow_blank=True, help_text="Twitter/X profile URL")
    website = serializers.URLField(required=False, allow_blank=True, help_text="Personal website URL")
    
    # Optional Google profile image for OAuth users
    google_profile_image = serializers.URLField(required=False, allow_blank=True, help_text="Google profile image URL")
    google_display_name = serializers.CharField(required=False, allow_blank=True, help_text="Google display name")

    default_error_messages = {
        "password_mismatch": _("Passwords are not matching."),
        "password_invalid": _("Password does not meet all requirements."),
        "username_exists": _("Username already exists."),
        "email_exists": _("Email already exists."),
    }

    class Meta:
        model = User
        fields = [
            "username", "email", "password", "password_retype",
            "instagram", "facebook", "pinterest", "linkedin", 
            "tiktok", "youtube", "twitter", "website",
            "google_profile_image", "google_display_name"
        ]

    def validate_username(self, value):
        """Check if username already exists (case-insensitive)"""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(self.default_error_messages["username_exists"])
        return value.lower()  # Store usernames in lowercase for consistency

    def validate_email(self, value):
        """Check if email already exists (case-insensitive)"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(self.default_error_messages["email_exists"])
        return value.lower()  # Store emails in lowercase for consistency

    def validate(self, attrs):
        password_retype = attrs.pop("password_retype")
        
        # Extract social media links and Google profile fields (they're not part of User model)
        social_links = {}
        social_fields = ['instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter', 'website']
        for field in social_fields:
            if field in attrs:
                social_links[field] = attrs.pop(field, '')
        
        # Extract Google profile fields
        google_profile_image = attrs.pop('google_profile_image', '')
        google_display_name = attrs.pop('google_display_name', '')
        
        # Store for later use in create method
        self.social_links = social_links
        self.google_profile_image = google_profile_image
        self.google_display_name = google_display_name

        try:
            validate_password(attrs.get("password"))
        except exceptions.ValidationError:
            self.fail("password_invalid")

        if attrs["password"] == password_retype:
            return attrs

        return self.fail("password_mismatch")

    def create(self, validated_data):
        with transaction.atomic():
            # Extract Google profile data before user creation
            google_profile_image = validated_data.pop('google_profile_image', None)
            google_display_name = validated_data.pop('google_display_name', None)
            
            # Extract social media links
            social_links = {}
            for field in ['instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter', 'website']:
                if field in validated_data:
                    social_links[field] = validated_data.pop(field)
            
            # Create user with username, email, and password
            user = User.objects.create_user(**validated_data)

            # By default newly registered accounts are active.
            # Change to False if you want manual activation
            user.is_active = True
            user.save(update_fields=["is_active"])
            
            # Update social links if provided
            if social_links:
                social_links_obj = user.social_links
                for field, value in social_links.items():
                    if value:  # Only set non-empty values
                        setattr(social_links_obj, field, value)
                social_links_obj.save()
            
            # Update profile with Google profile image and display name if provided
            if google_profile_image:
                profile = user.profile
                profile.profile_image = google_profile_image
                if google_display_name:
                    profile.display_name = google_display_name
                profile.save()

        return user


class UserCreateErrorSerializer(serializers.Serializer):
    username = serializers.ListSerializer(child=serializers.CharField(), required=False)
    email = serializers.ListSerializer(child=serializers.CharField(), required=False)
    password = serializers.ListSerializer(child=serializers.CharField(), required=False)
    password_retype = serializers.ListSerializer(
        child=serializers.CharField(), required=False
    )
    instagram = serializers.ListSerializer(child=serializers.CharField(), required=False)
    facebook = serializers.ListSerializer(child=serializers.CharField(), required=False)
    pinterest = serializers.ListSerializer(child=serializers.CharField(), required=False)
    linkedin = serializers.ListSerializer(child=serializers.CharField(), required=False)
    tiktok = serializers.ListSerializer(child=serializers.CharField(), required=False)
    youtube = serializers.ListSerializer(child=serializers.CharField(), required=False)
    twitter = serializers.ListSerializer(child=serializers.CharField(), required=False)
    website = serializers.ListSerializer(child=serializers.CharField(), required=False)


# UserProfile Serializers
class SocialIconSerializer(serializers.ModelSerializer):
    def validate_url(self, value):
        """Custom URL validation that allows mailto: URLs"""
        if value.startswith('mailto:'):
            # Basic validation for mailto URLs
            if '@' not in value or len(value.split('mailto:')[1]) < 5:
                raise serializers.ValidationError("Enter a valid email address.")
            return value

        # For all other URLs, use default validation
        from django.core.validators import URLValidator
        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Enter a valid URL.")

        return value

    class Meta:
        model = SocialIcon
        fields = ['id', 'platform', 'url', 'is_active']
        read_only_fields = ['id']


class CollectInfoFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectInfoField
        fields = [
            'id', 'field_type', 'label', 'placeholder', 'is_required', 
            'order', 'options', 'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'created_at', 'modified_at']


class CollectInfoResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectInfoResponse
        fields = [
            'id', 'responses', 'ip_address', 'user_agent', 'submitted_at'
        ]
        read_only_fields = ['id', 'submitted_at']


class CustomLinkSerializer(serializers.ModelSerializer):
    click_count = serializers.IntegerField(read_only=True)
    thumbnail = serializers.SerializerMethodField()
    checkout_image = serializers.SerializerMethodField()
    collect_info_fields = CollectInfoFieldSerializer(many=True, read_only=True)
    collect_info_responses = CollectInfoResponseSerializer(many=True, read_only=True)
    
    class Meta:
        model = CustomLink
        fields = [
            'id', 'order', 'is_active', 'type', 'click_count', 'created_at', 'modified_at',
            # Thumbnail info fields
            'thumbnail', 'title', 'subtitle', 
            # Style and button fields
            'button_text', 'style',
            # Checkout page fields
            'checkout_image', 'checkout_title', 'checkout_description', 
            'checkout_bottom_title', 'checkout_cta_button_text', 
            'checkout_price', 'checkout_discounted_price',
            # Additional info
            'additional_info',
            # Related data
            'collect_info_fields', 'collect_info_responses'
        ]
        read_only_fields = ['id', 'click_count', 'created_at', 'modified_at']
    
    def get_thumbnail(self, obj):
        """Return the full Cloudinary URL for the thumbnail"""
        if obj.thumbnail:
            return obj.thumbnail.url
        return None
    
    def get_checkout_image(self, obj):
        """Return the full Cloudinary URL for the checkout image"""
        if obj.checkout_image:
            return obj.checkout_image.url
        return None


class CTABannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CTABanner
        fields = ['id', 'text', 'button_text', 'button_url', 'style', 'is_active', 'click_count']
        read_only_fields = ['id', 'click_count']


class UserProfileSerializer(serializers.ModelSerializer):
    social_icons = SocialIconSerializer(many=True, read_only=True)
    custom_links = CustomLinkSerializer(many=True, read_only=True)
    cta_banner = CTABannerSerializer(read_only=True)
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'slug', 'display_name', 'bio', 'profile_image',
            'embedded_video', 'affiliate_link', 'contact_email', 'is_active', 'email_automation_enabled', 'social_icons', 'custom_links', 'cta_banner'
        ]

    def get_profile_image(self, obj):
        """Return the full Cloudinary URL for the profile image"""
        if obj.profile_image:
            return obj.profile_image.url
        return None


class UserProfileEmailAutomationSerializer(serializers.Serializer):
    """Serializer for updating user profile email automation default preference."""
    enabled = serializers.BooleanField(required=True)


class UserProfilePublicSerializer(serializers.ModelSerializer):
    social_icons = SocialIconSerializer(many=True, read_only=True)
    custom_links = CustomLinkSerializer(many=True, read_only=True)
    cta_banner = CTABannerSerializer(read_only=True)
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'slug', 'display_name', 'bio', 'profile_image',
            'embedded_video', 'affiliate_link', 'social_icons', 'custom_links', 'cta_banner'
        ]

    def get_profile_image(self, obj):
        """Return the full Cloudinary URL for the profile image"""
        if obj.profile_image:
            return obj.profile_image.url
        return None


class UserPermissionsSerializer(serializers.ModelSerializer):
    accessible_sections = serializers.ReadOnlyField(source='get_accessible_sections')
    
    class Meta:
        model = UserPermissions
        fields = [
            'id',
            'user',
            'can_access_overview',
            'can_access_linkinbio', 
            'can_access_content',
            'can_access_automation',
            'can_access_ai_tools',
            'can_access_business',
            'can_access_account',
            'can_edit_profile',
            'can_manage_integrations',
            'can_view_analytics',
            'accessible_sections',
            'created_at',
            'modified_at'
        ]
        read_only_fields = ['id', 'created_at', 'modified_at', 'accessible_sections']
    
    def validate(self, attrs):
        """Ensure at least one section is accessible"""
        section_fields = [
            'can_access_overview', 'can_access_linkinbio', 'can_access_content',
            'can_access_automation', 'can_access_ai_tools', 'can_access_business', 'can_access_account'
        ]
        
        # Check if any section is enabled (use existing values if not in attrs)
        instance = getattr(self, 'instance', None)
        has_access = False
        
        for field in section_fields:
            value = attrs.get(field)
            if value is None and instance:
                # Use existing value if not being updated
                value = getattr(instance, field, False)
            if value:
                has_access = True
                break
        
        if not has_access:
            raise serializers.ValidationError(
                "At least one dashboard section must be accessible."
            )
        
        return attrs


class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = [
            "id",
            "feature_key",
            "feature_name", 
            "feature_value",
            "is_highlight",
            "sort_order"
        ]


class PlanSerializer(serializers.ModelSerializer):
    features = PlanFeatureSerializer(many=True, read_only=True)
    
    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "slug",
            "description", 
            "price",
            "billing_period",
            "trial_period_days",
            "is_active",
            "is_featured",
            "sort_order",
            "features"
        ]


# Subscription Serializers
class CheckoutSessionSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField(required=True, help_text=_("ID of the plan to subscribe to"))
    success_url = serializers.URLField(required=False, help_text=_("URL to redirect after successful checkout"))
    cancel_url = serializers.URLField(required=False, help_text=_("URL to redirect if checkout is canceled"))


class CheckoutSessionResponseSerializer(serializers.Serializer):
    checkout_url = serializers.URLField(help_text=_("Stripe Checkout Session URL"))


class PortalSessionResponseSerializer(serializers.Serializer):
    portal_url = serializers.URLField(help_text=_("Stripe Customer Portal URL"))


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "status",
            "trial_start",
            "trial_end",
            "is_trialing",
            "current_period_start",
            "current_period_end",
            "canceled_at",
            "created_at"
        ]


# Meta Integration Serializers
class MetaAuthUrlSerializer(serializers.Serializer):
    auth_url = serializers.URLField()
    state = serializers.CharField()


class MetaConnectionSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source='platform.name', read_only=True)
    platform_display_name = serializers.CharField(source='platform.display_name', read_only=True)
    needs_refresh = serializers.ReadOnlyField()
    
    class Meta:
        model = SocialMediaConnection
        fields = [
            'id',
            'platform_name',
            'platform_display_name', 
            'platform_username',
            'platform_display_name',
            'platform_profile_url',
            'instagram_username',
            'facebook_page_name',
            'is_active',
            'is_verified',
            'last_used_at',
            'needs_refresh'
        ]


class MetaPublishPostSerializer(serializers.Serializer):
    connection_id = serializers.IntegerField()
    content = serializers.CharField(max_length=2200)  # Instagram caption limit
    media_url = serializers.URLField(required=False, allow_blank=True)


class MetaPublishResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    platform = serializers.CharField()
    post_id = serializers.CharField()
    post_url = serializers.URLField()


class MetaConnectionsListSerializer(serializers.Serializer):
    connections = MetaConnectionSerializer(many=True)


class MetaDisconnectResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


# Pinterest Integration Serializers
class PinterestAuthUrlSerializer(serializers.Serializer):
    auth_url = serializers.URLField()
    state = serializers.CharField()


class PinterestConnectionSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source='platform.name', read_only=True)
    platform_display_name = serializers.CharField(source='platform.display_name', read_only=True)
    needs_refresh = serializers.ReadOnlyField()
    
    class Meta:
        model = SocialMediaConnection
        fields = [
            'id',
            'platform_name',
            'platform_display_name', 
            'platform_username',
            'platform_display_name',
            'platform_profile_url',
            'pinterest_user_id',
            'is_active',
            'is_verified',
            'last_used_at',
            'needs_refresh'
        ]


class PinterestPublishPostSerializer(serializers.Serializer):
    connection_id = serializers.IntegerField()
    board_id = serializers.CharField(help_text="Pinterest board ID")
    description = serializers.CharField(max_length=500, help_text="Pin description")
    media_url = serializers.URLField(help_text="Image URL for the pin")
    title = serializers.CharField(max_length=100, required=False, allow_blank=True, help_text="Pin title")
    link = serializers.URLField(required=False, allow_blank=True, help_text="Destination URL when pin is clicked")
    alt_text = serializers.CharField(max_length=500, required=False, allow_blank=True, help_text="Alt text for accessibility")


class PinterestPublishResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    platform = serializers.CharField()
    pin_id = serializers.CharField()
    pin_url = serializers.URLField()


class PinterestConnectionsListSerializer(serializers.Serializer):
    connections = PinterestConnectionSerializer(many=True)


class PinterestDisconnectResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


# LinkedIn Integration Serializers
class LinkedInAuthUrlSerializer(serializers.Serializer):
    auth_url = serializers.URLField()
    state = serializers.CharField()


class LinkedInConnectionSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source='platform.name', read_only=True)
    platform_display_name = serializers.CharField(source='platform.display_name', read_only=True)
    needs_refresh = serializers.ReadOnlyField()
    
    class Meta:
        model = SocialMediaConnection
        fields = [
            'id',
            'platform_name',
            'platform_display_name', 
            'platform_username',
            'platform_display_name',
            'platform_profile_url',
            'platform_user_id',
            'is_active',
            'is_verified',
            'last_used_at',
            'needs_refresh'
        ]


class LinkedInPublishPostSerializer(serializers.Serializer):
    connection_id = serializers.IntegerField()
    text = serializers.CharField(max_length=3000, help_text="Post text content (max 3000 characters)")
    media_url = serializers.URLField(required=False, allow_blank=True, help_text="Optional image URL")
    link_url = serializers.URLField(required=False, allow_blank=True, help_text="Optional article/link URL")
    link_title = serializers.CharField(max_length=200, required=False, allow_blank=True, help_text="Link title")
    link_description = serializers.CharField(max_length=300, required=False, allow_blank=True, help_text="Link description")


class LinkedInPublishResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    platform = serializers.CharField()
    post_id = serializers.CharField()
    post_url = serializers.URLField()


class LinkedInConnectionsListSerializer(serializers.Serializer):
    connections = LinkedInConnectionSerializer(many=True)


class LinkedInDisconnectResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


# Post Management Serializers
class SocialMediaConnectionSerializer(serializers.ModelSerializer):
    """Generic serializer for social media connections"""
    platform_name = serializers.CharField(source='platform.name', read_only=True)
    platform_display_name = serializers.CharField(source='platform.display_name', read_only=True)
    
    class Meta:
        model = SocialMediaConnection
        fields = [
            'id',
            'platform_name',
            'platform_display_name',
            'platform_username',
            'platform_display_name',
            'platform_profile_url',
            'instagram_username',
            'facebook_page_name',
            'pinterest_user_id',
            'is_active',
            'is_verified'
        ]


class SocialMediaPostSerializer(serializers.ModelSerializer):
    """Serializer for creating and managing social media posts"""
    connection_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True,
        help_text="List of SocialMediaConnection IDs to publish to"
    )
    media_files_data = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text="List of media files to upload"
    )
    connection = SocialMediaConnectionSerializer(read_only=True)
    platform_name = serializers.CharField(source='connection.platform.display_name', read_only=True)
    media_urls = serializers.ReadOnlyField(help_text="URLs of attached media files")
    media_count = serializers.ReadOnlyField(help_text="Number of attached media files")
    
    class Meta:
        model = SocialMediaPost
        fields = [
            'id',
            'connection_ids',
            'media_files_data',
            'connection',
            'platform_name',
            'text',
            'media_urls',
            'media_count',
            'status',
            'scheduled_at',
            'sent_at',
            'platform_post_id',
            'platform_post_url',
            'error_message',
            'created_at',
            'modified_at'
        ]
        read_only_fields = [
            'id',
            'sent_at',
            'platform_post_id',
            'platform_post_url',
            'created_at',
            'modified_at'
        ]
    
    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance:
            current_status = self.instance.status
            # Don't allow changing from sent status
            if current_status == 'sent' and value != 'sent':
                raise serializers.ValidationError("Cannot change status of a sent post")
            # Don't allow direct change to sent status
            if value == 'sent' and current_status != 'sending':
                raise serializers.ValidationError("Cannot directly set status to sent")
        return value
    
    def validate_scheduled_at(self, value):
        """Validate scheduled time is in the future"""
        if value:
            from django.utils import timezone
            if value <= timezone.now():
                raise serializers.ValidationError("Scheduled time must be in the future")
        return value
    
    def validate(self, attrs):
        """Validate the entire post data"""
        status = attrs.get('status', 'draft')
        scheduled_at = attrs.get('scheduled_at')
        
        # If status is scheduled, scheduled_at is required
        if status == 'scheduled' and not scheduled_at:
            raise serializers.ValidationError({
                'scheduled_at': 'Scheduled time is required for scheduled posts'
            })
        
        # If scheduled_at is provided, status should be scheduled
        if scheduled_at and status != 'scheduled':
            attrs['status'] = 'scheduled'
        
        return attrs
    
    def create(self, validated_data):
        """Create posts for multiple connections"""
        connection_ids = validated_data.pop('connection_ids')
        media_files_data = validated_data.pop('media_files_data', [])
        user = self.context['request'].user
        
        # Verify all connections belong to the user
        connections = SocialMediaConnection.objects.filter(
            id__in=connection_ids,
            user=user,
            is_active=True
        )
        
        if len(connections) != len(connection_ids):
            raise serializers.ValidationError("Invalid connection IDs provided")
        
        # Handle media file uploads
        media_objects = []
        if media_files_data:
            default_folder = Folder.get_or_create_default(user)
            for file in media_files_data:
                media = Media.objects.create(
                    user=user,
                    folder=default_folder,
                    image=file,
                    file_size=file.size,
                    file_name=file.name
                )
                media_objects.append(media)
        
        posts = []
        with transaction.atomic():
            for connection in connections:
                post = SocialMediaPost.objects.create(
                    user=user,
                    connection=connection,
                    **validated_data
                )
                # Add media files to the post
                if media_objects:
                    post.media_files.set(media_objects)
                    # Update usage count for each media
                    for media in media_objects:
                        media.used_in_posts_count += 1
                        media.save(update_fields=['used_in_posts_count'])
                
                posts.append(post)
        
        # Return the first post for single response
        return posts[0] if posts else None


class SocialMediaPostListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing posts"""
    platform_name = serializers.CharField(source='connection.platform.display_name', read_only=True)
    platform_username = serializers.CharField(source='connection.platform_username', read_only=True)
    
    class Meta:
        model = SocialMediaPost
        fields = [
            'id',
            'platform_name',
            'platform_username',
            'text',
            'media_urls',
            'status',
            'scheduled_at',
            'sent_at',
            'created_at'
        ]


class BulkPostCreateSerializer(serializers.Serializer):
    """Serializer for creating posts to multiple platforms at once"""
    connection_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of SocialMediaConnection IDs"
    )
    text = serializers.CharField(required=True)
    media_files_data = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=list,
        help_text="List of media files to upload"
    )
    status = serializers.ChoiceField(
        choices=['draft', 'scheduled'],
        default='draft'
    )
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate(self, attrs):
        """Validate bulk post creation"""
        status = attrs.get('status')
        scheduled_at = attrs.get('scheduled_at')
        
        if status == 'scheduled' and not scheduled_at:
            raise serializers.ValidationError({
                'scheduled_at': 'Scheduled time is required for scheduled posts'
            })
        
        if scheduled_at:
            from django.utils import timezone
            if scheduled_at <= timezone.now():
                raise serializers.ValidationError({
                    'scheduled_at': 'Scheduled time must be in the future'
                })
            attrs['status'] = 'scheduled'
        
        return attrs


class PostStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating post status"""
    status = serializers.ChoiceField(
        choices=['draft', 'scheduled', 'cancelled'],
        required=True
    )
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate(self, attrs):
        status = attrs.get('status')
        scheduled_at = attrs.get('scheduled_at')
        
        if status == 'scheduled' and not scheduled_at:
            raise serializers.ValidationError({
                'scheduled_at': 'Scheduled time is required for scheduled posts'
            })
        
        return attrs


# Media Management Serializers
class FolderSerializer(serializers.ModelSerializer):
    """Serializer for media folders"""
    media_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Folder
        fields = [
            'id',
            'name',
            'description',
            'is_default',
            'media_count',
            'created_at',
            'modified_at'
        ]
        read_only_fields = ['id', 'is_default', 'created_at', 'modified_at']
    
    def get_media_count(self, obj):
        """Get count of media files in this folder"""
        return obj.media_files.count()
    
    def validate_name(self, value):
        """Validate unique folder name per user"""
        user = self.context['request'].user
        if self.instance:
            # Updating existing folder
            if Folder.objects.filter(user=user, name=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A folder with this name already exists")
        else:
            # Creating new folder
            if Folder.objects.filter(user=user, name=value).exists():
                raise serializers.ValidationError("A folder with this name already exists")
        return value
    
    def create(self, validated_data):
        """Create folder for authenticated user"""
        user = self.context['request'].user
        return Folder.objects.create(user=user, **validated_data)


class MediaSerializer(serializers.ModelSerializer):
    """Serializer for media files"""
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    url = serializers.URLField(source='image.url', read_only=True)
    public_id = serializers.CharField(source='image.public_id', read_only=True)
    
    class Meta:
        model = Media
        fields = [
            'id',
            'folder',
            'folder_name',
            'image',
            'url',
            'public_id',
            'file_size',
            'file_name',
            'used_in_posts_count',
            'created_at',
            'modified_at'
        ]
        read_only_fields = ['id', 'url', 'public_id', 'created_at', 'modified_at']
    
    def validate_folder(self, value):
        """Validate folder belongs to user"""
        if value:
            user = self.context['request'].user
            if value.user != user:
                raise serializers.ValidationError("Invalid folder selected")
        return value
    
    def create(self, validated_data):
        """Create media for authenticated user"""
        user = self.context['request'].user
        
        # If no folder specified, use default
        if 'folder' not in validated_data or not validated_data['folder']:
            validated_data['folder'] = Folder.get_or_create_default(user)
        
        return Media.objects.create(user=user, **validated_data)


class MediaUploadSerializer(serializers.Serializer):
    """Serializer for uploading media files"""
    image = serializers.FileField(required=True)
    folder_id = serializers.IntegerField(required=False, allow_null=True)
    file_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate_image(self, value):
        """Validate that uploaded file is a valid image by MIME type"""
        if not value.content_type or not value.content_type.startswith('image/'):
            raise serializers.ValidationError("Uploaded file must be an image.")
        return value
    
    def validate_folder_id(self, value):
        """Validate folder belongs to user"""
        if value:
            user = self.context['request'].user
            try:
                folder = Folder.objects.get(id=value, user=user)
                return folder
            except Folder.DoesNotExist:
                raise serializers.ValidationError("Invalid folder selected")
        return None
    
    def create(self, validated_data):
        """Create media from uploaded file"""
        user = self.context['request'].user
        image_file = validated_data['image']
        folder = validated_data.get('folder_id') or Folder.get_or_create_default(user)
        file_name = validated_data.get('file_name') or image_file.name
        
        # Create media object
        media = Media.objects.create(
            user=user,
            folder=folder,
            image=image_file,
            file_size=image_file.size,
            file_name=file_name
        )
        
        return media


class BulkDeleteSerializer(serializers.Serializer):
    """Serializer for bulk delete operations"""
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        min_length=1,
        help_text="List of media IDs to delete"
    )
    
    def validate_ids(self, value):
        """Validate all IDs belong to the user"""
        user = self.context['request'].user
        existing_ids = set(
            Media.objects.filter(id__in=value, user=user).values_list('id', flat=True)
        )
        invalid_ids = set(value) - existing_ids
        
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid media IDs: {list(invalid_ids)}")
        
        return value


# Enhanced Storefront Serializers
class CustomLinkCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating custom links.
    Used in storefront management APIs.
    """
    thumbnail = serializers.FileField(required=False, allow_null=True)
    checkout_image = serializers.FileField(required=False, allow_null=True)
    collect_info_fields_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of collect info fields to create for this custom link"
    )
    
    def to_internal_value(self, data):
        """Handle multipart form data arrays and JSON strings"""
        import json
        
        # Create a mutable copy of data
        if hasattr(data, 'dict'):
            # Convert QueryDict to regular dict for processing
            data_dict = data.dict()
            # Handle lists manually for fields that need them
            if hasattr(data, 'getlist'):
                for key in data.keys():
                    values = data.getlist(key)
                    if len(values) > 1 or key == 'collect_info_fields_data':
                        data_dict[key] = values
            data = data_dict
        
        # Handle collect_info_fields_data JSON strings
        if 'collect_info_fields_data' in data:
            fields_data = data['collect_info_fields_data']
            if isinstance(fields_data, list):
                processed_fields = []
                for field in fields_data:
                    if isinstance(field, str):
                        try:
                            parsed = json.loads(field)
                            # If the parsed result is a list, extend instead of append
                            if isinstance(parsed, list):
                                processed_fields.extend(parsed)
                            else:
                                processed_fields.append(parsed)
                        except json.JSONDecodeError:
                            processed_fields.append(field)
                    else:
                        processed_fields.append(field)
                data['collect_info_fields_data'] = processed_fields
        
        # Handle additional_info JSON string  
        if 'additional_info' in data:
            additional_info = data['additional_info']
            if isinstance(additional_info, list) and len(additional_info) == 1:
                additional_info = additional_info[0]
            if isinstance(additional_info, str):
                try:
                    data['additional_info'] = json.loads(additional_info)
                except json.JSONDecodeError:
                    pass
        
        return super().to_internal_value(data)
    
    class Meta:
        model = CustomLink
        fields = [
            # Core fields
            'order', 'is_active', 'type',
            # Thumbnail info fields
            'thumbnail', 'title', 'subtitle', 
            # Style and button fields
            'button_text', 'style',
            # Checkout page fields
            'checkout_image', 'checkout_title', 'checkout_description', 
            'checkout_bottom_title', 'checkout_cta_button_text', 
            'checkout_price', 'checkout_discounted_price',
            # Additional info
            'additional_info',
            # Collect info fields data for creation
            'collect_info_fields_data'
        ]
    
    def validate_style(self, value):
        """Validate the style choice"""
        if value not in ['callout', 'button', 'checkout']:
            raise serializers.ValidationError("Invalid style choice")
        return value
    
    def validate_collect_info_fields_data(self, value):
        """Validate collect info fields data"""
        if not value:
            return value
        
        # Handle case where multipart form data sends JSON strings
        processed_fields = []
        for field_data in value:
            if isinstance(field_data, str):
                try:
                    import json
                    field_data = json.loads(field_data)
                except json.JSONDecodeError:
                    raise serializers.ValidationError("Invalid JSON in collect_info_fields_data")
            
            # Validate required keys
            required_keys = ['field_type', 'label']
            for key in required_keys:
                if key not in field_data:
                    raise serializers.ValidationError(f"Missing required field: {key}")
            
            # Validate field type
            valid_types = ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'tel', 'url']
            if field_data['field_type'] not in valid_types:
                raise serializers.ValidationError(f"Invalid field_type: {field_data['field_type']}")
            
            # Validate options for select/checkbox/radio fields
            if field_data['field_type'] in ['select', 'checkbox', 'radio'] and not field_data.get('options'):
                raise serializers.ValidationError(f"Options are required for {field_data['field_type']} fields")
            
            processed_fields.append(field_data)
        
        return processed_fields
    
    def create(self, validated_data):
        """Create custom link with collect info fields if provided"""
        collect_info_fields_data = validated_data.pop('collect_info_fields_data', [])
        
        # Create the custom link
        custom_link = super().create(validated_data)
        
        # Create collect info fields if provided (regardless of style)
        if collect_info_fields_data:
            for field_data in collect_info_fields_data:
                CollectInfoField.objects.create(
                    custom_link=custom_link,
                    **field_data
                )
        
        return custom_link
    
    def update(self, instance, validated_data):
        """Update custom link and handle collect info fields"""
        collect_info_fields_data = validated_data.pop('collect_info_fields_data', None)
        
        # Update the custom link
        custom_link = super().update(instance, validated_data)
        
        # Handle collect info fields if provided (regardless of style)
        if collect_info_fields_data is not None:
            # Delete existing fields and create new ones
            custom_link.collect_info_fields.all().delete()
            for field_data in collect_info_fields_data:
                CollectInfoField.objects.create(
                    custom_link=custom_link,
                    **field_data
                )
        
        return custom_link


class CollectInfoFieldCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating collect info fields"""
    
    class Meta:
        model = CollectInfoField
        fields = [
            'field_type', 'label', 'placeholder', 'is_required', 
            'order', 'options'
        ]
    
    def validate_field_type(self, value):
        """Validate field type choice"""
        valid_types = ['text', 'phone', 'multiple_choice', 'dropdown', 'checkbox']
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid field type. Must be one of: {valid_types}")
        return value
    
    def validate(self, attrs):
        """Validate field data based on type"""
        field_type = attrs.get('field_type')
        options = attrs.get('options')
        
        # Validate options for choice-based fields
        if field_type in ['multiple_choice', 'dropdown', 'checkbox']:
            if not options or not isinstance(options, list) or len(options) < 2:
                raise serializers.ValidationError(
                    f"{field_type} fields must have at least 2 options"
                )
            # Validate each option is a non-empty string
            for option in options:
                if not isinstance(option, str) or not option.strip():
                    raise serializers.ValidationError("All options must be non-empty strings")
        elif options:
            # Clear options for non-choice fields
            attrs['options'] = None
        
        return attrs


class CollectInfoResponseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating collect info responses (form submissions)"""
    
    class Meta:
        model = CollectInfoResponse
        fields = ['responses', 'ip_address', 'user_agent']
    
    def validate_responses(self, value):
        """Validate that responses is a dict with valid field data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Responses must be a dictionary")
        
        # Get the custom link from context
        custom_link = self.context.get('custom_link')
        if not custom_link:
            raise serializers.ValidationError("Custom link context is required")
        
        # Validate responses against collect info fields
        required_fields = custom_link.collect_info_fields.filter(is_required=True)
        available_fields = custom_link.collect_info_fields.all()
        
        # Check all required fields are provided
        for field in required_fields:
            field_key = str(field.id)
            if field_key not in value or not value[field_key]:
                raise serializers.ValidationError(
                    f"Response required for field: {field.label}"
                )
        
        # Validate each response
        for field_id, response in value.items():
            try:
                field = available_fields.get(id=int(field_id))
            except (ValueError, CollectInfoField.DoesNotExist):
                raise serializers.ValidationError(f"Invalid field ID: {field_id}")
            
            # Validate based on field type
            if field.field_type == 'phone':
                # Basic phone validation
                import re
                if not re.match(r'^[\+]?[1-9][\d\s\-\(\)]{7,15}$', str(response)):
                    raise serializers.ValidationError(
                        f"Invalid phone number format for field: {field.label}"
                    )
            elif field.field_type in ['multiple_choice', 'dropdown']:
                # Validate response is one of the available options
                if field.options and response not in field.options:
                    raise serializers.ValidationError(
                        f"Invalid option for field {field.label}. Must be one of: {field.options}"
                    )
            elif field.field_type == 'checkbox':
                # Validate checkbox response (can be multiple options)
                if field.options:
                    if isinstance(response, list):
                        invalid_options = [opt for opt in response if opt not in field.options]
                        if invalid_options:
                            raise serializers.ValidationError(
                                f"Invalid options for field {field.label}: {invalid_options}"
                            )
                    elif response not in field.options:
                        raise serializers.ValidationError(
                            f"Invalid option for field {field.label}. Must be from: {field.options}"
                        )
        
        return value


class ProfileAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for profile analytics data.
    """
    profile_id = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_clicks = serializers.IntegerField()
    date_range = serializers.DictField()
    top_links = CustomLinkSerializer(many=True)
    daily_views = serializers.ListField(child=serializers.DictField(), required=False)


class LinkClickSerializer(serializers.ModelSerializer):
    """
    Serializer for link click analytics.
    """
    custom_link_title = serializers.CharField(source='custom_link.title', read_only=True)
    custom_link_style = serializers.CharField(source='custom_link.style', read_only=True)
    custom_link_button_text = serializers.CharField(source='custom_link.button_text', read_only=True)
    
    class Meta:
        model = LinkClick
        fields = [
            'id', 'custom_link_title', 'custom_link_style', 'custom_link_button_text',
            'ip_address', 'user_agent', 'referrer', 'clicked_at'
        ]
        read_only_fields = ['id', 'clicked_at']


class ProfileViewSerializer(serializers.ModelSerializer):
    """
    Serializer for profile view analytics.
    """
    class Meta:
        model = ProfileView
        fields = [
            'id', 'ip_address', 'user_agent', 'referrer', 'viewed_at'
        ]
        read_only_fields = ['id', 'viewed_at']


# Comment Automation Serializers

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying received Facebook comments.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    platform_name = serializers.CharField(source='connection.platform.display_name', read_only=True)
    facebook_page_id = serializers.CharField(source='connection.facebook_page_id', read_only=True)
    
    class Meta:
        model = Comment
        fields = [
            'id',
            'comment_id',
            'post_id',
            'page_id',
            'facebook_page_id',
            'from_user_name',
            'from_user_id',
            'message',
            'status',
            'connection_name',
            'platform_name',
            'created_time',
            'received_at'
        ]
        read_only_fields = ['id', 'received_at']


class CommentListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing comments.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    facebook_page_id = serializers.CharField(source='connection.facebook_page_id', read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id',
            'comment_id',
            'from_user_name',
            'message',
            'status',
            'connection_name',
            'facebook_page_id',
            'created_time',
            'replies_count'
        ]
    
    def get_replies_count(self, obj):
        return obj.replies.count()


class CommentAutomationRuleSerializer(serializers.ModelSerializer):
    """
    Serializer for comment automation rules.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    times_triggered = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = CommentAutomationRule
        fields = [
            'id',
            'rule_name',
            'keywords',
            'reply_template',
            'is_active',
            'priority',
            'connection_name',
            'times_triggered',
            'created_at'
        ]
        read_only_fields = ['id', 'times_triggered', 'created_at']
    
    def validate_keywords(self, value):
        """Validate that keywords is a list of strings"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Keywords must be a list")
        if not value:
            raise serializers.ValidationError("At least one keyword is required")
        for keyword in value:
            if not isinstance(keyword, str) or not keyword.strip():
                raise serializers.ValidationError("All keywords must be non-empty strings")
        return [keyword.strip() for keyword in value]
    
    def validate_rule_name(self, value):
        """Validate rule name uniqueness per connection"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Get connection_id from request data
            connection_id = self.initial_data.get('connection_id')
            if connection_id:
                queryset = CommentAutomationRule.objects.filter(
                    user=request.user,
                    connection_id=connection_id,
                    rule_name=value
                )
                # Exclude current instance when updating
                if self.instance:
                    queryset = queryset.exclude(pk=self.instance.pk)
                if queryset.exists():
                    raise serializers.ValidationError(
                        "A rule with this name already exists for this connection"
                    )
        return value


class CommentAutomationRuleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating comment automation rules.
    """
    connection_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CommentAutomationRule
        fields = [
            'rule_name',
            'keywords', 
            'reply_template',
            'is_active',
            'priority',
            'connection_id'
        ]
    
    def validate_connection_id(self, value):
        """Validate that connection belongs to the user"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                connection = SocialMediaConnection.objects.get(
                    id=value,
                    user=request.user,
                    platform__name='facebook',
                    is_active=True
                )
                return value
            except SocialMediaConnection.DoesNotExist:
                raise serializers.ValidationError(
                    "Invalid connection ID or connection not found"
                )
        return value
    
    def validate_keywords(self, value):
        """Validate that keywords is a list of strings"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Keywords must be a list")
        if not value:
            raise serializers.ValidationError("At least one keyword is required")
        for keyword in value:
            if not isinstance(keyword, str) or not keyword.strip():
                raise serializers.ValidationError("All keywords must be non-empty strings")
        return [keyword.strip() for keyword in value]
    
    def create(self, validated_data):
        """Create rule with user and connection"""
        connection_id = validated_data.pop('connection_id')
        connection = SocialMediaConnection.objects.get(id=connection_id)
        
        rule = CommentAutomationRule.objects.create(
            user=self.context['request'].user,
            connection=connection,
            **validated_data
        )
        return rule


class CommentAutomationSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for comment automation settings.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    
    class Meta:
        model = CommentAutomationSettings
        fields = [
            'id',
            'is_enabled',
            'default_reply',
            'reply_delay_seconds',
            'connection_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_reply_delay_seconds(self, value):
        """Validate reply delay is reasonable"""
        if value < 0:
            raise serializers.ValidationError("Reply delay cannot be negative")
        if value > 3600:  # 1 hour max
            raise serializers.ValidationError("Reply delay cannot exceed 1 hour")
        return value


class CommentAutomationSettingsCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating comment automation settings.
    """
    connection_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CommentAutomationSettings
        fields = [
            'is_enabled',
            'default_reply',
            'reply_delay_seconds',
            'connection_id'
        ]
    
    def validate_connection_id(self, value):
        """Validate that connection belongs to the user"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                connection = SocialMediaConnection.objects.get(
                    id=value,
                    user=request.user,
                    platform__name='facebook',
                    is_active=True
                )
                return value
            except SocialMediaConnection.DoesNotExist:
                raise serializers.ValidationError(
                    "Invalid connection ID or connection not found"
                )
        return value
    
    def create(self, validated_data):
        """Create or update settings"""
        connection_id = validated_data.pop('connection_id')
        connection = SocialMediaConnection.objects.get(id=connection_id)
        user = self.context['request'].user
        
        # Use get_or_create to handle existing settings
        settings, created = CommentAutomationSettings.objects.get_or_create(
            user=user,
            connection=connection,
            defaults=validated_data
        )
        
        # If not created, update with new values
        if not created:
            for attr, value in validated_data.items():
                setattr(settings, attr, value)
            settings.save()
        
        return settings


class CommentReplySerializer(serializers.ModelSerializer):
    """
    Serializer for automated comment replies.
    """
    comment_message = serializers.CharField(source='comment.message', read_only=True)
    comment_from = serializers.CharField(source='comment.from_user_name', read_only=True)
    rule_name = serializers.CharField(source='rule.rule_name', read_only=True)
    
    class Meta:
        model = CommentReply
        fields = [
            'id',
            'reply_text',
            'facebook_reply_id',
            'status',
            'sent_at',
            'comment_message',
            'comment_from',
            'rule_name'
        ]
        read_only_fields = ['id', 'sent_at']


class CommentReplyListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing comment replies.
    """
    rule_name = serializers.CharField(source='rule.rule_name', read_only=True)
    comment_message = serializers.CharField(source='comment.message', read_only=True)
    comment_from_user = serializers.CharField(source='comment.from_user_name', read_only=True)
    page_name = serializers.CharField(source='comment.connection.facebook_page_name', read_only=True)
    
    class Meta:
        model = CommentReply
        fields = [
            'id',
            'reply_text',
            'status',
            'sent_at',
            'rule_name',
            'comment_message',
            'comment_from_user',
            'page_name'
        ]


# =============================================================================
# DIRECT MESSAGE SERIALIZERS
# =============================================================================

class DirectMessageSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for direct messages.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = DirectMessage
        fields = [
            'id',
            'message_id',
            'conversation_id',
            'platform',
            'platform_display',
            'sender_id',
            'sender_name',
            'message_text',
            'message_attachments',
            'connection',
            'connection_name',
            'status',
            'is_echo',
            'created_time',
            'received_at'
        ]
        read_only_fields = ['id', 'received_at']


class DirectMessageListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing direct messages.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DirectMessage
        fields = [
            'id',
            'message_id',
            'conversation_id',
            'platform',
            'platform_display',
            'sender_name',
            'message_text',
            'connection_name',
            'status',
            'created_time',
            'replies_count'
        ]
    
    def get_replies_count(self, obj):
        """Get count of replies for this direct message."""
        return obj.replies.count()


class DirectMessageReplySerializer(serializers.ModelSerializer):
    """
    Serializer for automated direct message replies.
    """
    message_text = serializers.CharField(source='direct_message.message_text', read_only=True)
    sender_name = serializers.CharField(source='direct_message.sender_name', read_only=True)
    rule_name = serializers.CharField(source='rule.rule_name', read_only=True)
    platform = serializers.CharField(source='direct_message.platform', read_only=True)
    
    class Meta:
        model = DirectMessageReply
        fields = [
            'id',
            'reply_text',
            'platform_reply_id',
            'status',
            'error_message',
            'sent_at',
            'message_text',
            'sender_name',
            'rule_name',
            'platform'
        ]
        read_only_fields = ['id', 'sent_at']


class DirectMessageReplyListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing direct message replies.
    """
    rule_name = serializers.CharField(source='rule.rule_name', read_only=True)
    message_text = serializers.CharField(source='direct_message.message_text', read_only=True)
    sender_name = serializers.CharField(source='direct_message.sender_name', read_only=True)
    platform = serializers.CharField(source='direct_message.platform', read_only=True)
    platform_display = serializers.CharField(source='direct_message.get_platform_display', read_only=True)
    connection_name = serializers.CharField(source='direct_message.connection.facebook_page_name', read_only=True)
    
    class Meta:
        model = DirectMessageReply
        fields = [
            'id',
            'reply_text',
            'status',
            'sent_at',
            'rule_name',
            'message_text',
            'sender_name',
            'platform',
            'platform_display',
            'connection_name'
        ]


# Update existing serializer classes to use the new model names
class AutomationRuleSerializer(serializers.ModelSerializer):
    """
    Serializer for automation rules (comments and DMs).
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    platform_name = serializers.CharField(source='connection.platform.name', read_only=True)
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)
    
    class Meta:
        model = AutomationRule
        fields = [
            'id',
            'rule_name',
            'message_type',
            'message_type_display',
            'keywords',
            'reply_template',
            'is_active',
            'priority',
            'times_triggered',
            'created_at',
            'connection',
            'connection_name',
            'platform_name'
        ]
        read_only_fields = ['id', 'times_triggered', 'created_at']


class AutomationRuleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating automation rules.
    """
    connection_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AutomationRule
        fields = [
            'rule_name',
            'message_type',
            'keywords',
            'reply_template',
            'is_active',
            'priority',
            'connection_id'
        ]
    
    def validate_keywords(self, value):
        """Validate keywords field."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Keywords must be a list.")
        if not value:
            raise serializers.ValidationError("At least one keyword is required.")
        return value
    
    def validate_connection_id(self, value):
        """Validate that connection belongs to user."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated.")
        
        try:
            connection = SocialMediaConnection.objects.get(
                id=value,
                user=request.user,
                is_active=True
            )
        except SocialMediaConnection.DoesNotExist:
            raise serializers.ValidationError("Invalid connection ID or connection not found.")
        
        return value
    
    def create(self, validated_data):
        """Create automation rule with user from request."""
        request = self.context.get('request')
        connection_id = validated_data.pop('connection_id')
        connection = SocialMediaConnection.objects.get(id=connection_id)
        
        return AutomationRule.objects.create(
            user=request.user,
            connection=connection,
            **validated_data
        )


class AutomationSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for automation settings.
    """
    connection_name = serializers.CharField(source='connection.facebook_page_name', read_only=True)
    platform_name = serializers.CharField(source='connection.platform.name', read_only=True)
    
    class Meta:
        model = AutomationSettings
        fields = [
            'id',
            'connection',
            'connection_name',
            'platform_name',
            'is_enabled',
            'default_reply',
            'reply_delay_seconds',
            'enable_dm_automation',
            'dm_default_reply',
            'dm_reply_delay_seconds',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AutomationSettingsCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating automation settings.
    """
    connection_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AutomationSettings
        fields = [
            'is_enabled',
            'default_reply',
            'reply_delay_seconds',
            'enable_dm_automation',
            'dm_default_reply',
            'dm_reply_delay_seconds',
            'connection_id'
        ]
    
    def validate_connection_id(self, value):
        """Validate that connection belongs to user."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated.")
        
        try:
            connection = SocialMediaConnection.objects.get(
                id=value,
                user=request.user,
                is_active=True
            )
        except SocialMediaConnection.DoesNotExist:
            raise serializers.ValidationError("Invalid connection ID or connection not found.")
        
        return value
    
    def create(self, validated_data):
        """Create or update automation settings."""
        request = self.context.get('request')
        connection_id = validated_data.pop('connection_id')
        connection = SocialMediaConnection.objects.get(id=connection_id)
        
        # Try to update existing settings or create new ones
        settings, created = AutomationSettings.objects.update_or_create(
            user=request.user,
            connection=connection,
            defaults=validated_data
        )
        
        return settings


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model to handle digital product purchases."""
    
    # Custom link info for read operations
    product_title = serializers.CharField(source='custom_link.title', read_only=True)
    product_subtitle = serializers.CharField(source='custom_link.subtitle', read_only=True) 
    product_thumbnail = serializers.CharField(source='custom_link.thumbnail', read_only=True)
    checkout_price = serializers.DecimalField(source='custom_link.checkout_price', max_digits=10, decimal_places=2, read_only=True)
    checkout_discounted_price = serializers.DecimalField(source='custom_link.checkout_discounted_price', max_digits=10, decimal_places=2, read_only=True)
    
    # Formatted responses for easier consumption
    formatted_responses = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id',
            'order_id',
            'status',
            'custom_link',
            'customer_email',
            'customer_name',
            'form_responses',
            'formatted_responses',
            'email_automation_enabled',
            'product_title',
            'product_subtitle',
            'product_thumbnail',
            'checkout_price',
            'checkout_discounted_price',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'order_id', 'created_at', 'updated_at']
    
    def get_formatted_responses(self, obj):
        """Return formatted form responses."""
        return obj.get_formatted_responses()
    
    def validate_custom_link(self, value):
        """Validate that the custom link exists and is active."""
        if not value.is_active:
            raise serializers.ValidationError("This product is no longer available.")
        return value
    
    def create(self, validated_data):
        """Create a new order with the provided form responses."""
        import json

        # Extract custom_link to get collect_info_fields
        custom_link = validated_data.get('custom_link')
        form_responses = validated_data.get('form_responses', {})

        # If form_responses is a string, parse it as JSON
        if isinstance(form_responses, str):
            try:
                form_responses = json.loads(form_responses)
                validated_data['form_responses'] = form_responses
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for form_responses.")

        # Validate required fields
        required_fields = custom_link.collect_info_fields.filter(is_required=True)
        for field in required_fields:
            if field.label not in form_responses or not form_responses[field.label]:
                raise serializers.ValidationError(f"Field '{field.label}' is required.")

        # ALWAYS use user profile's email automation setting, ignore what comes from request
        user_profile = custom_link.user_profile
        validated_data['email_automation_enabled'] = user_profile.email_automation_enabled

        order = super().create(validated_data)
        return order


# ============================================================================
# STRIPE CONNECT SERIALIZERS
# ============================================================================

class StripeConnectAccountSerializer(serializers.ModelSerializer):
    """Serializer for StripeConnectAccount model"""
    status = serializers.CharField(source='get_status', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = StripeConnectAccount
        fields = [
            'id', 'stripe_account_id', 'status', 'is_active',
            'charges_enabled', 'payouts_enabled', 'details_submitted',
            'country', 'default_currency', 'email', 'platform_fee_percentage',
            'onboarding_completed_at', 'requirements_due', 'requirements_errors',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'stripe_account_id', 'charges_enabled', 'payouts_enabled',
            'details_submitted', 'country', 'default_currency', 'requirements_due',
            'requirements_errors', 'onboarding_completed_at', 'created_at', 'updated_at'
        ]


class CreateConnectAccountSerializer(serializers.Serializer):
    """Serializer for creating a new Connect account"""
    email = serializers.EmailField(required=False, help_text="Email for the Stripe account")
    country = serializers.CharField(
        required=False,
        max_length=2,
        help_text="ISO 3166-1 alpha-2 country code (e.g., 'US', 'CA', 'GB'). Defaults to 'US' if not provided."
    )

    def validate_email(self, value):
        """Validate email if provided"""
        if value and not '@' in value:
            raise serializers.ValidationError("Invalid email format")
        return value

    def validate_country(self, value):
        """Validate country code format"""
        if value:
            # Convert to uppercase for consistency
            value = value.upper()
            # Basic validation - must be 2 characters
            if len(value) != 2:
                raise serializers.ValidationError("Country code must be a 2-character ISO 3166-1 alpha-2 code")
        return value


class AccountLinkSerializer(serializers.Serializer):
    """Serializer for creating account links"""
    refresh_url = serializers.URLField(required=True, help_text="URL to redirect to if user needs to restart onboarding")
    return_url = serializers.URLField(required=True, help_text="URL to redirect to after onboarding completion")
    type = serializers.ChoiceField(
        choices=['account_onboarding', 'account_update'],
        default='account_onboarding',
        help_text="Type of account link to create"
    )


class AccountLinkResponseSerializer(serializers.Serializer):
    """Response serializer for account link creation"""
    url = serializers.URLField(help_text="The account link URL")


class LoginLinkResponseSerializer(serializers.Serializer):
    """Response serializer for login link creation"""
    url = serializers.URLField(help_text="The Express Dashboard login URL")


class ConnectAccountStatusSerializer(serializers.Serializer):
    """Serializer for Connect account status"""
    account_id = serializers.CharField()
    charges_enabled = serializers.BooleanField()
    payouts_enabled = serializers.BooleanField()
    details_submitted = serializers.BooleanField()
    country = serializers.CharField()
    default_currency = serializers.CharField()
    is_active = serializers.BooleanField()
    requirements = serializers.JSONField(required=False)
    business_profile = serializers.JSONField(required=False)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for PaymentTransaction model"""
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    seller_username = serializers.CharField(source='seller_account.user.username', read_only=True)
    product_title = serializers.CharField(source='order.custom_link.title', read_only=True)
    display_amount = serializers.CharField(source='get_display_amount', read_only=True)
    seller_payout = serializers.CharField(source='get_seller_payout', read_only=True)
    platform_earnings = serializers.CharField(source='get_platform_earnings', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'order_id', 'seller_username', 'product_title',
            'stripe_checkout_session_id', 'payment_intent_id', 'charge_id', 'transfer_id',
            'total_amount', 'platform_fee', 'seller_amount', 'stripe_processing_fee',
            'display_amount', 'seller_payout', 'platform_earnings',
            'currency', 'status', 'transfer_status', 'customer_email',
            'refunded_amount', 'platform_fee_refunded', 'metadata',
            'created_at', 'updated_at', 'paid_at', 'transferred_at'
        ]
        read_only_fields = [
            'id', 'stripe_checkout_session_id', 'payment_intent_id', 'charge_id',
            'transfer_id', 'total_amount', 'platform_fee', 'seller_amount',
            'stripe_processing_fee', 'currency', 'status', 'transfer_status',
            'refunded_amount', 'platform_fee_refunded', 'created_at', 'updated_at',
            'paid_at', 'transferred_at'
        ]


class CreateCheckoutSessionSerializer(serializers.Serializer):
    """Serializer for creating a product checkout session"""
    custom_link_id = serializers.IntegerField(help_text="ID of the product/custom link")
    success_url = serializers.URLField(help_text="URL to redirect to after successful payment")
    cancel_url = serializers.URLField(help_text="URL to redirect to if payment is cancelled")
    customer_email = serializers.EmailField(required=False, help_text="Pre-fill customer email")
    metadata = serializers.JSONField(required=False, help_text="Additional metadata for the checkout session")
    
    def validate_custom_link_id(self, value):
        """Validate that the custom link exists and has Stripe connected"""
        try:
            custom_link = CustomLink.objects.get(id=value, is_active=True)
        except CustomLink.DoesNotExist:
            raise serializers.ValidationError("Product not found or inactive")
        
        # Check if the seller has Stripe Connect set up
        if not hasattr(custom_link.user_profile.user, 'connect_account'):
            raise serializers.ValidationError("Seller has not set up payment processing")
        
        connect_account = custom_link.user_profile.user.connect_account
        if not connect_account.is_active:
            raise serializers.ValidationError("Seller's payment account is not fully set up")
        
        # Check if product has a price
        if not custom_link.checkout_price:
            raise serializers.ValidationError("Product must have a price set")
        
        return value


class CheckoutSessionResponseSerializer(serializers.Serializer):
    """Response serializer for checkout session creation"""
    checkout_url = serializers.URLField(help_text="The Stripe Checkout URL")
    session_id = serializers.CharField(help_text="The checkout session ID")


class BalanceSerializer(serializers.Serializer):
    """Serializer for account balance information"""
    available = serializers.JSONField(help_text="Available balance by currency")
    pending = serializers.JSONField(help_text="Pending balance by currency")
    connect_reserved = serializers.JSONField(required=False, help_text="Connect reserved funds")
    livemode = serializers.BooleanField(help_text="Whether this is live mode data")


class RefundRequestSerializer(serializers.Serializer):
    """Serializer for refund requests"""
    payment_intent_id = serializers.CharField(help_text="Payment intent ID to refund")
    amount_cents = serializers.IntegerField(required=False, help_text="Amount to refund in cents (full refund if not specified)")
    reason = serializers.ChoiceField(
        choices=['duplicate', 'fraudulent', 'requested_by_customer'],
        default='requested_by_customer',
        help_text="Reason for the refund"
    )
    
    def validate_amount_cents(self, value):
        """Validate refund amount is positive"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Refund amount must be positive")
        return value


class RefundResponseSerializer(serializers.Serializer):
    """Response serializer for refund operations"""
    refund_id = serializers.CharField(help_text="Stripe refund ID")
    amount_refunded = serializers.IntegerField(help_text="Amount refunded in cents")
    status = serializers.CharField(help_text="Refund status")
    transaction_status = serializers.CharField(help_text="Updated transaction status")


class ConnectEarningsSerializer(serializers.Serializer):
    """Serializer for Connect earnings summary"""
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Total sales amount")
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Total platform earnings")
    pending_payouts = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Pending payout amount")
    transaction_count = serializers.IntegerField(help_text="Number of transactions")
    successful_transactions = serializers.IntegerField(help_text="Number of successful transactions")
    failed_transactions = serializers.IntegerField(help_text="Number of failed transactions")


class ConnectWebhookEventSerializer(serializers.ModelSerializer):
    """Serializer for Connect webhook events"""
    account_username = serializers.CharField(source='connect_account.user.username', read_only=True, allow_null=True)
    transaction_order_id = serializers.CharField(source='payment_transaction.order.order_id', read_only=True, allow_null=True)

    class Meta:
        model = ConnectWebhookEvent
        fields = [
            'id', 'stripe_event_id', 'event_type', 'account_id',
            'account_username', 'transaction_order_id',
            'processed', 'error_message', 'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'created_at']


class MiloPromptSerializer(serializers.ModelSerializer):
    """Serializer for Milo AI prompts"""

    class Meta:
        model = MiloPrompt
        fields = ['id', 'system_prompt', 'created_at', 'modified_at']
        read_only_fields = ['id', 'created_at', 'modified_at']


# ============================================================================
# Email Integration Serializers
# ============================================================================

class EmailAccountSerializer(serializers.ModelSerializer):
    """Serializer for email accounts"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = EmailAccount
        fields = [
            'id', 'user', 'username', 'user_email', 'email_address',
            'is_active', 'last_synced', 'token_expiry', 'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'user', 'token_expiry', 'last_synced', 'created_at', 'modified_at']


class EmailAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for email attachments"""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EmailAttachment
        fields = ['id', 'attachment_id', 'filename', 'content_type', 'size', 'file_url', 'created_at']
        read_only_fields = ['id', 'attachment_id', 'created_at']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class EmailMessageSerializer(serializers.ModelSerializer):
    """Serializer for email messages"""
    account_email = serializers.EmailField(source='account.email_address', read_only=True)
    attachments = EmailAttachmentSerializer(many=True, read_only=True)
    has_attachments_count = serializers.SerializerMethodField()

    class Meta:
        model = EmailMessage
        fields = [
            'id', 'account', 'account_email', 'message_id', 'thread_id',
            'from_email', 'from_name', 'to_emails', 'cc_emails',
            'subject', 'body_text', 'body_html', 'snippet',
            'received_at', 'is_read', 'is_starred', 'has_attachments',
            'has_attachments_count', 'labels', 'attachments', 'created_at', 'labels'
        ]
        read_only_fields = ['id', 'message_id', 'thread_id', 'received_at', 'created_at']

    def get_has_attachments_count(self, obj):
        return obj.attachments.count() if obj.has_attachments else 0


class EmailMessageListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing emails"""
    account_email = serializers.EmailField(source='account.email_address', read_only=True)

    class Meta:
        model = EmailMessage
        fields = [
            'id', 'account_email', 'message_id', 'from_email', 'from_name',
            'subject', 'snippet', 'received_at', 'is_read', 'is_starred',
            'has_attachments', 'labels'
        ]
        read_only_fields = ['id', 'message_id', 'received_at']


class EmailDraftSerializer(serializers.ModelSerializer):
    """Serializer for email drafts"""
    account_email = serializers.EmailField(source='account.email_address', read_only=True)

    class Meta:
        model = EmailDraft
        fields = [
            'id', 'account', 'account_email', 'to_emails', 'cc_emails',
            'bcc_emails', 'subject', 'body_html', 'attachments',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'created_at', 'modified_at']


# Request/Response Serializers for Gmail API endpoints

class GmailAuthUrlSerializer(serializers.Serializer):
    """Serializer for Gmail OAuth URL response"""
    auth_url = serializers.URLField()


class GmailConnectSerializer(serializers.Serializer):
    """Serializer for Gmail account connection"""
    code = serializers.CharField(required=True, help_text="OAuth authorization code from Google")
    state = serializers.CharField(required=False, allow_blank=True)


class GmailAccountResponseSerializer(serializers.Serializer):
    """Serializer for Gmail connection response"""
    id = serializers.IntegerField()
    email_address = serializers.EmailField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    message = serializers.CharField()


class EmailSendSerializer(serializers.Serializer):
    """Serializer for sending emails"""
    account_id = serializers.IntegerField(required=True)
    to_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=True,
        help_text="List of recipient email addresses"
    )
    cc_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True,
        help_text="List of CC email addresses"
    )
    bcc_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True,
        help_text="List of BCC email addresses"
    )
    subject = serializers.CharField(required=True, max_length=500)
    body_html = serializers.CharField(required=True, help_text="HTML body content")
    attachments = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="List of attachment dicts with 'filename' and 'content'"
    )

    def validate_to_emails(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one recipient is required")
        return value


class EmailSendResponseSerializer(serializers.Serializer):
    """Serializer for email send response"""
    message_id = serializers.CharField()
    thread_id = serializers.CharField()
    success = serializers.BooleanField()
    message = serializers.CharField()


class EmailSyncSerializer(serializers.Serializer):
    """Serializer for email sync request"""
    account_id = serializers.IntegerField(required=True)
    max_results = serializers.IntegerField(required=False, default=50, min_value=1, max_value=100)


class EmailSyncResponseSerializer(serializers.Serializer):
    """Serializer for email sync response"""
    synced_count = serializers.IntegerField()
    account_email = serializers.EmailField()
    last_synced = serializers.DateTimeField()
    message = serializers.CharField()


class EmailMarkReadSerializer(serializers.Serializer):
    """Serializer for marking email as read"""
    message_id = serializers.CharField(required=True)
    is_read = serializers.BooleanField(required=True)


class IframeMenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = IframeMenuItem
        fields = ['id', 'title', 'slug', 'link', 'icon', 'order', 'is_active']
        read_only_fields = ['id', 'created_at', 'modified_at']


class SystemConfigSerializer(serializers.ModelSerializer):
    """Serializer for system configuration"""
    class Meta:
        model = SystemConfig
        fields = ['id', 'checkout_url', 'created_at', 'modified_at']
        read_only_fields = ['id', 'created_at', 'modified_at']
