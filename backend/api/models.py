from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    profile_image = models.ImageField(_("profile image"), upload_to='profile_images/', blank=True, null=True)
    embedded_video = models.URLField(_("embedded video"), blank=True)
    is_active = models.BooleanField(_("is active"), default=True)
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
    thumbnail = models.ImageField(_("thumbnail"), upload_to='link_thumbnails/', blank=True, null=True)
    order = models.IntegerField(_("order"), default=0)
    is_active = models.BooleanField(_("is active"), default=True)
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
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "cta_banners"
        verbose_name = _("CTA banner")
        verbose_name_plural = _("CTA banners")

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.text}"


class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    stripe_subscription_id = models.CharField(_("stripe subscription id"), max_length=255)
    start_date = models.DateTimeField(_("start date"))
    end_date = models.DateTimeField(_("end date"))
    last_payment = models.DateTimeField(_("last payment"))
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "subscriptions"
        verbose_name = _("subscription")
        verbose_name_plural = _("subscriptions")

    def __str__(self):
        return f"{self.user.username} - {self.stripe_subscription_id}"











class TriggerRule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trigger_rules')
    trigger_word = models.CharField(_("trigger word"), max_length=255)
    message_template = models.TextField(_("message template"))
    redirect_link = models.URLField(_("redirect link"), blank=True)
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        db_table = "trigger_rules"
        verbose_name = _("trigger rule")
        verbose_name_plural = _("trigger rules")

    def __str__(self):
        return f"{self.user.username} - {self.trigger_word}"


class AIChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chat_history')
    input_text = models.TextField(_("input text"))
    output_text = models.TextField(_("output text"))
    context = models.CharField(_("context"), max_length=255, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    is_active = models.BooleanField(_("is active"), default=True)

    class Meta:
        db_table = "ai_chat_history"
        verbose_name = _("AI chat history")
        verbose_name_plural = _("AI chat history")

    def __str__(self):
        return f"{self.user.username} - {self.input_text[:50]}"


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
    platform_profile_url = models.URLField(_("platform profile url"), blank=True)
    
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
        unique_together = ['user', 'platform']

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
    media_urls = models.JSONField(_("media urls"), default=list, blank=True)
    
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
