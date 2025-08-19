from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions, serializers

from .models import UserProfile, UserSocialLinks, SocialIcon, CustomLink, CTABanner, SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate, Plan, PlanFeature, Subscription, Folder, Media

User = get_user_model()


class UserCurrentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name"]


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
            "tiktok", "youtube", "twitter", "website"
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
        
        # Extract social media links (they're not part of User model)
        social_links = {}
        social_fields = ['instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter', 'website']
        for field in social_fields:
            if field in attrs:
                social_links[field] = attrs.pop(field, '')
        
        # Store social links for later use in create method
        self.social_links = social_links

        try:
            validate_password(attrs.get("password"))
        except exceptions.ValidationError:
            self.fail("password_invalid")

        if attrs["password"] == password_retype:
            return attrs

        return self.fail("password_mismatch")

    def create(self, validated_data):
        with transaction.atomic():
            # Create user with username, email, and password
            user = User.objects.create_user(**validated_data)

            # By default newly registered accounts are active.
            # Change to False if you want manual activation
            user.is_active = True
            user.save(update_fields=["is_active"])
            
            # Update social links if provided
            if hasattr(self, 'social_links') and self.social_links:
                social_links_obj = user.social_links
                for field, value in self.social_links.items():
                    if value:  # Only set non-empty values
                        setattr(social_links_obj, field, value)
                social_links_obj.save()

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
    class Meta:
        model = SocialIcon
        fields = ['platform', 'url']


class CustomLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomLink
        fields = ['text', 'url', 'thumbnail', 'order']


class CTABannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CTABanner
        fields = ['text', 'button_text', 'button_url']


class UserProfileSerializer(serializers.ModelSerializer):
    social_icons = SocialIconSerializer(many=True, read_only=True)
    custom_links = CustomLinkSerializer(many=True, read_only=True)
    cta_banner = CTABannerSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'slug', 'display_name', 'bio', 'profile_image', 
            'embedded_video', 'social_icons', 'custom_links', 'cta_banner'
        ]


class UserProfilePublicSerializer(serializers.ModelSerializer):
    social_icons = SocialIconSerializer(many=True, read_only=True)
    custom_links = CustomLinkSerializer(many=True, read_only=True)
    cta_banner = CTABannerSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'slug', 'display_name', 'bio', 'profile_image', 
            'embedded_video', 'social_icons', 'custom_links', 'cta_banner'
        ]

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
    connection = SocialMediaConnectionSerializer(read_only=True)
    platform_name = serializers.CharField(source='connection.platform.display_name', read_only=True)
    
    class Meta:
        model = SocialMediaPost
        fields = [
            'id',
            'connection_ids',
            'connection',
            'platform_name',
            'text',
            'media_urls',
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
        user = self.context['request'].user
        
        # Verify all connections belong to the user
        connections = SocialMediaConnection.objects.filter(
            id__in=connection_ids,
            user=user,
            is_active=True
        )
        
        if len(connections) != len(connection_ids):
            raise serializers.ValidationError("Invalid connection IDs provided")
        
        posts = []
        with transaction.atomic():
            for connection in connections:
                post = SocialMediaPost.objects.create(
                    user=user,
                    connection=connection,
                    **validated_data
                )
                posts.append(post)
        
        # Return the first post for single response
        # In practice, you might want to return all posts
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
    media_urls = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        default=list
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
