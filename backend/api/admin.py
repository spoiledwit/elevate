from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .services.stripe_service import stripe_service
from django.contrib import messages
from import_export.admin import ImportExportModelAdmin
from unfold.contrib.import_export.forms import ExportForm, ImportForm
from django.db import transaction
import logging

from .models import (
    User, UserProfile, UserSocialLinks, UserPermissions, SocialIcon, CustomLinkTemplate, CustomLink, CollectInfoField, CollectInfoResponse, CTABanner, Subscription,
    ProfileView, LinkClick, BannerClick, Order,
    SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate, PaymentEvent, Plan, PlanFeature, StripeCustomer,
    Folder, Media, Comment, AutomationRule, AutomationSettings, CommentReply, DirectMessage, DirectMessageReply, AIConfiguration, MiloPrompt,
    StripeConnectAccount, PaymentTransaction, ConnectWebhookEvent, FreebieFollowupEmail, ScheduledFollowupEmail, OptinFollowupEmail, ScheduledOptinEmail,
    EmailAccount, EmailMessage, EmailAttachment, EmailDraft, CanvaConnection, CanvaDesign
)
from tinymce.widgets import TinyMCE
from django import forms

# Logger
logger = logging.getLogger(__name__)

# Backwards compatibility aliases
CommentAutomationRule = AutomationRule
CommentAutomationSettings = AutomationSettings

admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin, ImportExportModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    import_form_class = ImportForm
    export_form_class = ExportForm


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm


@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user', 'display_name', 'slug', 'view_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'display_name', 'slug']
    readonly_fields = ['created_at', 'modified_at', 'view_count']
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'display_name', 'slug')
        }),
        ('Profile Content', {
            'fields': ('bio', 'profile_image', 'embedded_video')
        }),
        ('Analytics', {
            'fields': ('view_count',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def view_count(self, obj):
        """Return the number of profile views"""
        return obj.profile_views.count()
    view_count.short_description = 'Profile Views'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('profile_views')


@admin.register(UserSocialLinks)
class UserSocialLinksAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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


@admin.register(UserPermissions)
class UserPermissionsAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user', 'permissions_summary', 'can_edit_profile', 'can_manage_integrations', 'can_view_analytics', 'created_at']
    list_filter = [
        'can_access_overview', 'can_access_linkinbio', 'can_access_content', 
        'can_access_automation', 'can_access_ai_tools', 'can_access_business', 
        'can_access_account', 'can_edit_profile', 'can_manage_integrations', 
        'can_view_analytics', 'created_at'
    ]
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'modified_at']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Dashboard Section Permissions', {
            'fields': (
                'can_access_overview', 
                'can_access_linkinbio', 
                'can_access_content',
                'can_access_automation', 
                'can_access_ai_tools', 
                'can_access_business',
                'can_access_account'
            ),
            'description': 'Control access to the 7 main dashboard sections'
        }),
        ('Additional Permissions', {
            'fields': (
                'can_edit_profile', 
                'can_manage_integrations', 
                'can_view_analytics'
            ),
            'description': 'Granular permissions for specific features'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def permissions_summary(self, obj):
        """Show a summary of enabled dashboard sections"""
        sections = obj.get_accessible_sections()
        section_names = {
            'overview': 'Overview',
            'linkinbio': 'Link-in-Bio', 
            'content': 'Content',
            'automation': 'Automation',
            'ai-tools': 'AI Tools',
            'business': 'Business',
            'account': 'Account'
        }
        enabled = [section_names.get(s, s) for s in sections]
        if len(enabled) == 7:
            return "All Sections"
        elif len(enabled) == 0:
            return "No Access"
        elif len(enabled) <= 3:
            return ", ".join(enabled)
        else:
            return f"{', '.join(enabled[:2])} +{len(enabled)-2} more"
    permissions_summary.short_description = 'Accessible Sections'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(SocialIcon)
class SocialIconAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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


class CustomLinkTemplateAdminForm(forms.ModelForm):
    class Meta:
        model = CustomLinkTemplate
        fields = '__all__'
        widgets = {
            'checkout_description': TinyMCE(attrs={'cols': 80, 'rows': 20}),
        }


@admin.register(CustomLinkTemplate)
class CustomLinkTemplateAdmin(ModelAdmin, ImportExportModelAdmin):
    """Admin for managing master templates for custom links"""
    form = CustomLinkTemplateAdminForm
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['name', 'title', 'style', 'type', 'user_count', 'is_active', 'modified_at']
    list_filter = ['style', 'type', 'is_active', 'created_at']
    search_fields = ['name', 'title', 'checkout_title', 'subtitle']
    readonly_fields = ['created_at', 'modified_at']
    actions = ['distribute_to_all_users', 'sync_to_all_users']

    fieldsets = (
        ('Template Information', {
            'fields': ('name', 'type', 'style', 'order', 'is_active'),
            'description': 'Basic template configuration'
        }),
        ('Callout Fields', {
            'fields': ('title', 'subtitle', 'thumbnail'),
            'classes': ('collapse',),
            'description': 'Fields used when style is set to Callout'
        }),
        ('Button Fields', {
            'fields': ('button_text',),
            'classes': ('collapse',),
            'description': 'Fields used when style is set to Button'
        }),
        ('Checkout Fields', {
            'fields': ('checkout_image', 'checkout_title', 'checkout_description', 'checkout_bottom_title', 'checkout_cta_button_text', 'checkout_price', 'checkout_discounted_price'),
            'classes': ('collapse',),
            'description': 'Fields used when style is set to Checkout'
        }),
        ('Additional Info', {
            'fields': ('additional_info',),
            'classes': ('collapse',),
            'description': 'Product-specific information stored as JSON'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    def user_count(self, obj):
        """Show how many users have this template"""
        return obj.user_links.count()
    user_count.short_description = 'Users'

    @admin.action(description="Distribute to all users")
    def distribute_to_all_users(self, request, queryset):
        """Admin action: Distribute selected templates to ALL users with bulk operations"""
        BATCH_SIZE = 500
        total_created = 0

        try:
            with transaction.atomic():
                for template in queryset:
                    # Get all user profiles at once
                    all_profiles = list(UserProfile.objects.all().values_list('id', flat=True))

                    # Pre-query existing links for this template to avoid duplicates
                    existing_profile_ids = set(
                        CustomLink.objects.filter(template=template)
                        .values_list('user_profile_id', flat=True)
                    )

                    # Filter out profiles that already have this template
                    profiles_to_create = [
                        profile_id for profile_id in all_profiles
                        if profile_id not in existing_profile_ids
                    ]

                    # Build CustomLink instances in memory
                    links_to_create = []
                    for profile_id in profiles_to_create:
                        links_to_create.append(
                            CustomLink(
                                user_profile_id=profile_id,
                                template=template,
                                order=template.order,
                                type=template.type,
                                thumbnail=template.thumbnail,
                                title=template.title,
                                subtitle=template.subtitle,
                                button_text=template.button_text,
                                style=template.style,
                                checkout_image=template.checkout_image,
                                checkout_title=template.checkout_title,
                                checkout_description=template.checkout_description,
                                checkout_bottom_title=template.checkout_bottom_title,
                                checkout_cta_button_text=template.checkout_cta_button_text,
                                checkout_price=template.checkout_price,
                                checkout_discounted_price=template.checkout_discounted_price,
                                additional_info=template.additional_info,
                                is_active=template.is_active,
                            )
                        )

                    # Bulk create in batches
                    for i in range(0, len(links_to_create), BATCH_SIZE):
                        batch = links_to_create[i:i + BATCH_SIZE]
                        try:
                            # Bulk create without ignore_conflicts to get IDs
                            CustomLink.objects.bulk_create(batch)
                            total_created += len(batch)

                            # Get the profile IDs from this batch
                            batch_profile_ids = [link.user_profile_id for link in batch]

                            # Fetch the created links to get their IDs
                            created_links = CustomLink.objects.filter(
                                user_profile_id__in=batch_profile_ids,
                                template=template
                            )

                            # Create default collect info fields (name and email) for each link
                            collect_info_fields = []
                            for link in created_links:
                                # Name field
                                collect_info_fields.append(
                                    CollectInfoField(
                                        custom_link=link,
                                        field_type='text',
                                        label='Full Name',
                                        placeholder='Enter your full name',
                                        is_required=True,
                                        order=0
                                    )
                                )
                                # Email field
                                collect_info_fields.append(
                                    CollectInfoField(
                                        custom_link=link,
                                        field_type='email',
                                        label='Email Address',
                                        placeholder='Enter your email address',
                                        is_required=True,
                                        order=1
                                    )
                                )

                            # Bulk create collect info fields
                            if collect_info_fields:
                                CollectInfoField.objects.bulk_create(collect_info_fields)

                        except Exception as batch_error:
                            logger.exception(
                                "Error in bulk_create batch for template %s: %s",
                                template.id, str(batch_error)
                            )
                            # Continue with next batch even if this one fails

                self.message_user(
                    request,
                    f"Distributed to {total_created} users across {queryset.count()} template(s)",
                    messages.SUCCESS
                )

        except Exception as e:
            logger.exception("Error distributing templates to users: %s", str(e))
            self.message_user(
                request,
                f"Error distributing templates: {str(e)}. Changes have been rolled back.",
                messages.ERROR
            )

    @admin.action(description="Sync to all users (update existing)")
    def sync_to_all_users(self, request, queryset):
        """Admin action: Sync/update existing template links for all users"""
        total_updated = 0
        for template in queryset:
            updated_count = template.sync_to_user_links()
            total_updated += updated_count

        self.message_user(request, f"Synced {total_updated} user links", messages.SUCCESS)

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('user_links')


class CustomLinkAdminForm(forms.ModelForm):
    class Meta:
        model = CustomLink
        fields = '__all__'
        widgets = {
            'checkout_description': TinyMCE(attrs={'cols': 80, 'rows': 20}),
        }


@admin.register(CustomLink)
class CustomLinkAdmin(ModelAdmin, ImportExportModelAdmin):
    form = CustomLinkAdminForm
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user_profile', 'display_title', 'type', 'style', 'order', 'click_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'type', 'style', 'created_at']
    search_fields = ['user_profile__user__username', 'title', 'button_text', 'checkout_title']
    readonly_fields = ['created_at', 'modified_at', 'click_count']
    list_editable = ['order']
    actions = ['convert_to_template']

    def display_title(self, obj):
        return obj.title or obj.button_text or obj.checkout_title or 'Untitled'
    display_title.short_description = 'Title'

    @admin.action(description="Convert to template")
    def convert_to_template(self, request, queryset):
        """Convert selected custom links into templates"""
        total_created = 0

        try:
            with transaction.atomic():
                for link in queryset:
                    # Create template name from link title
                    template_name = link.title or link.button_text or link.checkout_title or f"Template from {link.user_profile.user.username}"

                    # Create a new template from this link
                    CustomLinkTemplate.objects.create(
                        name=template_name,
                        order=link.order,
                        type=link.type,
                        thumbnail=link.thumbnail,
                        title=link.title,
                        subtitle=link.subtitle,
                        button_text=link.button_text,
                        style=link.style,
                        checkout_image=link.checkout_image,
                        checkout_title=link.checkout_title,
                        checkout_description=link.checkout_description,
                        checkout_bottom_title=link.checkout_bottom_title,
                        checkout_cta_button_text=link.checkout_cta_button_text,
                        checkout_price=link.checkout_price,
                        checkout_discounted_price=link.checkout_discounted_price,
                        additional_info=link.additional_info,
                        is_active=link.is_active,
                    )
                    total_created += 1

                # Success - all templates created
                self.message_user(request, f"Created {total_created} template(s) from selected links", messages.SUCCESS)

        except Exception as e:
            # Log the exception with full traceback
            logger.exception("Error converting custom links to templates: %s", str(e))

            # Show error message to admin
            self.message_user(
                request,
                f"Error creating templates: {str(e)}. All changes have been rolled back.",
                messages.ERROR
            )
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user_profile', 'type', 'style', 'order', 'is_active')
        }),
        ('Callout Fields', {
            'fields': ('title', 'subtitle', 'thumbnail'),
            'classes': ('collapse',),
            'description': 'Fields used when style is set to Callout'
        }),
        ('Button Fields', {
            'fields': ('button_text',),
            'classes': ('collapse',),
            'description': 'Fields used when style is set to Button'
        }),
        ('Checkout Fields', {
            'fields': ('checkout_image', 'checkout_title', 'checkout_description', 'checkout_bottom_title', 'checkout_cta_button_text', 'checkout_price', 'checkout_discounted_price'),
            'classes': ('collapse',),
            'description': 'Fields used when style is set to Checkout'
        }),
        ('Collect Info Fields', {
            'fields': (),
            'classes': ('collapse',),
            'description': 'Collect Info fields are managed through the CollectInfoField model. See the related CollectInfoField entries for this CustomLink.'
        }),
        ('Additional Info', {
            'fields': ('additional_info',),
            'classes': ('collapse',),
            'description': 'Product-specific information stored as JSON'
        }),
        ('Analytics', {
            'fields': ('click_count',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )
    
    def click_count(self, obj):
        """Return the number of clicks for this link"""
        return obj.clicks.count()
    click_count.short_description = 'Click Count'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user_profile__user').prefetch_related('clicks')


@admin.register(CollectInfoField)
class CollectInfoFieldAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['custom_link', 'label', 'field_type', 'is_required', 'order', 'created_at']
    list_filter = ['field_type', 'is_required', 'created_at']
    search_fields = ['custom_link__title', 'custom_link__button_text', 'label']
    readonly_fields = ['created_at', 'modified_at']
    list_editable = ['order']
    
    fieldsets = (
        ('Field Information', {
            'fields': ('custom_link', 'field_type', 'label', 'placeholder', 'is_required', 'order')
        }),
        ('Options (for dropdowns/checkboxes)', {
            'fields': ('options',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CollectInfoResponse)
class CollectInfoResponseAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['custom_link', 'submitted_at', 'ip_address']
    list_filter = ['submitted_at', 'custom_link__style']
    search_fields = ['custom_link__title', 'custom_link__button_text', 'ip_address']
    readonly_fields = ['submitted_at']
    date_hierarchy = 'submitted_at'
    
    fieldsets = (
        ('Response Information', {
            'fields': ('custom_link', 'responses')
        }),
        ('Visitor Info', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Timestamp', {
            'fields': ('submitted_at',)
        }),
    )


@admin.register(Order)
class OrderAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['order_id', 'custom_link_product', 'customer_email', 'customer_name', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'custom_link__type']
    search_fields = ['order_id', 'customer_email', 'customer_name', 'custom_link__title', 'custom_link__checkout_title']
    readonly_fields = ['order_id', 'created_at', 'updated_at', 'formatted_responses']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_id', 'custom_link', 'status')
        }),
        ('Customer Details', {
            'fields': ('customer_name', 'customer_email')
        }),
        ('Form Responses', {
            'fields': ('form_responses', 'formatted_responses'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def custom_link_product(self, obj):
        """Display product title from custom link"""
        if obj.custom_link.checkout_title:
            return obj.custom_link.checkout_title
        elif obj.custom_link.title:
            return obj.custom_link.title
        else:
            return f"Product #{obj.custom_link.id}"
    custom_link_product.short_description = 'Product'
    custom_link_product.admin_order_field = 'custom_link__checkout_title'
    
    def formatted_responses(self, obj):
        """Display formatted responses in a readable format"""
        responses = obj.get_formatted_responses()
        if not responses:
            return "No responses"
        
        formatted_html = "<ul>"
        for response in responses:
            formatted_html += f"<li><strong>{response['question']}:</strong> {response['answer']}</li>"
        formatted_html += "</ul>"
        return formatted_html
    formatted_responses.short_description = 'Form Responses'
    formatted_responses.allow_tags = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('custom_link')


@admin.register(CTABanner)
class CTABannerAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user_profile', 'text', 'button_text', 'style', 'is_active', 'click_count', 'created_at']
    list_filter = ['style', 'is_active', 'created_at']
    search_fields = ['user_profile__user__username', 'text', 'button_text']
    readonly_fields = ['created_at', 'modified_at', 'click_count']
    fieldsets = (
        ('Banner Information', {
            'fields': ('user_profile', 'text', 'button_text', 'button_url', 'style')
        }),
        ('Status & Analytics', {
            'fields': ('is_active', 'click_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )








# Social Media OAuth Admin
@admin.register(SocialMediaPlatform)
class SocialMediaPlatformAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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
class SocialMediaConnectionAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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
class SocialMediaPostAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ["user", "platform", "text_preview", "status", "scheduled_at", "sent_at", "created_at"]
    list_filter = ["status", "connection__platform", "created_at", "scheduled_at", "sent_at"]
    search_fields = ["user__username", "text", "connection__platform__name"]
    readonly_fields = ["created_at", "modified_at", "sent_at", "platform_post_id", "platform_post_url", "error_message"]
    
    fieldsets = (
        ('Post Information', {
            'fields': ('user', 'connection', 'text', 'media_files')
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
class SocialMediaPostTemplateAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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
            'fields': ('text_template',)
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
class PlanAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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
class PlanFeatureAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("plan", "feature_name", "feature_value", "is_highlight", "sort_order")
    list_filter = ("plan", "is_highlight")
    search_fields = ("feature_name", "feature_key", "feature_value")
    ordering = ("plan", "sort_order", "feature_name")


@admin.register(StripeCustomer)
class StripeCustomerAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("user", "stripe_customer_id", "created_at")
    search_fields = ("stripe_customer_id", "user__username", "user__email")


@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("user", "plan", "status", "current_period_start", "current_period_end", "created_at")
    list_filter = ("status", "plan", "created_at")
    search_fields = ("user__username", "user__email", "plan__name", "stripe_subscription_id")
    readonly_fields = ("created_at",)


@admin.register(PaymentEvent)
class PaymentEventAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ("user", "event_type", "created_at")
    search_fields = ("stripe_event_id", "event_type", "user__username", "user__email")


# Media Library Admin
@admin.register(Folder)
class FolderAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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
class MediaAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
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


# Analytics Admin
@admin.register(ProfileView)
class ProfileViewAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user_profile', 'ip_address', 'user_agent_short', 'referrer_domain', 'viewed_at']
    list_filter = ['viewed_at', 'user_profile__user__username']
    search_fields = ['user_profile__user__username', 'ip_address', 'user_agent', 'referrer']
    readonly_fields = ['viewed_at']
    date_hierarchy = 'viewed_at'
    
    fieldsets = (
        ('Profile View Information', {
            'fields': ('user_profile', 'ip_address', 'user_agent', 'referrer')
        }),
        ('Timestamps', {
            'fields': ('viewed_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_agent_short(self, obj):
        if obj.user_agent:
            return obj.user_agent[:50] + '...' if len(obj.user_agent) > 50 else obj.user_agent
        return 'Unknown'
    user_agent_short.short_description = 'User Agent'
    
    def referrer_domain(self, obj):
        if obj.referrer:
            from urllib.parse import urlparse
            domain = urlparse(obj.referrer).netloc
            return domain if domain else obj.referrer[:30]
        return 'Direct'
    referrer_domain.short_description = 'Referrer'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user_profile__user')


@admin.register(BannerClick)
class BannerClickAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['banner', 'banner_user', 'ip_address', 'user_agent_short', 'referrer_domain', 'timestamp']
    list_filter = ['timestamp', 'banner__user_profile__user__username']
    search_fields = ['banner__user_profile__user__username', 'banner__text', 'ip_address', 'user_agent']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Banner Click Information', {
            'fields': ('banner', 'ip_address', 'user_agent', 'referrer')
        }),
        ('Timestamps', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
    
    def banner_user(self, obj):
        return obj.banner.user_profile.user.username
    banner_user.short_description = 'User'
    banner_user.admin_order_field = 'banner__user_profile__user__username'
    
    def user_agent_short(self, obj):
        if obj.user_agent:
            return obj.user_agent[:50] + '...' if len(obj.user_agent) > 50 else obj.user_agent
        return 'Unknown'
    user_agent_short.short_description = 'User Agent'
    
    def referrer_domain(self, obj):
        if obj.referrer:
            try:
                from urllib.parse import urlparse
                return urlparse(obj.referrer).netloc
            except:
                return obj.referrer[:30] + '...' if len(obj.referrer) > 30 else obj.referrer
        return 'Direct'
    referrer_domain.short_description = 'Referrer Domain'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('banner__user_profile__user')


@admin.register(LinkClick)
class LinkClickAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['custom_link', 'user_profile', 'ip_address', 'user_agent_short', 'referrer_domain', 'clicked_at']
    list_filter = ['clicked_at', 'user_profile__user__username', 'custom_link__style']
    search_fields = ['user_profile__user__username', 'custom_link__title', 'custom_link__button_text', 'ip_address', 'user_agent']
    readonly_fields = ['clicked_at']
    date_hierarchy = 'clicked_at'
    
    fieldsets = (
        ('Link Click Information', {
            'fields': ('user_profile', 'custom_link', 'ip_address', 'user_agent', 'referrer')
        }),
        ('Timestamps', {
            'fields': ('clicked_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_agent_short(self, obj):
        if obj.user_agent:
            return obj.user_agent[:50] + '...' if len(obj.user_agent) > 50 else obj.user_agent
        return 'Unknown'
    user_agent_short.short_description = 'User Agent'
    
    def referrer_domain(self, obj):
        if obj.referrer:
            from urllib.parse import urlparse
            domain = urlparse(obj.referrer).netloc
            return domain if domain else obj.referrer[:30]
        return 'Direct'
    referrer_domain.short_description = 'Referrer'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user_profile__user', 'custom_link')


# Comment Automation Admin
@admin.register(Comment)
class CommentAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['comment_id', 'from_user_name', 'message_preview', 'connection_page', 'status', 'created_time']
    list_filter = ['status', 'connection__platform', 'created_time', 'received_at']
    search_fields = ['comment_id', 'from_user_name', 'message', 'connection__facebook_page_name']
    readonly_fields = ['comment_id', 'post_id', 'page_id', 'from_user_name', 'from_user_id', 'message', 'created_time', 'received_at']
    
    fieldsets = (
        ('Facebook Data', {
            'fields': ('comment_id', 'post_id', 'page_id', 'from_user_name', 'from_user_id')
        }),
        ('Comment Content', {
            'fields': ('message', 'status')
        }),
        ('Connection', {
            'fields': ('connection',)
        }),
        ('Timestamps', {
            'fields': ('created_time', 'received_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message Preview'
    
    def connection_page(self, obj):
        return obj.connection.facebook_page_name or 'Unknown Page'
    connection_page.short_description = 'Facebook Page'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('connection')


@admin.register(AutomationRule)
class AutomationRuleAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['rule_name', 'user', 'connection_page', 'message_type', 'keywords_preview', 'is_active', 'priority', 'times_triggered', 'created_at']
    list_filter = ['message_type', 'is_active', 'connection__platform', 'created_at', 'priority']
    search_fields = ['rule_name', 'user__username', 'connection__facebook_page_name', 'reply_template']
    readonly_fields = ['times_triggered', 'created_at']
    
    fieldsets = (
        ('Rule Information', {
            'fields': ('user', 'connection', 'rule_name', 'message_type', 'is_active', 'priority')
        }),
        ('Automation Logic', {
            'fields': ('keywords', 'reply_template')
        }),
        ('Statistics', {
            'fields': ('times_triggered',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def connection_page(self, obj):
        return obj.connection.facebook_page_name or 'Unknown Page'
    connection_page.short_description = 'Facebook Page'
    
    def keywords_preview(self, obj):
        if obj.keywords:
            keywords_str = ', '.join(obj.keywords[:3])
            if len(obj.keywords) > 3:
                keywords_str += f' (+{len(obj.keywords) - 3} more)'
            return keywords_str
        return 'No keywords'
    keywords_preview.short_description = 'Keywords'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'connection')


@admin.register(AutomationSettings)
class AutomationSettingsAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user', 'connection_page', 'is_enabled', 'enable_dm_automation', 'reply_delay_seconds', 'dm_reply_delay_seconds', 'has_default_reply', 'created_at']
    list_filter = ['is_enabled', 'enable_dm_automation', 'connection__platform', 'created_at']
    search_fields = ['user__username', 'connection__facebook_page_name', 'default_reply', 'dm_default_reply']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Settings', {
            'fields': ('user', 'connection')
        }),
        ('Comment Automation', {
            'fields': ('is_enabled', 'default_reply', 'reply_delay_seconds')
        }),
        ('DM Automation', {
            'fields': ('enable_dm_automation', 'dm_default_reply', 'dm_reply_delay_seconds')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def connection_page(self, obj):
        return obj.connection.facebook_page_name or 'Unknown Page'
    connection_page.short_description = 'Facebook Page'
    
    def has_default_reply(self, obj):
        return bool(obj.default_reply and obj.default_reply.strip())
    has_default_reply.boolean = True
    has_default_reply.short_description = 'Has Default Reply'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'connection')


@admin.register(CommentReply)
class CommentReplyAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['comment', 'from_user', 'reply_preview', 'rule_used', 'status', 'sent_at']
    list_filter = ['status', 'sent_at', 'rule__rule_name']
    search_fields = ['comment__comment_id', 'comment__from_user_name', 'reply_text', 'facebook_reply_id']
    readonly_fields = ['comment', 'rule', 'reply_text', 'facebook_reply_id', 'sent_at']
    
    fieldsets = (
        ('Reply Information', {
            'fields': ('comment', 'rule', 'reply_text', 'status')
        }),
        ('Facebook Data', {
            'fields': ('facebook_reply_id',)
        }),
        ('Timestamps', {
            'fields': ('sent_at',),
            'classes': ('collapse',)
        }),
    )
    
    def from_user(self, obj):
        return obj.comment.from_user_name
    from_user.short_description = 'Original Commenter'
    
    def reply_preview(self, obj):
        return obj.reply_text[:50] + '...' if len(obj.reply_text) > 50 else obj.reply_text
    reply_preview.short_description = 'Reply Preview'
    
    def rule_used(self, obj):
        return obj.rule.rule_name if obj.rule else 'Default Reply'
    rule_used.short_description = 'Rule Used'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('comment', 'rule')


# Direct Message Automation Admin
@admin.register(DirectMessage)
class DirectMessageAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['message_id', 'platform', 'sender_name', 'message_preview', 'connection_page', 'status', 'is_echo', 'created_time']
    list_filter = ['platform', 'status', 'is_echo', 'connection__platform', 'created_time', 'received_at']
    search_fields = ['message_id', 'sender_name', 'message_text', 'conversation_id', 'connection__facebook_page_name']
    readonly_fields = ['message_id', 'conversation_id', 'platform', 'sender_id', 'sender_name', 'message_text', 'message_attachments', 'is_echo', 'created_time', 'received_at']
    
    fieldsets = (
        ('Message Data', {
            'fields': ('message_id', 'conversation_id', 'platform', 'sender_id', 'sender_name')
        }),
        ('Message Content', {
            'fields': ('message_text', 'message_attachments', 'status', 'is_echo')
        }),
        ('Connection', {
            'fields': ('connection',)
        }),
        ('Timestamps', {
            'fields': ('created_time', 'received_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        if obj.message_text:
            return obj.message_text[:50] + '...' if len(obj.message_text) > 50 else obj.message_text
        return '[No text content]'
    message_preview.short_description = 'Message Preview'
    
    def connection_page(self, obj):
        return obj.connection.facebook_page_name or 'Unknown Page'
    connection_page.short_description = 'Page/Account'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('connection')


@admin.register(DirectMessageReply)
class DirectMessageReplyAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['direct_message', 'sender_name', 'platform', 'reply_preview', 'rule_used', 'status', 'sent_at']
    list_filter = ['status', 'direct_message__platform', 'sent_at', 'rule__rule_name']
    search_fields = ['direct_message__message_id', 'direct_message__sender_name', 'reply_text', 'platform_reply_id']
    readonly_fields = ['direct_message', 'rule', 'reply_text', 'platform_reply_id', 'error_message', 'sent_at']
    
    fieldsets = (
        ('Reply Information', {
            'fields': ('direct_message', 'rule', 'reply_text', 'status')
        }),
        ('Platform Data', {
            'fields': ('platform_reply_id', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('sent_at',),
            'classes': ('collapse',)
        }),
    )
    
    def sender_name(self, obj):
        return obj.direct_message.sender_name
    sender_name.short_description = 'Original Sender'
    
    def platform(self, obj):
        return obj.direct_message.get_platform_display()
    platform.short_description = 'Platform'
    
    def reply_preview(self, obj):
        return obj.reply_text[:50] + '...' if len(obj.reply_text) > 50 else obj.reply_text
    reply_preview.short_description = 'Reply Preview'
    
    def rule_used(self, obj):
        return obj.rule.rule_name if obj.rule else 'Default Reply'
    rule_used.short_description = 'Rule Used'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('direct_message', 'rule')


# AI Configuration Admin
@admin.register(AIConfiguration)
class AIConfigurationAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    """
    Admin interface for global AI configurations.
    Only one configuration per capability can exist.
    """
    list_display = ['capability', 'text_generation_model', 'vision_model', 'is_active', 'total_usage_count', 'last_used_at']
    list_filter = ['capability', 'is_active', 'last_used_at']
    search_fields = ['capability', 'system_prompt', 'text_generation_model', 'vision_model']
    readonly_fields = ['total_usage_count', 'total_tokens_used', 'last_used_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('AI Capability', {
            'fields': ('capability', 'is_active')
        }),
        ('System Prompt', {
            'fields': ('system_prompt',),
            'description': 'Custom system prompt for this AI capability'
        }),
        ('Model Settings', {
            'fields': ('text_generation_model', 'vision_model'),
            'description': 'AI models to use for different tasks'
        }),
        ('Usage Statistics', {
            'fields': ('total_usage_count', 'total_tokens_used', 'last_used_at'),
            'classes': ('collapse',),
            'description': 'Global usage tracking for this capability'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Only allow adding if not all capabilities have configs"""
        existing_capabilities = set(AIConfiguration.objects.values_list('capability', flat=True))
        all_capabilities = set([choice[0] for choice in AIConfiguration.CAPABILITY_CHOICES])
        return len(existing_capabilities) < len(all_capabilities)
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of AI configurations"""
        return False
    
    def get_form(self, request, obj=None, **kwargs):
        """Customize form based on capability"""
        form = super().get_form(request, obj, **kwargs)
        
        if obj:  # Editing existing config
            # Hide capability field for existing configs (read-only)
            if 'capability' in form.base_fields:
                form.base_fields['capability'].widget.attrs['readonly'] = True
        else:  # Adding new config
            # Only show capabilities that don't have configs yet
            existing_capabilities = set(AIConfiguration.objects.values_list('capability', flat=True))
            available_choices = [
                (key, value) for key, value in AIConfiguration.CAPABILITY_CHOICES 
                if key not in existing_capabilities
            ]
            if 'capability' in form.base_fields:
                form.base_fields['capability'].choices = available_choices
        
        return form

    def save_model(self, request, obj, form, change):
        """Override to prevent duplicate capability configs"""
        if not change:  # New object
            existing = AIConfiguration.objects.filter(capability=obj.capability).first()
            if existing:
                from django.contrib import messages
                messages.error(
                    request,
                    f"AI Configuration for '{obj.get_capability_display()}' already exists. "
                    f"Only one configuration per capability is allowed. "
                    f"Please edit the existing configuration instead."
                )
                return
        super().save_model(request, obj, form, change)


@admin.register(MiloPrompt)
class MiloPromptAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    """
    Admin interface for Milo AI prompts.
    Only one prompt can exist at a time.
    """
    list_display = ['id', 'modified_at', 'created_at']
    readonly_fields = ['created_at', 'modified_at']

    fieldsets = (
        ('Milo AI System Prompt', {
            'fields': ('system_prompt',),
            'description': 'System prompt for Milo AI assistant'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Only allow adding if no prompt exists"""
        return MiloPrompt.objects.count() == 0

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of the Milo prompt"""
        return False


@admin.register(FreebieFollowupEmail)
class FreebieFollowupEmailAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    """
    Admin interface for freebie follow-up email templates.
    """
    list_display = ['step_number', 'delay_days', 'send_time', 'subject', 'is_active', 'modified_at']
    list_filter = ['is_active', 'delay_days']
    search_fields = ['subject', 'body']
    ordering = ['step_number']

    fieldsets = (
        ('Email Details', {
            'fields': ('step_number', 'subject', 'body'),
            'description': 'Email content with template variables: {{ first_name }}, {{ sender_name }}, {{ affiliate_link }}, {{ personal_email }}'
        }),
        ('Scheduling', {
            'fields': ('delay_days', 'send_time', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'modified_at']


@admin.register(ScheduledFollowupEmail)
class ScheduledFollowupEmailAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    """
    Admin interface for scheduled follow-up emails.
    """
    list_display = ['order', 'email_template', 'scheduled_for', 'sent', 'sent_at', 'created_at']
    list_filter = ['sent', 'scheduled_for', 'sent_at']
    search_fields = ['order__order_id', 'order__customer_email', 'order__customer_name']
    readonly_fields = ['created_at', 'sent_at', 'error_message']
    ordering = ['-scheduled_for']

    fieldsets = (
        ('Email Information', {
            'fields': ('order', 'email_template')
        }),
        ('Schedule', {
            'fields': ('scheduled_for', 'sent', 'sent_at')
        }),
        ('Error Details', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Prevent manual creation - emails are auto-scheduled"""
        return False


@admin.register(OptinFollowupEmail)
class OptinFollowupEmailAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    """
    Admin interface for opt-in follow-up email templates.
    """
    list_display = ['step_number', 'delay_days', 'send_time', 'subject', 'is_active', 'modified_at']
    list_filter = ['is_active', 'delay_days']
    search_fields = ['subject', 'body']
    ordering = ['step_number']

    fieldsets = (
        ('Email Configuration', {
            'fields': ('step_number', 'delay_days', 'send_time', 'is_active')
        }),
        ('Email Content', {
            'fields': ('subject', 'body'),
            'description': 'Use template variables: {{ first_name }}, {{ sender_name }}, {{ affiliate_link }}, {{ personal_email }}'
        }),
        ('Metadata', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'modified_at']


@admin.register(ScheduledOptinEmail)
class ScheduledOptinEmailAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    """
    Admin interface for scheduled opt-in follow-up emails.
    """
    list_display = ['order', 'email_template', 'scheduled_for', 'sent', 'sent_at', 'created_at']
    list_filter = ['sent', 'scheduled_for', 'sent_at']
    search_fields = ['order__order_id', 'order__customer_email', 'order__customer_name']
    readonly_fields = ['created_at', 'sent_at', 'error_message']
    ordering = ['-scheduled_for']

    fieldsets = (
        ('Email Information', {
            'fields': ('order', 'email_template')
        }),
        ('Schedule', {
            'fields': ('scheduled_for', 'sent', 'sent_at')
        }),
        ('Error Details', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Prevent manual creation - emails are auto-scheduled"""
        return False


# Backward compatibility aliases are already registered via the @admin.register decorators above
# since CommentAutomationRule = AutomationRule and CommentAutomationSettings = AutomationSettings


# ============================================================================
# STRIPE CONNECT ADMIN CLASSES
# ============================================================================

@admin.register(StripeConnectAccount)
class StripeConnectAccountAdmin(ModelAdmin, ImportExportModelAdmin):
    """Admin interface for Stripe Connect accounts"""
    import_form_class = ImportForm
    export_form_class = ExportForm
    
    list_display = [
        'user', 'stripe_account_id_short', 'get_status', 'charges_enabled', 
        'payouts_enabled', 'details_submitted', 'country', 'default_currency',
        'platform_fee_percentage', 'onboarding_completed_at', 'created_at'
    ]
    list_filter = [
        'charges_enabled', 'payouts_enabled', 'details_submitted', 
        'country', 'default_currency', 'created_at', 'onboarding_completed_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'stripe_account_id', 'email'
    ]
    readonly_fields = [
        'stripe_account_id', 'charges_enabled', 'payouts_enabled', 
        'details_submitted', 'country', 'default_currency', 'requirements_due',
        'requirements_errors', 'onboarding_completed_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        (_('Account Information'), {
            'fields': ('user', 'stripe_account_id', 'email')
        }),
        (_('Account Status'), {
            'fields': (
                'charges_enabled', 'payouts_enabled', 'details_submitted',
                'country', 'default_currency', 'onboarding_completed_at'
            )
        }),
        (_('Platform Settings'), {
            'fields': ('platform_fee_percentage',)
        }),
        (_('Requirements'), {
            'fields': ('requirements_due', 'requirements_errors'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def stripe_account_id_short(self, obj):
        """Display shortened account ID"""
        if obj.stripe_account_id:
            return f"{obj.stripe_account_id[:15]}..."
        return "-"
    stripe_account_id_short.short_description = "Stripe Account"
    
    def get_status(self, obj):
        """Display account status with color coding"""
        status = obj.get_status()
        if status == "Active":
            return format_html('<span style="color: green;">✓ {}</span>', status)
        elif status == "Pending Verification":
            return format_html('<span style="color: orange;">⏳ {}</span>', status)
        else:
            return format_html('<span style="color: red;">❌ {}</span>', status)
    get_status.short_description = "Status"
    
    def has_add_permission(self, request):
        """Prevent manual creation of Connect accounts"""
        return False


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(ModelAdmin, ImportExportModelAdmin):
    """Admin interface for payment transactions"""
    import_form_class = ImportForm
    export_form_class = ExportForm
    
    list_display = [
        'order_id_short', 'seller_username', 'product_title_short',
        'get_display_amount', 'get_platform_earnings', 'status',
        'transfer_status', 'customer_email', 'paid_at', 'created_at'
    ]
    list_filter = [
        'status', 'transfer_status', 'currency', 'created_at', 'paid_at'
    ]
    search_fields = [
        'order__order_id', 'seller_account__user__username', 
        'order__custom_link__title', 'customer_email',
        'payment_intent_id', 'charge_id', 'transfer_id'
    ]
    readonly_fields = [
        'order', 'seller_account', 'stripe_checkout_session_id',
        'payment_intent_id', 'charge_id', 'transfer_id', 'total_amount',
        'platform_fee', 'seller_amount', 'stripe_processing_fee',
        'currency', 'status', 'transfer_status', 'customer_email',
        'refunded_amount', 'platform_fee_refunded', 'metadata',
        'created_at', 'updated_at', 'paid_at', 'transferred_at'
    ]
    
    fieldsets = (
        (_('Transaction Details'), {
            'fields': (
                'order', 'seller_account', 'customer_email', 'status'
            )
        }),
        (_('Stripe Information'), {
            'fields': (
                'stripe_checkout_session_id', 'payment_intent_id', 
                'charge_id', 'transfer_id'
            )
        }),
        (_('Amounts'), {
            'fields': (
                'total_amount', 'platform_fee', 'seller_amount',
                'stripe_processing_fee', 'currency'
            )
        }),
        (_('Transfer Status'), {
            'fields': ('transfer_status', 'transferred_at')
        }),
        (_('Refunds'), {
            'fields': ('refunded_amount', 'platform_fee_refunded'),
            'classes': ('collapse',)
        }),
        (_('Additional Data'), {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at', 'paid_at'),
            'classes': ('collapse',)
        }),
    )
    
    def order_id_short(self, obj):
        """Display shortened order ID"""
        if obj.order and obj.order.order_id:
            return f"{obj.order.order_id[:8]}..."
        return "-"
    order_id_short.short_description = "Order"
    
    def seller_username(self, obj):
        """Display seller username"""
        return obj.seller_account.user.username if obj.seller_account else "-"
    seller_username.short_description = "Seller"
    
    def product_title_short(self, obj):
        """Display shortened product title"""
        if obj.order and obj.order.custom_link and obj.order.custom_link.title:
            title = obj.order.custom_link.title
            return title[:30] + "..." if len(title) > 30 else title
        return "-"
    product_title_short.short_description = "Product"
    
    def get_display_amount(self, obj):
        """Display formatted total amount"""
        return obj.get_display_amount()
    get_display_amount.short_description = "Amount"
    
    def get_platform_earnings(self, obj):
        """Display formatted platform earnings"""
        return obj.get_platform_earnings()
    get_platform_earnings.short_description = "Platform Fee"
    
    def has_add_permission(self, request):
        """Prevent manual creation of transactions"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make transactions read-only"""
        return False


@admin.register(ConnectWebhookEvent)
class ConnectWebhookEventAdmin(ModelAdmin, ImportExportModelAdmin):
    """Admin interface for Connect webhook events"""
    import_form_class = ImportForm
    export_form_class = ExportForm
    
    list_display = [
        'stripe_event_id_short', 'event_type', 'account_username',
        'transaction_order_id_short', 'processed', 'created_at', 'processed_at'
    ]
    list_filter = [
        'event_type', 'processed', 'created_at', 'processed_at'
    ]
    search_fields = [
        'stripe_event_id', 'event_type', 'account_id',
        'connect_account__user__username'
    ]
    readonly_fields = [
        'stripe_event_id', 'event_type', 'account_id', 'connect_account',
        'payment_transaction', 'data', 'processed', 'error_message',
        'created_at', 'processed_at'
    ]
    
    fieldsets = (
        (_('Event Information'), {
            'fields': ('stripe_event_id', 'event_type', 'account_id', 'processed')
        }),
        (_('Related Objects'), {
            'fields': ('connect_account', 'payment_transaction')
        }),
        (_('Processing'), {
            'fields': ('error_message', 'processed_at')
        }),
        (_('Event Data'), {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def stripe_event_id_short(self, obj):
        """Display shortened event ID"""
        if obj.stripe_event_id:
            return f"{obj.stripe_event_id[:20]}..."
        return "-"
    stripe_event_id_short.short_description = "Event ID"
    
    def account_username(self, obj):
        """Display related account username"""
        if obj.connect_account:
            return obj.connect_account.user.username
        return "-"
    account_username.short_description = "Account"
    
    def transaction_order_id_short(self, obj):
        """Display shortened transaction order ID"""
        if obj.payment_transaction and obj.payment_transaction.order:
            order_id = obj.payment_transaction.order.order_id
            return f"{order_id[:8]}..." if order_id else "-"
        return "-"
    transaction_order_id_short.short_description = "Order"
    
    def has_add_permission(self, request):
        """Prevent manual creation of webhook events"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make webhook events read-only except for processed status"""
        return request.user.is_superuser


# ============================================================================
# Email Integration Admin
# ============================================================================

@admin.register(EmailAccount)
class EmailAccountAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['user', 'email_address', 'is_active', 'last_synced', 'created_at']
    list_filter = ['is_active', 'created_at', 'last_synced']
    search_fields = ['user__username', 'user__email', 'email_address']
    readonly_fields = ['created_at', 'modified_at', 'last_synced', 'token_expiry']
    fieldsets = (
        ('Account Information', {
            'fields': ('user', 'email_address', 'is_active')
        }),
        ('OAuth Tokens', {
            'fields': ('token_expiry',),
            'description': 'OAuth tokens are encrypted and not displayed for security'
        }),
        ('Sync Information', {
            'fields': ('last_synced',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(EmailMessage)
class EmailMessageAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['subject_short', 'from_email', 'account_email', 'received_at', 'is_read', 'is_starred', 'has_attachments']
    list_filter = ['is_read', 'is_starred', 'has_attachments', 'received_at', 'account']
    search_fields = ['subject', 'from_email', 'from_name', 'body_text', 'account__email_address']
    readonly_fields = ['message_id', 'thread_id', 'received_at', 'created_at']
    date_hierarchy = 'received_at'
    fieldsets = (
        ('Message Information', {
            'fields': ('account', 'message_id', 'thread_id')
        }),
        ('From/To', {
            'fields': ('from_email', 'from_name', 'to_emails', 'cc_emails')
        }),
        ('Content', {
            'fields': ('subject', 'snippet', 'body_text', 'body_html')
        }),
        ('Metadata', {
            'fields': ('received_at', 'is_read', 'is_starred', 'has_attachments', 'labels')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def subject_short(self, obj):
        """Display shortened subject"""
        return obj.subject[:50] + '...' if len(obj.subject) > 50 else obj.subject
    subject_short.short_description = 'Subject'

    def account_email(self, obj):
        """Display account email address"""
        return obj.account.email_address
    account_email.short_description = 'Account'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('account')


@admin.register(EmailAttachment)
class EmailAttachmentAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['filename', 'message_subject', 'content_type', 'size_display', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['filename', 'message__subject']
    readonly_fields = ['attachment_id', 'size', 'created_at']
    fieldsets = (
        ('Attachment Information', {
            'fields': ('message', 'attachment_id', 'filename', 'content_type')
        }),
        ('File', {
            'fields': ('file', 'size')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def message_subject(self, obj):
        """Display message subject"""
        subject = obj.message.subject
        return subject[:30] + '...' if len(subject) > 30 else subject
    message_subject.short_description = 'Message'

    def size_display(self, obj):
        """Display file size in human-readable format"""
        size = obj.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    size_display.short_description = 'Size'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('message', 'message__account')


@admin.register(EmailDraft)
class EmailDraftAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ['subject_short', 'account_email', 'to_emails_display', 'created_at', 'modified_at']
    list_filter = ['created_at', 'modified_at', 'account']
    search_fields = ['subject', 'body_html', 'account__email_address']
    readonly_fields = ['created_at', 'modified_at']
    date_hierarchy = 'modified_at'
    fieldsets = (
        ('Draft Information', {
            'fields': ('account',)
        }),
        ('Recipients', {
            'fields': ('to_emails', 'cc_emails', 'bcc_emails')
        }),
        ('Content', {
            'fields': ('subject', 'body_html')
        }),
        ('Attachments', {
            'fields': ('attachments',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    def subject_short(self, obj):
        """Display shortened subject"""
        if not obj.subject:
            return '(No subject)'
        return obj.subject[:50] + '...' if len(obj.subject) > 50 else obj.subject
    subject_short.short_description = 'Subject'

    def account_email(self, obj):
        """Display account email address"""
        return obj.account.email_address
    account_email.short_description = 'Account'

    def to_emails_display(self, obj):
        """Display to emails"""
        if not obj.to_emails:
            return '-'
        emails = obj.to_emails if isinstance(obj.to_emails, list) else []
        if len(emails) > 2:
            return f"{', '.join(emails[:2])}... (+{len(emails) - 2})"
        return ', '.join(emails)
    to_emails_display.short_description = 'To'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('account')



# ============================================================================
# CANVA INTEGRATION ADMIN
# ============================================================================

@admin.register(CanvaConnection)
class CanvaConnectionAdmin(ModelAdmin, ImportExportModelAdmin):
    """Admin interface for Canva connections"""
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ["user_username", "canva_display_name", "is_active", "last_used_at", "created_at"]
    list_filter = ["is_active", "created_at", "last_used_at"]
    search_fields = ["user__username", "user__email", "canva_user_id", "canva_display_name"]
    readonly_fields = ["created_at", "modified_at", "last_used_at", "needs_refresh"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("User Information", {
            "fields": ("user",)
        }),
        ("Canva Details", {
            "fields": ("canva_user_id", "canva_team_id", "canva_display_name")
        }),
        ("OAuth Tokens", {
            "fields": ("access_token", "refresh_token", "token_type", "expires_at", "scope"),
            "classes": ("collapse",)
        }),
        ("Connection Status", {
            "fields": ("is_active", "last_used_at", "last_error", "needs_refresh")
        }),
        ("Timestamps", {
            "fields": ("created_at", "modified_at"),
            "classes": ("collapse",)
        }),
    )

    def user_username(self, obj):
        """Display username"""
        return obj.user.username
    user_username.short_description = "Username"
    user_username.admin_order_field = "user__username"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user")


@admin.register(CanvaDesign)
class CanvaDesignAdmin(ModelAdmin, ImportExportModelAdmin):
    """Admin interface for Canva designs"""
    import_form_class = ImportForm
    export_form_class = ExportForm
    list_display = ["design_id_short", "user_username", "design_type", "status", "opened_count", "exported_at", "created_at"]
    list_filter = ["status", "design_type", "created_at", "exported_at"]
    search_fields = ["design_id", "title", "user__username", "user__email"]
    readonly_fields = ["created_at", "modified_at", "exported_at", "opened_count", "last_opened_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("User & Connection", {
            "fields": ("user", "connection")
        }),
        ("Design Details", {
            "fields": ("design_id", "design_type", "title", "status")
        }),
        ("URLs", {
            "fields": ("edit_url", "thumbnail_url")
        }),
        ("Export Information", {
            "fields": ("export_url", "export_format", "exported_at")
        }),
        ("Usage Tracking", {
            "fields": ("opened_count", "last_opened_at")
        }),
        ("Metadata", {
            "fields": ("metadata",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "modified_at"),
            "classes": ("collapse",)
        }),
    )

    def design_id_short(self, obj):
        """Display shortened design ID"""
        if len(obj.design_id) > 20:
            return f"{obj.design_id[:20]}..."
        return obj.design_id
    design_id_short.short_description = "Design ID"
    design_id_short.admin_order_field = "design_id"

    def user_username(self, obj):
        """Display username"""
        return obj.user.username
    user_username.short_description = "Username"
    user_username.admin_order_field = "user__username"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "connection")

