from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions, serializers

from .models import UserProfile, SocialIcon, CustomLink, CTABanner, SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate

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

    default_error_messages = {
        "password_mismatch": _("Password are not matching."),
        "password_invalid": _("Password does not meet all requirements."),
    }

    class Meta:
        model = User
        fields = ["username", "password", "password_retype"]

    def validate(self, attrs):
        password_retype = attrs.pop("password_retype")

        try:
            validate_password(attrs.get("password"))
        except exceptions.ValidationError:
            self.fail("password_invalid")

        if attrs["password"] == password_retype:
            return attrs

        return self.fail("password_mismatch")

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(**validated_data)

            # By default newly registered accounts are inactive.
            user.is_active = False
            user.save(update_fields=["is_active"])

        return user


class UserCreateErrorSerializer(serializers.Serializer):
    username = serializers.ListSerializer(child=serializers.CharField(), required=False)
    password = serializers.ListSerializer(child=serializers.CharField(), required=False)
    password_retype = serializers.ListSerializer(
        child=serializers.CharField(), required=False
    )


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


# Social Media OAuth Serializers
class SocialMediaPlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaPlatform
        fields = ['id', 'name', 'display_name', 'auth_url', 'scope', 'is_active']
        read_only_fields = ['id', 'auth_url', 'scope']


class SocialMediaConnectionSerializer(serializers.ModelSerializer):
    platform = SocialMediaPlatformSerializer(read_only=True)
    platform_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = SocialMediaConnection
        fields = [
            'id', 'platform', 'platform_name', 'platform_user_id', 'platform_username',
            'platform_display_name', 'platform_profile_url', 'is_active', 'is_verified',
            'last_used_at', 'last_error', 'created_at', 'modified_at'
        ]
        read_only_fields = [
            'id', 'platform_user_id', 'platform_username', 'platform_display_name',
            'platform_profile_url', 'is_verified', 'last_used_at', 'last_error',
            'created_at', 'modified_at'
        ]


class SocialMediaConnectionCreateSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField()
    authorization_code = serializers.CharField(write_only=True)
    
    class Meta:
        model = SocialMediaConnection
        fields = ['platform_name', 'authorization_code']
    
    def create(self, validated_data):
        platform_name = validated_data.pop('platform_name')
        authorization_code = validated_data.pop('authorization_code')
        
        try:
            platform = SocialMediaPlatform.objects.get(name=platform_name, is_active=True)
        except SocialMediaPlatform.DoesNotExist:
            raise serializers.ValidationError(f"Platform {platform_name} is not supported or inactive")
        
        # Exchange authorization code for tokens
        # This would be implemented in the OAuth flow
        # For now, we'll create a placeholder connection
        
        connection = SocialMediaConnection.objects.create(
            user=self.context['request'].user,
            platform=platform,
            access_token="",  # Will be set by OAuth flow
            refresh_token="",  # Will be set by OAuth flow
            **validated_data
        )
        
        return connection


class SocialMediaPostSerializer(serializers.ModelSerializer):
    connection = SocialMediaConnectionSerializer(read_only=True)
    platform_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = SocialMediaPost
        fields = [
            'id', 'connection', 'platform_name', 'text', 'media_urls', 'scheduled_at',
            'sent_at', 'platform_post_id', 'platform_post_url', 'status',
            'error_message', 'retry_count', 'created_at', 'modified_at'
        ]
        read_only_fields = [
            'id', 'sent_at', 'platform_post_id', 'platform_post_url', 'status',
            'error_message', 'retry_count', 'created_at', 'modified_at'
        ]


class SocialMediaPostCreateSerializer(serializers.ModelSerializer):
    platform_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        help_text="List of platform names to post to"
    )
    
    class Meta:
        model = SocialMediaPost
        fields = ['text', 'media_urls', 'scheduled_at', 'platform_names']
    
    def validate_platform_names(self, value):
        from .services.factory import SocialMediaServiceFactory
        
        supported_platforms = SocialMediaServiceFactory.get_supported_platforms()
        invalid_platforms = [p for p in value if p.lower() not in supported_platforms]
        
        if invalid_platforms:
            raise serializers.ValidationError(
                f"Unsupported platforms: {', '.join(invalid_platforms)}"
            )
        
        return value


class SocialMediaPostTemplateSerializer(serializers.ModelSerializer):
    platforms = SocialMediaPlatformSerializer(many=True, read_only=True)
    platform_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SocialMediaPostTemplate
        fields = [
            'id', 'name', 'description', 'text_template', 'media_urls',
            'platforms', 'platform_names', 'is_active', 'is_public',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'created_at', 'modified_at']
    
    def create(self, validated_data):
        platform_names = validated_data.pop('platform_names', [])
        template = super().create(validated_data)
        
        if platform_names:
            platforms = SocialMediaPlatform.objects.filter(name__in=platform_names)
            template.platforms.set(platforms)
        
        return template
    
    def update(self, instance, validated_data):
        platform_names = validated_data.pop('platform_names', None)
        template = super().update(instance, validated_data)
        
        if platform_names is not None:
            platforms = SocialMediaPlatform.objects.filter(name__in=platform_names)
            template.platforms.set(platforms)
        
        return template



