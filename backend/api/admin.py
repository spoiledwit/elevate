from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from django.utils.translation import gettext_lazy as _
from .services.stripe_service import stripe_service
from django.contrib import messages

from .models import (
    User, UserProfile, UserSocialLinks, SocialIcon, CustomLink, CTABanner, Subscription,
    TriggerRule, AIChatHistory,
    SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate, PaymentEvent, Plan, PlanFeature, StripeCustomer,
    Folder, Media
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


@admin.register(UserSocialLinks)
class UserSocialLinksAdmin(ModelAdmin):
    list_display = ['user', 'links_count', 'created_at', 'modified_at']
    list_filter = ['created_at', 'modified_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Social Media Links', {
            'fields': ('instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter')
        }),
        ('Additional Links', {
            'fields': ('website',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def links_count(self, obj):
        """Count non-empty social links"""
        count = 0
        for field in ['instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter', 'website']:
            if getattr(obj, field, ''):
                count += 1
        return count
    links_count.short_description = 'Active Links'


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


# STRIPE ADMIN #


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 1
    fields = ("feature_key", "feature_name", "feature_value", "is_highlight", "sort_order")


@admin.register(Plan)
class PlanAdmin(ModelAdmin):
    list_display = ("name", "price", "billing_period", "is_active", "is_featured", "subscription_count", "stripe_synced", "created_at")
    list_filter = ("billing_period", "is_active", "is_featured", "created_at")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "modified_at", "stripe_product_id", "stripe_price_id")
    inlines = [PlanFeatureInline]
    actions = ["sync_to_stripe"]
    
    fieldsets = (
        (None, {
            "fields": ("name", "slug", "description")
        }),
        ("Pricing", {
            "fields": ("price", "billing_period", "trial_period_days")
        }),
        ("Display Options", {
            "fields": ("is_active", "is_featured", "sort_order")
        }),
        ("Stripe Integration", {
            "fields": ("stripe_product_id", "stripe_price_id"),
            "classes": ("collapse",),
            "description": "These fields are automatically managed when the plan is saved."
        }),
        ("Timestamps", {
            "fields": ("created_at", "modified_at"),
            "classes": ("collapse",)
        })
    )
    
    def subscription_count(self, obj):
        return obj.subscriptions.count()
    subscription_count.short_description = "Active Subscriptions"
    
    def stripe_synced(self, obj):
        """Check if plan is synced to Stripe"""
        return bool(obj.stripe_product_id and obj.stripe_price_id)
    stripe_synced.boolean = True
    stripe_synced.short_description = "Synced to Stripe"
    
    def save_model(self, request, obj, form, change):
        """Override save to sync with Stripe"""
        super().save_model(request, obj, form, change)
        
        try:
            # Sync to Stripe
            result = stripe_service.sync_plan_to_stripe(obj)
            messages.success(
                request,
                f"Plan '{obj.name}' synced to Stripe successfully. "
                f"Product ID: {result['stripe_product_id']}, "
                f"Price ID: {result['stripe_price_id']}"
            )
        except Exception as e:
            messages.error(
                request,
                f"Failed to sync plan to Stripe: {str(e)}"
            )
    
    @admin.action(description="Sync selected plans to Stripe")
    def sync_to_stripe(self, request, queryset):
        """Admin action to sync plans to Stripe"""
        success_count = 0
        error_count = 0
        
        for plan in queryset:
            try:
                stripe_service.sync_plan_to_stripe(plan)
                success_count += 1
            except Exception as e:
                error_count += 1
                messages.error(request, f"Error syncing {plan.name}: {str(e)}")
        
        if success_count:
            messages.success(
                request,
                f"Successfully synced {success_count} plan(s) to Stripe"
            )
        if error_count:
            messages.error(
                request,
                f"Failed to sync {error_count} plan(s) to Stripe"
            )


@admin.register(PlanFeature)
class PlanFeatureAdmin(ModelAdmin):
    list_display = ("plan", "feature_name", "feature_value", "is_highlight", "sort_order")
    list_filter = ("plan", "is_highlight")
    search_fields = ("feature_name", "feature_key", "feature_value")
    ordering = ("plan", "sort_order", "feature_name")


@admin.register(StripeCustomer)
class StripeCustomerAdmin(ModelAdmin):
    list_display = ("user", "stripe_customer_id", "created_at")
    search_fields = ("stripe_customer_id", "user__username", "user__email")


@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin):
    list_display = ("user", "plan", "status", "current_period_start", "current_period_end", "created_at")
    list_filter = ("status", "plan", "created_at")
    search_fields = ("user__username", "user__email", "plan__name", "stripe_subscription_id")
    readonly_fields = ("created_at",)


@admin.register(PaymentEvent)
class PaymentEventAdmin(ModelAdmin):
    list_display = ("user", "event_type", "created_at")
    search_fields = ("stripe_event_id", "event_type", "user__username", "user__email")


# Media Library Admin
@admin.register(Folder)
class FolderAdmin(ModelAdmin):
    list_display = ['user', 'name', 'is_default', 'media_count', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['user__username', 'user__email', 'name', 'description']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('Folder Information', {
            'fields': ('user', 'name', 'description', 'is_default')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def media_count(self, obj):
        return obj.media_files.count()
    media_count.short_description = 'Media Count'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('media_files')


@admin.register(Media)
class MediaAdmin(ModelAdmin):
    list_display = ['user', 'file_name', 'folder', 'file_size_display', 'used_in_posts_count', 'created_at']
    list_filter = ['folder', 'created_at']
    search_fields = ['user__username', 'user__email', 'file_name', 'folder__name']
    readonly_fields = ['created_at', 'modified_at', 'image']
    fieldsets = (
        ('Media Information', {
            'fields': ('user', 'folder', 'file_name')
        }),
        ('File Details', {
            'fields': ('image', 'file_size', 'used_in_posts_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def file_size_display(self, obj):
        if obj.file_size:
            # Convert bytes to KB/MB
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024 * 1024:
                return f"{obj.file_size // 1024} KB"
            else:
                return f"{obj.file_size // (1024 * 1024)} MB"
        return "Unknown"
    file_size_display.short_description = 'File Size'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'folder')
