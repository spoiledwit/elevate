from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from cloudinary.models import CloudinaryField


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
        if not self.slug:
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
        UserPermissions.objects.create(user=instance)


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
        ('github', 'GitHub'),
        ('website', 'Website'),
    ]
    
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='social_icons')
    platform = models.CharField(_("platform"), max_length=50, choices=PLATFORM_CHOICES)
    url = models.URLField(_("url"))
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


class CustomLink(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='custom_links')
    text = models.CharField(_("text"), max_length=255)
    url = models.URLField(_("url"))
    thumbnail = CloudinaryField('link_thumbnail', blank=True, null=True)
    order = models.IntegerField(_("order"), default=0)
    is_active = models.BooleanField(_("is active"), default=True)
    click_count = models.PositiveIntegerField(_("click count"), default=0)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "custom_links"
        verbose_name = _("custom link")
        verbose_name_plural = _("custom links")
        ordering = ['order']

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.text}"


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

