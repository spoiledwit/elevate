from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    User, UserProfile, SocialIcon, CustomLink, CTABanner, Subscription,
    TriggerRule, AIChatHistory,
    SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate
)

admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass


@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    list_display = ['user', 'display_name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'display_name', 'slug']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'display_name', 'slug')
        }),
        ('Profile Content', {
            'fields': ('bio', 'profile_image', 'embedded_video')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SocialIcon)
class SocialIconAdmin(ModelAdmin):
    list_display = ['user_profile', 'platform', 'url', 'is_active', 'created_at']
    list_filter = ['platform', 'is_active', 'created_at']
    search_fields = ['user_profile__user__username', 'platform', 'url']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('Icon Information', {
            'fields': ('user_profile', 'platform', 'url')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CustomLink)
class CustomLinkAdmin(ModelAdmin):
    list_display = ['user_profile', 'text', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user_profile__user__username', 'text', 'url']
    readonly_fields = ['created_at', 'modified_at']
    list_editable = ['order']
    fieldsets = (
        ('Link Information', {
            'fields': ('user_profile', 'text', 'url', 'thumbnail', 'order')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CTABanner)
class CTABannerAdmin(ModelAdmin):
    list_display = ['user_profile', 'text', 'button_text', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user_profile__user__username', 'text', 'button_text']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('Banner Information', {
            'fields': ('user_profile', 'text', 'button_text', 'button_url')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin):
    list_display = ['user', 'stripe_subscription_id', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['user__username', 'user__email', 'stripe_subscription_id']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('Subscription Information', {
            'fields': ('user', 'stripe_subscription_id', 'start_date', 'end_date', 'last_payment')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )





@admin.register(TriggerRule)
class TriggerRuleAdmin(ModelAdmin):
    list_display = ['user', 'trigger_word', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'trigger_word']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('Rule Information', {
            'fields': ('user', 'trigger_word', 'message_template', 'redirect_link')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AIChatHistory)
class AIChatHistoryAdmin(ModelAdmin):
    list_display = ['user', 'input_preview', 'context', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'input_text', 'context']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Chat Information', {
            'fields': ('user', 'input_text', 'output_text', 'context')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def input_preview(self, obj):
        return obj.input_text[:50] + '...' if len(obj.input_text) > 50 else obj.input_text
    input_preview.short_description = 'Input Preview'


# Social Media OAuth Admin
@admin.register(SocialMediaPlatform)
class SocialMediaPlatformAdmin(ModelAdmin):
    list_display = ["name", "display_name", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "display_name"]
    readonly_fields = ["created_at", "modified_at"]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'is_active')
        }),
        ('OAuth Configuration', {
            'fields': ('client_id', 'client_secret', 'auth_url', 'token_url', 'scope')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SocialMediaConnection)
class SocialMediaConnectionAdmin(ModelAdmin):
    list_display = ["user", "platform", "platform_username", "is_active", "is_verified", "last_used_at"]
    list_filter = ["platform", "is_active", "is_verified", "created_at", "last_used_at"]
    search_fields = ["user__username", "platform__name", "platform_username"]
    readonly_fields = ["created_at", "modified_at", "last_used_at", "last_error"]
    
    fieldsets = (
        ('Connection Information', {
            'fields': ('user', 'platform', 'is_active', 'is_verified')
        }),
        ('Platform Data', {
            'fields': ('platform_user_id', 'platform_username', 'platform_display_name', 'platform_profile_url')
        }),
        ('Token Information', {
            'fields': ('access_token', 'refresh_token', 'token_type', 'expires_at', 'scope'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('last_used_at', 'last_error')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'platform')


@admin.register(SocialMediaPost)
class SocialMediaPostAdmin(ModelAdmin):
    list_display = ["user", "platform", "text_preview", "status", "scheduled_at", "sent_at", "created_at"]
    list_filter = ["status", "connection__platform", "created_at", "scheduled_at", "sent_at"]
    search_fields = ["user__username", "text", "connection__platform__name"]
    readonly_fields = ["created_at", "modified_at", "sent_at", "platform_post_id", "platform_post_url", "error_message"]
    
    fieldsets = (
        ('Post Information', {
            'fields': ('user', 'connection', 'text', 'media_urls')
        }),
        ('Scheduling', {
            'fields': ('scheduled_at', 'sent_at')
        }),
        ('Status', {
            'fields': ('status', 'retry_count', 'error_message')
        }),
        ('Platform Response', {
            'fields': ('platform_post_id', 'platform_post_url'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def platform(self, obj):
        return obj.connection.platform.display_name
    platform.short_description = 'Platform'
    
    def text_preview(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Text Preview'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'connection__platform')


@admin.register(SocialMediaPostTemplate)
class SocialMediaPostTemplateAdmin(ModelAdmin):
    list_display = ["user", "name", "is_active", "is_public", "platforms_count", "created_at"]
    list_filter = ["is_active", "is_public", "created_at"]
    search_fields = ["user__username", "name", "description"]
    readonly_fields = ["created_at", "modified_at"]
    filter_horizontal = ["platforms"]
    
    fieldsets = (
        ('Template Information', {
            'fields': ('user', 'name', 'description', 'is_active', 'is_public')
        }),
        ('Content', {
            'fields': ('text_template', 'media_urls')
        }),
        ('Platforms', {
            'fields': ('platforms',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def platforms_count(self, obj):
        return obj.platforms.count()
    platforms_count.short_description = 'Platforms'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('platforms')
