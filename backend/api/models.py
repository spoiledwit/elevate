from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from cloudinary.models import CloudinaryField
from tinymce import models as tinymce_models


class User(AbstractUser):
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.email if self.email else self.username


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    slug = models.SlugField(_("slug"), max_length=255, unique=True, blank=True)
    display_name = models.CharField(_("display name"), max_length=255)
    bio = models.TextField(_("bio"), blank=True)
    profile_image = CloudinaryField('profile_image', blank=True, null=True)
    embedded_video = models.URLField(_("embedded video"), blank=True)
    affiliate_link = models.TextField(_("affiliate link"), blank=True, help_text="Affiliate/purchase link for funnel injection")
    contact_email = models.EmailField(_("contact email"), blank=True, help_text="Contact email displayed on storefront")
    is_active = models.BooleanField(_("is active"), default=True)
    view_count = models.PositiveIntegerField(_("view count"), default=0)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = _("user profile")
        verbose_name_plural = _("user profiles")

    def __str__(self):
        return f"{self.user.username} - {self.display_name}"

    def save(self, *args, **kwargs):
        # Always update slug to match current username
        self.slug = slugify(self.user.username)
        super().save(*args, **kwargs)


# Signal to automatically create UserProfile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(
            user=instance,
            display_name=instance.username
        )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class UserSocialLinks(models.Model):
    """
    Model to store user's social media profile links.
    One-to-one relationship with User for direct access.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='social_links')
    
    # Social Media Links (all optional)
    instagram = models.URLField(_("Instagram"), blank=True, help_text="Instagram profile URL")
    facebook = models.URLField(_("Facebook"), blank=True, help_text="Facebook profile URL")
    pinterest = models.URLField(_("Pinterest"), blank=True, help_text="Pinterest profile URL")
    linkedin = models.URLField(_("LinkedIn"), blank=True, help_text="LinkedIn profile URL")
    tiktok = models.URLField(_("TikTok"), blank=True, help_text="TikTok profile URL")
    youtube = models.URLField(_("YouTube"), blank=True, help_text="YouTube channel URL")
    twitter = models.URLField(_("Twitter/X"), blank=True, help_text="Twitter/X profile URL")
    
    # Additional fields
    website = models.URLField(_("Personal Website"), blank=True, help_text="Personal website URL")
    
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "user_social_links"
        verbose_name = _("user social links")
        verbose_name_plural = _("user social links")

    def __str__(self):
        return f"{self.user.username} - Social Links"
    
    def get_active_links(self):
        """Returns a dictionary of non-empty social links"""
        links = {}
        social_fields = ['instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter', 'website']
        for field in social_fields:
            value = getattr(self, field, '')
            if value:
                links[field] = value
        return links


# Signal to automatically create UserSocialLinks when User is created
@receiver(post_save, sender=User)
def create_user_social_links(sender, instance, created, **kwargs):
    if created:
        UserSocialLinks.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_social_links(sender, instance, **kwargs):
    if hasattr(instance, 'social_links'):
        instance.social_links.save()


class UserPermissions(models.Model):
    """
    Model to store user permissions for the 7 main dashboard sections.
    One-to-one relationship with User for granular access control.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='permissions')
    
    # Dashboard Permissions (based on the 7 main sections)
    can_access_overview = models.BooleanField(_("Can Access Overview"), default=True, help_text="Dashboard section access")
    can_access_linkinbio = models.BooleanField(_("Can Access Link-in-Bio"), default=True, help_text="Storefront, Custom Links, CTA Banners")
    can_access_content = models.BooleanField(_("Can Access Content & Social"), default=True, help_text="Calendar, Post Creator, Content Library, Social Accounts")
    can_access_automation = models.BooleanField(_("Can Access Automation"), default=True, help_text="Comments, Automation Rules, Settings, Analytics")
    can_access_ai_tools = models.BooleanField(_("Can Access AI & Tools"), default=True, help_text="AI Assistant and related tools")
    can_access_business = models.BooleanField(_("Can Access Business"), default=True, help_text="Subscription and billing management")
    can_access_account = models.BooleanField(_("Can Access Account"), default=True, help_text="Account settings and profile")
    
    # Additional granular permissions
    can_edit_profile = models.BooleanField(_("Can Edit Profile"), default=True, help_text="Edit user profile and settings")
    can_manage_integrations = models.BooleanField(_("Can Manage Integrations"), default=True, help_text="Connect/disconnect social media accounts")
    can_view_analytics = models.BooleanField(_("Can View Analytics"), default=True, help_text="View performance analytics and stats")
    
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "user_permissions"
        verbose_name = _("user permissions")
        verbose_name_plural = _("user permissions")

    def __str__(self):
        return f"{self.user.username} - Permissions"
    
    def get_accessible_sections(self):
        """Returns a list of accessible dashboard sections"""
        sections = []
        if self.can_access_overview:
            sections.append('overview')
        if self.can_access_linkinbio:
            sections.append('linkinbio')
        if self.can_access_content:
            sections.append('content')
        if self.can_access_automation:
            sections.append('automation')
        if self.can_access_ai_tools:
            sections.append('ai-tools')
        if self.can_access_business:
            sections.append('business')
        if self.can_access_account:
            sections.append('account')
        return sections


# Signal to automatically create UserPermissions when User is created
@receiver(post_save, sender=User)
def create_user_permissions(sender, instance, created, **kwargs):
    if created:
        UserPermissions.objects.create(
            user=instance,
            can_access_overview=True,
            can_access_linkinbio=True,
            can_access_content=False,
            can_access_automation=False,
            can_access_ai_tools=False,
            can_access_business=False,
            can_access_account=False,
            can_edit_profile=False,
            can_manage_integrations=False,
            can_view_analytics=False
        )


@receiver(post_save, sender=User)
def save_user_permissions(sender, instance, **kwargs):
    if hasattr(instance, 'permissions'):
        instance.permissions.save()


class SocialIcon(models.Model):
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
        ('snapchat', 'Snapchat'),
        ('pinterest', 'Pinterest'),
        ('twitch', 'Twitch'),
        ('discord', 'Discord'),
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('reddit', 'Reddit'),
        ('tumblr', 'Tumblr'),
        ('medium', 'Medium'),
        ('github', 'GitHub'),
        ('dribbble', 'Dribbble'),
        ('behance', 'Behance'),
        ('spotify', 'Spotify'),
        ('soundcloud', 'SoundCloud'),
        ('email', 'Email'),
        ('website', 'Website'),
    ]
    
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='social_icons')
    platform = models.CharField(_("platform"), max_length=50, choices=PLATFORM_CHOICES)
    url = models.TextField(_("url"))
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "social_icons"
        verbose_name = _("social icon")
        verbose_name_plural = _("social icons")
        unique_together = ['user_profile', 'platform']

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.platform}"


class IframeMenuItem(models.Model):
    """
    System-wide iframe menu items for opt-in checkout flow.
    These menu items are displayed to all users after opt-in completion.
    """
    title = models.CharField(_("title"), max_length=255, help_text="Menu item title")
    slug = models.SlugField(_("slug"), max_length=255, unique=True, help_text="URL-friendly identifier")
    link = models.URLField(_("link"), help_text="URL to display in iframe")
    icon = models.CharField(_("icon"), max_length=100, default="ExternalLink", help_text="Lucide React icon name")
    order = models.IntegerField(_("order"), default=0, help_text="Display order (lower numbers appear first)")
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "iframe_menu_items"
        verbose_name = _("iframe menu item")
        verbose_name_plural = _("iframe menu items")
        ordering = ['order', 'created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class CustomLinkTemplate(models.Model):
    """
    Master templates for custom links that can be distributed to all users.
    Managed by admin only through Django admin panel.
    """
    # Template info
    name = models.CharField(_("template name"), max_length=255, help_text="Internal name for this template")

    # Core fields (same as CustomLink)
    order = models.IntegerField(_("order"), default=0)
    is_active = models.BooleanField(_("is active"), default=True)
    type = models.CharField(_("type"), max_length=50, default='generic', help_text="Product type (e.g., 'generic', 'digital_product', 'service', 'event', 'subscription')")

    # Thumbnail info fields
    thumbnail = CloudinaryField('template_thumbnail', blank=True, null=True)
    title = models.CharField(_("title"), max_length=100, blank=True)
    subtitle = models.CharField(_("subtitle"), max_length=150, blank=True)

    # Style and button fields
    button_text = models.CharField(_("button text"), max_length=100, blank=True)

    STYLE_CHOICES = [
        ('callout', _('Callout')),
        ('button', _('Button')),
        ('checkout', _('Checkout')),
        ('collect_info', _('Collect Info')),
    ]
    style = models.CharField(_("style"), max_length=20, choices=STYLE_CHOICES, default='callout')

    # Checkout page info fields
    checkout_image = CloudinaryField('template_checkout_image', blank=True, null=True)
    checkout_title = models.CharField(_("checkout title"), max_length=100, blank=True)
    checkout_description = tinymce_models.HTMLField(_("checkout description"), blank=True)
    checkout_bottom_title = models.CharField(_("checkout bottom title"), max_length=100, blank=True)
    checkout_cta_button_text = models.CharField(_("checkout CTA button text"), max_length=50, blank=True)
    checkout_price = models.DecimalField(_("checkout price"), max_digits=10, decimal_places=2, blank=True, null=True)
    checkout_discounted_price = models.DecimalField(_("checkout discounted price"), max_digits=10, decimal_places=2, blank=True, null=True)

    # Additional product-specific information stored as JSON
    additional_info = models.JSONField(_("additional info"), blank=True, null=True, help_text="Product-specific information based on product type")

    # Timestamps
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "custom_link_templates"
        verbose_name = _("custom link template")
        verbose_name_plural = _("custom link templates")
        ordering = ['name']

    def __str__(self):
        return self.name

    def sync_to_user_links(self):
        """
        Sync this template's values to all linked CustomLinks.
        Returns the count of updated links.
        """
        # Update scalar fields via bulk update for efficiency
        updated_count = self.user_links.update(
            order=self.order,
            type=self.type,
            title=self.title,
            subtitle=self.subtitle,
            button_text=self.button_text,
            style=self.style,
            checkout_title=self.checkout_title,
            checkout_description=self.checkout_description,
            checkout_bottom_title=self.checkout_bottom_title,
            checkout_cta_button_text=self.checkout_cta_button_text,
            checkout_price=self.checkout_price,
            checkout_discounted_price=self.checkout_discounted_price,
            additional_info=self.additional_info,
            is_active=self.is_active,
        )

        # Handle Cloudinary fields separately (can't use bulk update)
        for link in self.user_links.all():
            link.thumbnail = self.thumbnail
            link.checkout_image = self.checkout_image
            link.save(update_fields=['thumbnail', 'checkout_image'])

        return updated_count


class CustomLink(models.Model):
    # Core fields
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='custom_links')
    template = models.ForeignKey(
        CustomLinkTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_links',
        help_text="Master template this link is based on"
    )
    order = models.IntegerField(_("order"), default=0)
    is_active = models.BooleanField(_("is active"), default=True)
    click_count = models.PositiveIntegerField(_("click count"), default=0)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)
    type = models.CharField(_("type"), max_length=50, default='generic', help_text="Product type (e.g., 'generic', 'digital_product', 'service', 'event', 'subscription')")
    
    # Thumbnail info fields
    thumbnail = CloudinaryField('link_thumbnail', blank=True, null=True)
    title = models.CharField(_("title"), max_length=100, blank=True)
    subtitle = models.CharField(_("subtitle"), max_length=150, blank=True)
    
    # Style and button fields
    button_text = models.CharField(_("button text"), max_length=100, blank=True)
    
    STYLE_CHOICES = [
        ('callout', _('Callout')),
        ('button', _('Button')),
        ('checkout', _('Checkout')),
        ('collect_info', _('Collect Info')),
    ]
    style = models.CharField(_("style"), max_length=20, choices=STYLE_CHOICES, default='callout')
    
    # Checkout page info fields (only used when style='checkout')
    checkout_image = CloudinaryField('checkout_image', blank=True, null=True)
    checkout_title = models.CharField(_("checkout title"), max_length=100, blank=True)
    checkout_description = tinymce_models.HTMLField(_("checkout description"), blank=True)
    checkout_bottom_title = models.CharField(_("checkout bottom title"), max_length=100, blank=True)
    checkout_cta_button_text = models.CharField(_("checkout CTA button text"), max_length=50, blank=True)
    checkout_price = models.DecimalField(_("checkout price"), max_digits=10, decimal_places=2, blank=True, null=True)
    checkout_discounted_price = models.DecimalField(_("checkout discounted price"), max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Additional product-specific information stored as JSON
    additional_info = models.JSONField(_("additional info"), blank=True, null=True, help_text="Product-specific information based on product type")

    class Meta:
        db_table = "custom_links"
        verbose_name = _("custom link")
        verbose_name_plural = _("custom links")
        ordering = ['order']

    def __str__(self):
        display_text = self.title or self.button_text or 'Untitled'
        return f"{self.user_profile.user.username} - {display_text}"


class CollectInfoField(models.Model):
    """
    Dynamic form fields for collect_info style custom links.
    Each CustomLink with style='collect_info' can have multiple form fields.
    """
    custom_link = models.ForeignKey(CustomLink, on_delete=models.CASCADE, related_name='collect_info_fields')
    
    FIELD_TYPE_CHOICES = [
        ('text', _('Text Input')),
        ('phone', _('Phone Number')),
        ('multiple_choice', _('Multiple Choice')),
        ('dropdown', _('Dropdown')),
        ('checkbox', _('Checkbox')),
    ]
    
    field_type = models.CharField(_("field type"), max_length=20, choices=FIELD_TYPE_CHOICES)
    label = models.CharField(_("field label"), max_length=100)
    placeholder = models.CharField(_("placeholder text"), max_length=150, blank=True)
    is_required = models.BooleanField(_("is required"), default=False)
    order = models.IntegerField(_("order"), default=0)
    
    # For multiple choice, dropdown, checkbox - store options as JSON
    options = models.JSONField(_("field options"), blank=True, null=True, help_text="JSON array of options for multiple choice/dropdown/checkbox fields")
    
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "collect_info_fields"
        verbose_name = _("collect info field")
        verbose_name_plural = _("collect info fields")
        ordering = ['custom_link', 'order']

    def __str__(self):
        return f"{self.custom_link} - {self.label} ({self.field_type})"


class CollectInfoResponse(models.Model):
    """
    Stores responses/submissions from collect_info style custom links.
    Each submission creates one response record with all field answers.
    """
    custom_link = models.ForeignKey(CustomLink, on_delete=models.CASCADE, related_name='collect_info_responses')
    
    # Store all form responses as JSON
    responses = models.JSONField(_("form responses"), help_text="JSON object with field_id: response mappings")
    
    # Optional visitor info
    ip_address = models.GenericIPAddressField(_("IP address"), blank=True, null=True)
    user_agent = models.TextField(_("user agent"), blank=True)
    
    submitted_at = models.DateTimeField(_("submitted at"), auto_now_add=True)

    class Meta:
        db_table = "collect_info_responses"
        verbose_name = _("collect info response")
        verbose_name_plural = _("collect info responses")
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.custom_link} - Response #{self.id}"


class CTABanner(models.Model):
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='cta_banner')
    text = models.CharField(_("text"), max_length=255)
    button_text = models.CharField(_("button text"), max_length=100)
    button_url = models.URLField(_("button url"))
    style = models.CharField(_("style"), max_length=50, default='gradient-purple')
    is_active = models.BooleanField(_("is active"), default=True)
    click_count = models.PositiveIntegerField(_("click count"), default=0)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "cta_banners"
        verbose_name = _("CTA banner")
        verbose_name_plural = _("CTA banners")

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.text}"


class SocialMediaPlatform(models.Model):
    """Supported social media platforms for OAuth integration"""
    PLATFORM_CHOICES = [
        ('tiktok', 'TikTok'),
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('pinterest', 'Pinterest'),
    ]
    
    name = models.CharField(_("platform name"), max_length=50, choices=PLATFORM_CHOICES, unique=True)
    display_name = models.CharField(_("display name"), max_length=100)
    client_id = models.CharField(_("client id"), max_length=255)
    client_secret = models.CharField(_("client secret"), max_length=255)
    auth_url = models.URLField(_("authorization url"))
    token_url = models.URLField(_("token url"))
    scope = models.TextField(_("scope"), help_text="Comma-separated list of required scopes")
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "social_media_platforms"
        verbose_name = _("social media platform")
        verbose_name_plural = _("social media platforms")

    def __str__(self):
        return self.display_name


class SocialMediaConnection(models.Model):
    """User's OAuth connections to social media platforms"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_connections')
    platform = models.ForeignKey(SocialMediaPlatform, on_delete=models.CASCADE, related_name='connections')
    
    # OAuth tokens (encrypted)
    access_token = models.TextField(_("access token"))
    refresh_token = models.TextField(_("refresh token"), blank=True)
    token_type = models.CharField(_("token type"), max_length=50, default="Bearer")
    
    # Token metadata
    expires_at = models.DateTimeField(_("expires at"), null=True, blank=True)
    scope = models.TextField(_("granted scope"), blank=True)
    
    # Platform-specific data
    platform_user_id = models.CharField(_("platform user id"), max_length=255, blank=True)
    platform_username = models.CharField(_("platform username"), max_length=255, blank=True)
    platform_display_name = models.CharField(_("platform display name"), max_length=255, blank=True)
    platform_profile_url = models.URLField(_("platform profile url"), blank=True, max_length=1000)
    
    # Meta-specific fields
    instagram_business_id = models.CharField(_("Instagram Business ID"), max_length=255, blank=True)
    facebook_page_id = models.CharField(_("Facebook Page ID"), max_length=255, blank=True)
    instagram_username = models.CharField(_("Instagram Username"), max_length=255, blank=True)
    facebook_page_name = models.CharField(_("Facebook Page Name"), max_length=255, blank=True)
    
    # Pinterest-specific fields
    pinterest_user_id = models.CharField(_("Pinterest User ID"), max_length=255, blank=True)
    
    # Connection status
    is_active = models.BooleanField(_("is active"), default=True)
    is_verified = models.BooleanField(_("is verified"), default=False)
    last_used_at = models.DateTimeField(_("last used at"), null=True, blank=True)
    last_error = models.TextField(_("last error"), blank=True)
    
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "social_media_connections"
        verbose_name = _("social media connection")
        verbose_name_plural = _("social media connections")
        # Removed unique_together to allow multiple connections per platform
        # unique_together = ['user', 'platform']
        
        # New constraints to allow multiple Facebook pages and Instagram accounts
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'platform', 'facebook_page_id'],
                condition=models.Q(facebook_page_id__isnull=False) & ~models.Q(facebook_page_id=''),
                name='unique_facebook_connection'
            ),
            models.UniqueConstraint(
                fields=['user', 'platform', 'instagram_business_id'],
                condition=models.Q(instagram_business_id__isnull=False) & ~models.Q(instagram_business_id=''),
                name='unique_instagram_connection'
            ),
            models.UniqueConstraint(
                fields=['user', 'platform', 'pinterest_user_id'],
                condition=models.Q(pinterest_user_id__isnull=False) & ~models.Q(pinterest_user_id=''),
                name='unique_pinterest_connection'
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.platform.display_name}"

    @property
    def is_expired(self):
        """Check if the access token is expired"""
        if not self.expires_at:
            return False
        from django.utils import timezone
        return timezone.now() >= self.expires_at

    @property
    def needs_refresh(self):
        """Check if token needs refresh (expires within 1 hour)"""
        if not self.expires_at:
            return False
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() >= (self.expires_at - timedelta(hours=1))


class SocialMediaPost(models.Model):
    """Posts scheduled or sent to social media platforms"""
    POST_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_posts')
    connection = models.ForeignKey(SocialMediaConnection, on_delete=models.CASCADE, related_name='posts')
    
    # Post content
    text = models.TextField(_("post text"))
    media_files = models.ManyToManyField(
        'Media', 
        related_name='social_posts', 
        blank=True,
        help_text=_("Media files (images/videos) for this post")
    )
    
    # Scheduling
    scheduled_at = models.DateTimeField(_("scheduled at"), null=True, blank=True)
    sent_at = models.DateTimeField(_("sent at"), null=True, blank=True)
    
    # Platform response
    platform_post_id = models.CharField(_("platform post id"), max_length=255, blank=True)
    platform_post_url = models.URLField(_("platform post url"), blank=True)
    
    # Status tracking
    status = models.CharField(_("status"), max_length=20, choices=POST_STATUS_CHOICES, default='draft')
    error_message = models.TextField(_("error message"), blank=True)
    retry_count = models.IntegerField(_("retry count"), default=0)
    
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "social_media_posts"
        verbose_name = _("social media post")
        verbose_name_plural = _("social media posts")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.connection.platform.display_name} - {self.text[:50]}"
    
    @property
    def media_urls(self):
        """Return list of media URLs for backward compatibility"""
        return [media.image.url for media in self.media_files.all()]
    
    @property
    def media_count(self):
        """Return count of media files"""
        return self.media_files.count()


class SocialMediaPostTemplate(models.Model):
    """Reusable post templates for different platforms"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_templates')
    name = models.CharField(_("template name"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    
    # Template content
    text_template = models.TextField(_("text template"))
    media_urls = models.JSONField(_("media urls"), default=list, blank=True)
    
    # Platform targeting
    platforms = models.ManyToManyField(SocialMediaPlatform, related_name='templates')
    
    # Template settings
    is_active = models.BooleanField(_("is active"), default=True)
    is_public = models.BooleanField(_("is public"), default=False)
    
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "social_media_post_templates"
        verbose_name = _("social media post template")
        verbose_name_plural = _("social media post templates")

    def __str__(self):
        return f"{self.user.username} - {self.name}"


# COMMENT AUTOMATION MODELS #

class Comment(models.Model):
    """Store Facebook comments from webhooks"""
    comment_id = models.CharField("Facebook comment ID", max_length=255, unique=True)
    post_id = models.CharField("Facebook post ID", max_length=255)
    page_id = models.CharField("Facebook page ID", max_length=255)
    
    from_user_name = models.CharField("User name", max_length=255)
    from_user_id = models.CharField("Facebook user ID", max_length=255, blank=True)
    message = models.TextField("Comment message")
    
    connection = models.ForeignKey(SocialMediaConnection, on_delete=models.CASCADE, related_name='comments')
    
    status = models.CharField("Status", max_length=20, default='new', choices=[
        ('new', 'New'),
        ('replied', 'Replied'),
        ('ignored', 'Ignored')
    ])
    
    created_time = models.DateTimeField("Facebook created time")
    received_at = models.DateTimeField("Received at", auto_now_add=True)
    
    class Meta:
        db_table = 'comments'
        ordering = ['-created_time']

    def __str__(self):
        return f"Comment by {self.from_user_name}: {self.message[:50]}"


class AutomationRule(models.Model):
    """User-defined automation rules for message replies (comments and DMs)"""
    MESSAGE_TYPE_CHOICES = [
        ('comment', 'Comment'),
        ('dm', 'Direct Message'),
        ('both', 'Both'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='automation_rules')
    connection = models.ForeignKey(SocialMediaConnection, on_delete=models.CASCADE, related_name='automation_rules')
    
    rule_name = models.CharField("Rule name", max_length=100)
    message_type = models.CharField("Message type", max_length=10, choices=MESSAGE_TYPE_CHOICES, default='comment')
    keywords = models.JSONField("Keywords", default=list)
    reply_template = models.TextField("Reply template")
    
    is_active = models.BooleanField("Is active", default=True)
    priority = models.IntegerField("Priority", default=0)
    
    times_triggered = models.IntegerField("Times triggered", default=0)
    created_at = models.DateTimeField("Created at", auto_now_add=True)
    
    class Meta:
        db_table = 'automation_rules'
        ordering = ['connection', '-priority']
        unique_together = [['user', 'connection', 'rule_name', 'message_type']]

    def __str__(self):
        return f"{self.rule_name} [{self.message_type}] ({self.connection.facebook_page_name})"


# Backwards compatibility alias
CommentAutomationRule = AutomationRule


class AutomationSettings(models.Model):
    """Global automation settings per connection"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='automation_settings')
    connection = models.ForeignKey(SocialMediaConnection, on_delete=models.CASCADE, related_name='automation_settings', unique=True)
    
    # Comment automation settings
    is_enabled = models.BooleanField("Comment automation enabled", default=True)
    default_reply = models.TextField("Default comment reply", blank=True)
    reply_delay_seconds = models.IntegerField("Comment reply delay (seconds)", default=5)
    
    # DM automation settings
    enable_dm_automation = models.BooleanField("DM automation enabled", default=False)
    dm_default_reply = models.TextField("Default DM reply", blank=True)
    dm_reply_delay_seconds = models.IntegerField("DM reply delay (seconds)", default=10)
    
    created_at = models.DateTimeField("Created at", auto_now_add=True)
    updated_at = models.DateTimeField("Updated at", auto_now=True)
    
    class Meta:
        db_table = 'automation_settings'

    def __str__(self):
        return f"Settings for {self.connection.facebook_page_name}"


# Backwards compatibility alias
CommentAutomationSettings = AutomationSettings


class CommentReply(models.Model):
    """Track automated replies sent"""
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='replies')
    rule = models.ForeignKey(AutomationRule, on_delete=models.SET_NULL, null=True, blank=True, related_name='comment_replies')
    
    reply_text = models.TextField("Reply text")
    facebook_reply_id = models.CharField("Facebook reply ID", max_length=255, blank=True)
    
    status = models.CharField("Status", max_length=20, default='sent', choices=[
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed')
    ])
    
    sent_at = models.DateTimeField("Sent at", auto_now_add=True)
    
    class Meta:
        db_table = 'comment_replies'
        ordering = ['-sent_at']

    def __str__(self):
        return f"Reply to {self.comment.comment_id}"


# DIRECT MESSAGE AUTOMATION MODELS #

class DirectMessage(models.Model):
    """Store Facebook/Instagram direct messages from webhooks"""
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook Messenger'),
        ('instagram', 'Instagram DM'),
    ]
    
    message_id = models.CharField("Message ID", max_length=255, unique=True)
    conversation_id = models.CharField("Conversation ID", max_length=255)
    platform = models.CharField("Platform", max_length=20, choices=PLATFORM_CHOICES)
    
    sender_id = models.CharField("Sender ID", max_length=255)
    sender_name = models.CharField("Sender name", max_length=255, blank=True)
    message_text = models.TextField("Message text", blank=True)
    message_attachments = models.JSONField("Attachments", default=list, blank=True)
    
    connection = models.ForeignKey(SocialMediaConnection, on_delete=models.CASCADE, related_name='direct_messages')
    
    status = models.CharField("Status", max_length=20, default='new', choices=[
        ('new', 'New'),
        ('replied', 'Replied'),
        ('ignored', 'Ignored'),
        ('error', 'Error')
    ])
    
    is_echo = models.BooleanField("Is echo", default=False, help_text="Message sent by the page itself")
    created_time = models.DateTimeField("Platform created time")
    received_at = models.DateTimeField("Received at", auto_now_add=True)
    
    class Meta:
        db_table = 'direct_messages'
        ordering = ['-created_time']
        indexes = [
            models.Index(fields=['platform', 'conversation_id']),
            models.Index(fields=['connection', 'status']),
        ]

    def __str__(self):
        return f"{self.platform.title()} DM from {self.sender_name}: {self.message_text[:50]}"


class DirectMessageReply(models.Model):
    """Track automated DM replies sent"""
    direct_message = models.ForeignKey(DirectMessage, on_delete=models.CASCADE, related_name='replies')
    rule = models.ForeignKey('AutomationRule', on_delete=models.SET_NULL, null=True, blank=True, related_name='dm_replies')
    
    reply_text = models.TextField("Reply text")
    platform_reply_id = models.CharField("Platform reply ID", max_length=255, blank=True)
    
    status = models.CharField("Status", max_length=20, default='sent', choices=[
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('error', 'Error')
    ])
    
    error_message = models.TextField("Error message", blank=True)
    sent_at = models.DateTimeField("Sent at", auto_now_add=True)
    
    class Meta:
        db_table = 'direct_message_replies'
        ordering = ['-sent_at']

    def __str__(self):
        return f"Reply to {self.direct_message.message_id}"


# STRIPE PLANS #

class BillingPeriod(models.TextChoices):
    MONTHLY = "MONTHLY", _("Monthly")
    YEARLY = "YEARLY", _("Yearly")


class Plan(models.Model):
    name = models.CharField(max_length=100, help_text=_("Display name for the plan"))
    slug = models.SlugField(max_length=100, unique=True, help_text=_("URL-friendly identifier"))
    description = models.TextField(blank=True, help_text=_("Description of what this plan includes"))
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text=_("Price in USD"))
    billing_period = models.CharField(max_length=10, choices=BillingPeriod.choices, default=BillingPeriod.MONTHLY)
    stripe_product_id = models.CharField(max_length=255, blank=True, help_text=_("Stripe Product ID"))
    stripe_price_id = models.CharField(max_length=255, blank=True, help_text=_("Stripe Price ID"))
    trial_period_days = models.PositiveIntegerField(default=14, help_text=_("Number of days for free trial"))
    is_active = models.BooleanField(default=True, help_text=_("Whether this plan is available for new subscriptions"))
    is_featured = models.BooleanField(default=False, help_text=_("Highlight this plan in pricing display"))
    sort_order = models.PositiveIntegerField(default=0, help_text=_("Display order (lower numbers first)"))
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plans"
        ordering = ["sort_order", "price"]
        verbose_name = _("Subscription Plan")
        verbose_name_plural = _("Subscription Plans")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_period.lower()}"


class PlanFeature(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="features")
    feature_key = models.CharField(max_length=100, help_text=_("Technical key for feature (e.g., 'max_audits', 'has_priority_support')"))
    feature_name = models.CharField(max_length=200, help_text=_("Human-readable feature name"))
    feature_value = models.CharField(max_length=100, help_text=_("Feature value (e.g., '10', 'unlimited', 'true')"))
    is_highlight = models.BooleanField(default=False, help_text=_("Show this feature prominently in pricing"))
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "plan_features"
        ordering = ["sort_order", "feature_name"]
        unique_together = ("plan", "feature_key")
        verbose_name = _("Plan Feature")
        verbose_name_plural = _("Plan Features")

    def __str__(self):
        return f"{self.plan.name}: {self.feature_name} = {self.feature_value}"


class SubscriptionStatus(models.TextChoices):
    INACTIVE = "INACTIVE", _("Inactive")
    ACTIVE = "ACTIVE", _("Active")
    TRIALING = "TRIALING", _("Trialing")
    PAST_DUE = "PAST_DUE", _("Past Due")
    CANCELED = "CANCELED", _("Canceled")


class StripeCustomer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="stripe_customer")
    stripe_customer_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stripe_customers"

    def __str__(self):
        return f"{self.user} ({self.stripe_customer_id})"


class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="subscription")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions", null=True, blank=True, help_text=_("The subscribed plan"))
    stripe_subscription_id = models.CharField(max_length=255, unique=True)
    price_id = models.CharField(max_length=255, blank=True, help_text=_("Stripe Price ID for backwards compatibility"))
    status = models.CharField(max_length=16, choices=SubscriptionStatus.choices, default=SubscriptionStatus.INACTIVE)
    trial_start = models.DateTimeField(null=True, blank=True, help_text=_("When the trial period started"))
    trial_end = models.DateTimeField(null=True, blank=True, help_text=_("When the trial period ends"))
    is_trialing = models.BooleanField(default=False, help_text=_("Whether subscription is currently in trial period"))
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    canceled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "subscriptions"

    def __str__(self):
        plan_name = self.plan.name if self.plan else "No Plan"
        return f"{self.user} - {plan_name} ({self.status})"


class PaymentEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_events")
    event_type = models.CharField(max_length=255)
    stripe_event_id = models.CharField(max_length=255, unique=True)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment_events"
        ordering = ["-created_at"]

    def __str__(self):
        return self.event_type


class Folder(models.Model):
    """Folders for organizing media files"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='folders',
        null=True, 
        blank=True
    )
    name = models.CharField(_("folder name"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    is_default = models.BooleanField(_("is default"), default=False)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "folders"
        verbose_name = _("folder")
        verbose_name_plural = _("folders")
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'name'],
                name='unique_folder_name_per_user'
            ),
        ]

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.name}"

    @classmethod
    def get_or_create_default(cls, user=None):
        """Get or create the default folder for a user"""
        folder, created = cls.objects.get_or_create(
            user=user,
            is_default=True,
            defaults={
                'name': 'Default',
                'description': 'Default folder for media files'
            }
        )
        return folder


class Media(models.Model):
    """Media files stored in Cloudinary with optional user association"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='media_files',
        null=True, 
        blank=True
    )
    folder = models.ForeignKey(
        Folder,
        on_delete=models.CASCADE,
        related_name='media_files',
        null=True,
        blank=True
    )
    image = CloudinaryField('image')
    file_size = models.PositiveIntegerField(_("file size"), null=True, blank=True)
    file_name = models.CharField(_("file name"), max_length=255, blank=True)
    used_in_posts_count = models.PositiveIntegerField(_("used in posts count"), default=0)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "media"
        verbose_name = _("media")
        verbose_name_plural = _("media")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.file_name}"

    def save(self, *args, **kwargs):
        # Auto-assign to default folder if no folder is specified
        if not self.folder:
            self.folder = Folder.get_or_create_default(self.user)
        super().save(*args, **kwargs)


# Analytics Models for Storefront
class ProfileView(models.Model):
    """Track profile page views for analytics"""
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='profile_views')
    ip_address = models.GenericIPAddressField(_("IP address"), null=True, blank=True)
    user_agent = models.TextField(_("user agent"), blank=True)
    referrer = models.URLField(_("referrer"), blank=True, max_length=500)
    viewed_at = models.DateTimeField(_("viewed at"), auto_now_add=True)

    class Meta:
        db_table = "profile_views"
        verbose_name = _("profile view")
        verbose_name_plural = _("profile views")
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['user_profile', '-viewed_at']),
            models.Index(fields=['viewed_at']),
            models.Index(fields=['ip_address', 'viewed_at']),  # For duplicate detection
        ]

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.viewed_at}"


class LinkClick(models.Model):
    """Track clicks on custom links for analytics"""
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='link_clicks')
    custom_link = models.ForeignKey(CustomLink, on_delete=models.CASCADE, related_name='clicks', null=True, blank=True)
    ip_address = models.GenericIPAddressField(_("IP address"), null=True, blank=True)
    user_agent = models.TextField(_("user agent"), blank=True)
    referrer = models.URLField(_("referrer"), blank=True, max_length=500)
    clicked_at = models.DateTimeField(_("clicked at"), auto_now_add=True)

    class Meta:
        db_table = "link_clicks"
        verbose_name = _("link click")
        verbose_name_plural = _("link clicks")
        ordering = ['-clicked_at']
        indexes = [
            models.Index(fields=['user_profile', '-clicked_at']),
            models.Index(fields=['custom_link', '-clicked_at']),
            models.Index(fields=['clicked_at']),
            models.Index(fields=['ip_address', 'clicked_at']),  # For duplicate detection
        ]


class BannerClick(models.Model):
    """Track clicks on CTA banners for analytics"""
    banner = models.ForeignKey(CTABanner, on_delete=models.CASCADE, related_name='clicks')
    ip_address = models.GenericIPAddressField(_("IP address"), null=True, blank=True)
    user_agent = models.TextField(_("user agent"), blank=True)
    referrer = models.URLField(_("referrer"), blank=True, max_length=500)
    timestamp = models.DateTimeField(_("timestamp"), auto_now_add=True)

    class Meta:
        db_table = "banner_clicks"
        verbose_name = _("banner click")
        verbose_name_plural = _("banner clicks")
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['banner', '-timestamp']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),  # For duplicate detection
        ]

    def __str__(self):
        return f"{self.banner.user_profile.user.username} - Banner Click - {self.timestamp}"


class Order(models.Model):
    """
    Orders created when customers purchase digital products through custom links.
    Stores all form responses and basic order information.
    """
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Core order information
    custom_link = models.ForeignKey(CustomLink, on_delete=models.CASCADE, related_name='orders')
    order_id = models.CharField(_("order ID"), max_length=100, unique=True)
    status = models.CharField(_("status"), max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    
    # Customer information
    customer_email = models.EmailField(_("customer email"), blank=True)
    customer_name = models.CharField(_("customer name"), max_length=255, blank=True)
    
    # Form responses from checkout fields
    form_responses = models.JSONField(_("form responses"), default=dict, help_text="JSON object with field_label: response mappings")
    
    # Timestamps
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        db_table = "orders"
        verbose_name = _("order")
        verbose_name_plural = _("orders")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['custom_link', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['order_id']),
        ]

    def __str__(self):
        return f"Order {self.order_id} - {self.custom_link.title or 'Product'} - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            # Generate a unique order ID
            import uuid
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_id = str(uuid.uuid4())[:8].upper()
            self.order_id = f"ORD-{timestamp}-{unique_id}"
        super().save(*args, **kwargs)
    
    def get_formatted_responses(self):
        """Return form responses in a readable format"""
        if not self.form_responses:
            return []
        
        formatted = []
        for field_label, response in self.form_responses.items():
            if isinstance(response, list):
                response_value = ', '.join(response)
            else:
                response_value = str(response)
            formatted.append({
                'question': field_label,
                'answer': response_value
            })
        return formatted


# Signal for Order completion to send product delivery emails
@receiver(post_save, sender=Order)
def send_product_delivery_on_completion(sender, instance, created, **kwargs):
    """
    Send product delivery email when order status changes to 'completed'.
    Only sends email once per order to avoid duplicates.
    """
    # Import here to avoid circular imports
    from .services.email_service import send_product_delivery_email
    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"Order signal triggered for order {instance.order_id}: status={instance.status}, created={created}")

    if instance.status == 'completed' and not created:  # Only for updates, not new orders
        try:
            # Check if we need to send email (avoid duplicates)
            # We can track this by checking if the status changed to 'completed'
            if hasattr(instance, '_original_status'):
                logger.info(f"Order {instance.order_id} original status: {instance._original_status}, new status: {instance.status}")
                if instance._original_status != 'completed':
                    logger.info(f"Sending product delivery email for order {instance.order_id}")
                    email_sent = send_product_delivery_email(instance)
                    if email_sent:
                        logger.info(f"Product delivery email sent successfully for order {instance.order_id}")
                    else:
                        logger.warning(f"Failed to send product delivery email for order {instance.order_id}")

                    # Schedule follow-up email sequence for freebies
                    if instance.custom_link.type == 'freebie':
                        from .tasks import schedule_freebie_email_sequence
                        logger.info(f"Scheduling freebie follow-up sequence for order {instance.order_id}")
                        schedule_freebie_email_sequence.delay(instance.id)

                    # Schedule follow-up email sequence for opt-ins
                    if instance.custom_link.type == 'opt_in':
                        from .tasks import schedule_optin_email_sequence
                        logger.info(f"Scheduling opt-in follow-up sequence for order {instance.order_id}")
                        schedule_optin_email_sequence.delay(instance.id)
                else:
                    logger.debug(f"Order {instance.order_id} was already completed, skipping email")
            else:
                # Fallback: send email if we can't track previous status
                logger.info(f"No original status tracked, sending email for order {instance.order_id}")
                email_sent = send_product_delivery_email(instance)
                if email_sent:
                    logger.info(f"Product delivery email sent successfully for order {instance.order_id}")
                else:
                    logger.warning(f"Failed to send product delivery email for order {instance.order_id}")

        except Exception as email_error:
            logger.error(f"Error sending product delivery email for order {instance.order_id}: {email_error}")
    else:
        logger.info(f"Order signal skipped for {instance.order_id}: status={instance.status}, created={created}")


# Add status tracking for Order model
@receiver(models.signals.pre_save, sender=Order)
def track_order_status_change(sender, instance, **kwargs):
    """
    Track the original status before saving to detect status changes.
    """
    import logging
    logger = logging.getLogger(__name__)

    if instance.pk:
        try:
            original_order = sender.objects.get(pk=instance.pk)
            instance._original_status = original_order.status
            logger.info(f"Order {instance.order_id} pre_save: original_status={original_order.status}, new_status={instance.status}")
        except sender.DoesNotExist:
            instance._original_status = None
            logger.info(f"Order {instance.order_id} pre_save: original order not found")
    else:
        instance._original_status = None
        logger.info(f"Order {instance.order_id} pre_save: new order, no original status")


class AIConfiguration(models.Model):
    """
    Global AI configuration model for customizing system prompts and settings
    for different AI capabilities. Configured by admin, applied to all users.
    """
    
    # Capability choices
    CAPABILITY_CHOICES = [
        ('text_generation', 'Text Generation'),
        ('image_generation', 'Image Generation'),
        ('social_content', 'Social Media Content'),
        ('content_improvement', 'Content Improvement'),
        ('image_analysis', 'Image Analysis'),
    ]
    
    capability = models.CharField(_("AI capability"), max_length=50, choices=CAPABILITY_CHOICES, unique=True)
    
    # System prompt configuration
    system_prompt = models.TextField(
        _("system prompt"), 
        help_text="Custom system prompt for this AI capability",
        blank=True
    )
    
    # Model settings
    text_generation_model = models.CharField(
        _("text generation model"), 
        max_length=100,
        default='gpt-4',
        help_text="Model to use for text generation capabilities"
    )
    
    vision_model = models.CharField(
        _("vision model"), 
        max_length=100,
        default='gpt-4-vision-preview',
        help_text="Model to use for image analysis capabilities"
    )
    
    # General settings
    is_active = models.BooleanField(_("is active"), default=True)
    
    # Global usage tracking
    total_usage_count = models.PositiveBigIntegerField(_("total usage count"), default=0)
    total_tokens_used = models.PositiveBigIntegerField(_("total tokens used"), default=0)
    last_used_at = models.DateTimeField(_("last used at"), null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        db_table = "ai_configurations"
        verbose_name = _("AI configuration")
        verbose_name_plural = _("AI configurations")
        indexes = [
            models.Index(fields=['capability']),
            models.Index(fields=['is_active']),
            models.Index(fields=['last_used_at']),
        ]
    
    def __str__(self):
        return f"Global AI Config - {self.get_capability_display()}"
    
    def increment_usage(self, tokens_used: int = 0):
        """Increment global usage statistics"""
        self.total_usage_count += 1
        self.total_tokens_used += tokens_used
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_usage_count', 'total_tokens_used', 'last_used_at'])
    
    def get_system_prompt_or_default(self) -> str:
        """Get custom system prompt or return capability-specific default"""
        if self.system_prompt.strip():
            return self.system_prompt
        
        # Return default system prompts for each capability
        defaults = {
            'text_generation': "You are a helpful AI assistant that generates high-quality content based on user prompts.",
            'image_generation': "You are an AI image generation assistant. Generate detailed, creative image descriptions.",
            'social_content': "You are a social media content specialist. Create engaging, platform-appropriate content that drives interaction.",
            'content_improvement': "You are a professional content editor. Enhance content while maintaining the original voice and message.",
            'image_analysis': "You are an expert image analyst. Provide detailed, accurate descriptions and insights about images."
        }
        
        return defaults.get(self.capability, "You are a helpful AI assistant.")
    
    def get_model_for_capability(self) -> str:
        """Get the appropriate model for this capability"""
        if self.default_model:
            return self.default_model
            
        # Return default models for each capability
        defaults = {
            'text_generation': 'gpt-4',
            'image_generation': 'dall-e-3', 
            'social_content': 'gpt-4',
            'content_improvement': 'gpt-4',
            'image_analysis': 'gpt-4-vision-preview'
        }
        
        return defaults.get(self.capability, 'gpt-4')
    
    @classmethod
    def get_for_capability(cls, capability: str) -> 'AIConfiguration':
        """Get global AI configuration for capability"""
        try:
            return cls.objects.get(capability=capability)
        except cls.DoesNotExist:
            return None
    
    @classmethod 
    def create_default_configs(cls):
        """Create default configurations for all capabilities (admin only)"""
        for capability_key, capability_name in cls.CAPABILITY_CHOICES:
            cls.objects.get_or_create(
                capability=capability_key,
                defaults={
                    'is_active': True,
                }
            )


# ============================================================================
# STRIPE CONNECT MODELS
# ============================================================================

class StripeConnectAccount(models.Model):
    """
    Represents a connected Stripe Express account for a platform user.
    Allows users to receive payments from their customers.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='connect_account')
    stripe_account_id = models.CharField(_("Stripe account ID"), max_length=255, unique=True)
    
    # Account status
    charges_enabled = models.BooleanField(_("charges enabled"), default=False, help_text="Whether the account can create charges")
    payouts_enabled = models.BooleanField(_("payouts enabled"), default=False, help_text="Whether Stripe can send payouts to the account")
    details_submitted = models.BooleanField(_("details submitted"), default=False, help_text="Whether account details have been submitted")
    
    # Account info
    country = models.CharField(_("country"), max_length=2, blank=True, help_text="Two-letter country code")
    default_currency = models.CharField(_("default currency"), max_length=3, default='usd')
    email = models.EmailField(_("account email"), blank=True)
    
    # Commission settings
    platform_fee_percentage = models.DecimalField(
        _("platform fee percentage"),
        max_digits=5,
        decimal_places=2,
        default=4.00,
        help_text="Percentage of each transaction kept as platform fee"
    )
    
    # Onboarding
    onboarding_completed_at = models.DateTimeField(_("onboarding completed at"), null=True, blank=True)
    requirements_due = models.JSONField(_("requirements due"), null=True, blank=True, help_text="Currently due requirements for the account")
    requirements_errors = models.JSONField(_("requirements errors"), null=True, blank=True, help_text="Requirements that need to be fixed")
    
    # Timestamps
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        db_table = "stripe_connect_accounts"
        verbose_name = _("Stripe Connect account")
        verbose_name_plural = _("Stripe Connect accounts")
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['stripe_account_id']),
            models.Index(fields=['charges_enabled', 'payouts_enabled']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.stripe_account_id[:15]}... ({self.get_status()})"
    
    def get_status(self):
        """Get human-readable account status"""
        if self.charges_enabled and self.payouts_enabled:
            return "Active"
        elif self.details_submitted:
            return "Pending Verification"
        else:
            return "Incomplete"
    
    @property
    def is_active(self):
        """Check if account is fully active and can process payments"""
        return self.charges_enabled and self.payouts_enabled
    
    def calculate_platform_fee(self, amount: int) -> int:
        """
        Calculate platform fee for a given amount (in cents).
        Returns fee amount in cents.
        """
        from decimal import Decimal, ROUND_UP
        fee_decimal = Decimal(str(amount)) * (self.platform_fee_percentage / 100)
        return int(fee_decimal.quantize(Decimal('1'), rounding=ROUND_UP))


class PaymentTransaction(models.Model):
    """
    Records payment transactions for products sold through the platform.
    Tracks the flow of money from customer to platform to seller.
    """
    TRANSACTION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    # Relationships
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment_transaction')
    seller_account = models.ForeignKey(StripeConnectAccount, on_delete=models.PROTECT, related_name='transactions')
    
    # Stripe IDs
    stripe_checkout_session_id = models.CharField(_("checkout session ID"), max_length=255, unique=True, null=True, blank=True)
    payment_intent_id = models.CharField(_("payment intent ID"), max_length=255, unique=True, null=True, blank=True)
    charge_id = models.CharField(_("charge ID"), max_length=255, blank=True)
    transfer_id = models.CharField(_("transfer ID"), max_length=255, blank=True, help_text="ID of transfer to connected account")
    
    # Amounts (all in cents/smallest currency unit)
    total_amount = models.IntegerField(_("total amount"), help_text="Total amount paid by customer (in cents)")
    platform_fee = models.IntegerField(_("platform fee"), help_text="Platform commission (in cents)")
    seller_amount = models.IntegerField(_("seller amount"), help_text="Amount transferred to seller (in cents)")
    stripe_processing_fee = models.IntegerField(_("Stripe processing fee"), default=0, help_text="Stripe's processing fee (in cents)")
    
    # Currency
    currency = models.CharField(_("currency"), max_length=3, default='usd')
    
    # Status tracking
    status = models.CharField(_("status"), max_length=20, choices=TRANSACTION_STATUS_CHOICES, default='pending')
    transfer_status = models.CharField(_("transfer status"), max_length=50, blank=True, help_text="Status of transfer to seller")
    
    # Customer info (for reference)
    customer_email = models.EmailField(_("customer email"), blank=True)
    
    # Refund tracking
    refunded_amount = models.IntegerField(_("refunded amount"), default=0, help_text="Amount refunded to customer (in cents)")
    platform_fee_refunded = models.IntegerField(_("platform fee refunded"), default=0, help_text="Platform fee refunded (in cents)")
    
    # Metadata
    metadata = models.JSONField(_("metadata"), default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    paid_at = models.DateTimeField(_("paid at"), null=True, blank=True)
    transferred_at = models.DateTimeField(_("transferred at"), null=True, blank=True)
    
    class Meta:
        db_table = "payment_transactions"
        verbose_name = _("payment transaction")
        verbose_name_plural = _("payment transactions")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['seller_account', '-created_at']),
            models.Index(fields=['payment_intent_id']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        payment_id = self.payment_intent_id[:15] + "..." if self.payment_intent_id else "Pending"
        return f"Transaction {payment_id} - {self.get_display_amount()} ({self.status})"
    
    def get_display_amount(self):
        """Get formatted display amount"""
        return f"${self.total_amount / 100:.2f} {self.currency.upper()}"
    
    def get_seller_payout(self):
        """Get formatted seller payout amount"""
        return f"${self.seller_amount / 100:.2f} {self.currency.upper()}"
    
    def get_platform_earnings(self):
        """Get formatted platform earnings"""
        return f"${self.platform_fee / 100:.2f} {self.currency.upper()}"


class ConnectWebhookEvent(models.Model):
    """
    Logs Stripe Connect webhook events for debugging and auditing.
    Separate from regular subscription webhook events.
    """
    stripe_event_id = models.CharField(_("Stripe event ID"), max_length=255, unique=True)
    event_type = models.CharField(_("event type"), max_length=100)
    account_id = models.CharField(_("account ID"), max_length=255, blank=True, null=True, help_text="Connected account ID if applicable")
    
    # Related models
    connect_account = models.ForeignKey(
        StripeConnectAccount, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='webhook_events'
    )
    payment_transaction = models.ForeignKey(
        PaymentTransaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_events'
    )
    
    # Event data
    data = models.JSONField(_("event data"))
    processed = models.BooleanField(_("processed"), default=False)
    error_message = models.TextField(_("error message"), blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    processed_at = models.DateTimeField(_("processed at"), null=True, blank=True)
    
    class Meta:
        db_table = "connect_webhook_events"
        verbose_name = _("Connect webhook event")
        verbose_name_plural = _("Connect webhook events")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_event_id']),
            models.Index(fields=['event_type']),
            models.Index(fields=['processed', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.stripe_event_id[:20]}..."


# ============================================================================
# CUSTOM LINK TEMPLATE AUTO-SYNC SIGNAL
# ============================================================================


class MiloPrompt(models.Model):
    """
    Model to store and manage Milo AI system prompts.
    """
    system_prompt = models.TextField(_("system prompt"), help_text="System prompt for Milo AI assistant")
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "milo_prompts"
        verbose_name = _("Milo Prompt")
        verbose_name_plural = _("Milo Prompts")
        ordering = ['-modified_at']

    def __str__(self):
        return f"Milo Prompt - {self.modified_at.strftime('%Y-%m-%d %H:%M')}"


class FreebieFollowupEmail(models.Model):
    """
    Email templates for freebie follow-up sequence.
    """
    step_number = models.IntegerField(_("step number"), unique=True, help_text="Email sequence number (1-20)")
    delay_days = models.IntegerField(_("delay days"), help_text="Days after freebie order to send email")
    send_time = models.TimeField(_("send time"), default="10:00", help_text="Time of day to send email (e.g., 10:00 AM)")
    subject = models.CharField(_("subject"), max_length=255)
    body = models.TextField(_("email body"), help_text="Email content with template variables: {{ first_name }}, {{ sender_name }}, {{ affiliate_link }}, {{ personal_email }}")
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "freebie_followup_emails"
        verbose_name = _("Freebie Follow-up Email")
        verbose_name_plural = _("Freebie Follow-up Emails")
        ordering = ['step_number']

    def __str__(self):
        return f"Email {self.step_number} - Day {self.delay_days}: {self.subject}"


class ScheduledFollowupEmail(models.Model):
    """
    Track scheduled follow-up emails for freebie orders.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='followup_emails')
    email_template = models.ForeignKey(FreebieFollowupEmail, on_delete=models.CASCADE)
    scheduled_for = models.DateTimeField(_("scheduled for"), help_text="Exact datetime to send email")
    sent = models.BooleanField(_("sent"), default=False)
    sent_at = models.DateTimeField(_("sent at"), null=True, blank=True)
    error_message = models.TextField(_("error message"), blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        db_table = "scheduled_followup_emails"
        verbose_name = _("Scheduled Follow-up Email")
        verbose_name_plural = _("Scheduled Follow-up Emails")
        ordering = ['scheduled_for']
        indexes = [
            models.Index(fields=['sent', 'scheduled_for']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        status = "Sent" if self.sent else "Pending"
        return f"{self.order.order_id} - Email {self.email_template.step_number} - {status}"


class OptinFollowupEmail(models.Model):
    """
    Email templates for opt-in follow-up sequence.
    """
    step_number = models.IntegerField(_("step number"), unique=True, help_text="Email sequence number (1-20)")
    delay_days = models.IntegerField(_("delay days"), help_text="Days after opt-in to send email")
    send_time = models.TimeField(_("send time"), default="10:00", help_text="Time of day to send email (e.g., 10:00 AM)")
    subject = models.CharField(_("subject"), max_length=255)
    body = models.TextField(_("email body"), help_text="Email content with template variables: {{ first_name }}, {{ sender_name }}, {{ affiliate_link }}, {{ personal_email }}")
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "optin_followup_emails"
        verbose_name = _("Opt-in Follow-up Email")
        verbose_name_plural = _("Opt-in Follow-up Emails")
        ordering = ['step_number']

    def __str__(self):
        return f"Email {self.step_number} - Day {self.delay_days}: {self.subject}"


class ScheduledOptinEmail(models.Model):
    """
    Track scheduled follow-up emails for opt-in orders.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='optin_followup_emails')
    email_template = models.ForeignKey(OptinFollowupEmail, on_delete=models.CASCADE)
    scheduled_for = models.DateTimeField(_("scheduled for"), help_text="Exact datetime to send email")
    sent = models.BooleanField(_("sent"), default=False)
    sent_at = models.DateTimeField(_("sent at"), null=True, blank=True)
    error_message = models.TextField(_("error message"), blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        db_table = "scheduled_optin_emails"
        verbose_name = _("Scheduled Opt-in Email")
        verbose_name_plural = _("Scheduled Opt-in Emails")
        ordering = ['scheduled_for']
        indexes = [
            models.Index(fields=['sent', 'scheduled_for']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        status = "Sent" if self.sent else "Pending"
        return f"{self.order.order_id} - Email {self.email_template.step_number} - {status}"


# ============================================================================
# Email Integration Models
# ============================================================================

class EmailAccount(models.Model):
    """
    Stores user's connected Gmail accounts via OAuth.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_accounts')
    email_address = models.EmailField(_("email address"))
    access_token = models.TextField(_("access token"), help_text="Encrypted OAuth access token")
    refresh_token = models.TextField(_("refresh token"), help_text="Encrypted OAuth refresh token")
    token_expiry = models.DateTimeField(_("token expiry"), null=True, blank=True)
    is_active = models.BooleanField(_("is active"), default=True)
    last_synced = models.DateTimeField(_("last synced"), null=True, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "email_accounts"
        verbose_name = _("Email Account")
        verbose_name_plural = _("Email Accounts")
        unique_together = [['user', 'email_address']]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.email_address}"


class EmailMessage(models.Model):
    """
    Stores synced email messages from Gmail.
    """
    account = models.ForeignKey(EmailAccount, on_delete=models.CASCADE, related_name='messages')
    message_id = models.CharField(_("message ID"), max_length=255, help_text="Gmail message ID")
    thread_id = models.CharField(_("thread ID"), max_length=255, blank=True)
    from_email = models.EmailField(_("from email"))
    from_name = models.CharField(_("from name"), max_length=255, blank=True)
    to_emails = models.JSONField(_("to emails"), default=list)
    cc_emails = models.JSONField(_("cc emails"), default=list, blank=True)
    subject = models.TextField(_("subject"), blank=True)
    body_text = models.TextField(_("body text"), blank=True)
    body_html = models.TextField(_("body html"), blank=True)
    snippet = models.TextField(_("snippet"), blank=True, help_text="Email preview text")
    received_at = models.DateTimeField(_("received at"))
    is_read = models.BooleanField(_("is read"), default=False)
    is_starred = models.BooleanField(_("is starred"), default=False)
    has_attachments = models.BooleanField(_("has attachments"), default=False)
    labels = models.JSONField(_("labels"), default=list, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        db_table = "email_messages"
        verbose_name = _("Email Message")
        verbose_name_plural = _("Email Messages")
        unique_together = [['account', 'message_id']]
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['account', '-received_at']),
            models.Index(fields=['message_id']),
            models.Index(fields=['thread_id']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.subject[:50]} - {self.from_email}"


class EmailAttachment(models.Model):
    """
    Stores email attachments.
    """
    message = models.ForeignKey(EmailMessage, on_delete=models.CASCADE, related_name='attachments')
    attachment_id = models.CharField(_("attachment ID"), max_length=255, help_text="Gmail attachment ID")
    filename = models.CharField(_("filename"), max_length=255)
    content_type = models.CharField(_("content type"), max_length=100)
    size = models.BigIntegerField(_("size"), help_text="File size in bytes")
    file = CloudinaryField('email_attachment', blank=True, null=True, help_text="Stored attachment file")
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        db_table = "email_attachments"
        verbose_name = _("Email Attachment")
        verbose_name_plural = _("Email Attachments")
        ordering = ['filename']

    def __str__(self):
        return f"{self.filename} ({self.size} bytes)"


class EmailDraft(models.Model):
    """
    Stores draft emails.
    """
    account = models.ForeignKey(EmailAccount, on_delete=models.CASCADE, related_name='drafts')
    to_emails = models.JSONField(_("to emails"), default=list)
    cc_emails = models.JSONField(_("cc emails"), default=list, blank=True)
    bcc_emails = models.JSONField(_("bcc emails"), default=list, blank=True)
    subject = models.TextField(_("subject"), blank=True)
    body_html = models.TextField(_("body html"), blank=True)
    attachments = models.JSONField(_("attachments"), default=list, blank=True, help_text="List of attachment file URLs")
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "email_drafts"
        verbose_name = _("Email Draft")
        verbose_name_plural = _("Email Drafts")
        ordering = ['-modified_at']

    def __str__(self):
        return f"Draft: {self.subject[:50]}"


# ============================================================================

@receiver(post_save, sender=CustomLinkTemplate)
def auto_sync_template_on_save(sender, instance, created, **kwargs):
    """
    Auto-sync all user links when template is updated.
    When a template is saved (not created), update all CustomLinks that reference it.
    """
    if not created:  # Only on updates, not creation
        instance.sync_to_user_links()

