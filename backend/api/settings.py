from os import environ
from pathlib import Path

from django.core.management.utils import get_random_secret_key
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

import cloudinary
import cloudinary.uploader
import cloudinary.api

######################################################################
# General
######################################################################
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = environ.get("SECRET_KEY", get_random_secret_key())

DEBUG = environ.get("DEBUG", "") == "1"

ALLOWED_HOSTS = ["localhost", "api", "admin.elevate.social", "elevate.social", "77d705372425.ngrok-free.app", "*.ngrok-free.app", "*.ngrok.io"]

CSRF_TRUSTED_ORIGINS = [
    "https://admin.elevate.social",
    "https://elevate.social",
    "http://localhost:3000",
    "http://localhost:8000",
]

WSGI_APPLICATION = "api.wsgi.application"

ROOT_URLCONF = "api.urls"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

######################################################################
# Apps
######################################################################
INSTALLED_APPS = [
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "cloudinary_storage",
    "cloudinary",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "django_celery_beat",
    "api",
]

######################################################################
# Middleware
######################################################################
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

######################################################################
# Templates
######################################################################
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

######################################################################
# Database
######################################################################
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "USER": environ.get("DATABASE_USER", "postgres"),
        "PASSWORD": environ.get("DATABASE_PASSWORD", "change-password"),
        "NAME": environ.get("DATABASE_NAME", "db"),
        "HOST": environ.get("DATABASE_HOST", "db"),
        "PORT": "5432",
        "TEST": {
            "NAME": "test",
        },
    }
}

######################################################################
# Authentication
######################################################################
AUTH_USER_MODEL = "api.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

######################################################################
# Internationalization
######################################################################
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

######################################################################
# Staticfiles
######################################################################
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise configuration for serving static files
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

######################################################################
# Media files
######################################################################
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

######################################################################
# Rest Framework
######################################################################
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "api.exceptions.custom_exception_handler",
}

######################################################################
# Social Media OAuth Settings
######################################################################
# Token encryption key (should be set in environment)
TOKEN_ENCRYPTION_KEY = environ.get("TOKEN_ENCRYPTION_KEY", "your-secret-encryption-key-change-in-production")

# Social Media Platform Configuration
SOCIAL_MEDIA_PLATFORMS = {
    'facebook': {
        'client_id': environ.get('FACEBOOK_CLIENT_ID', ''),
        'client_secret': environ.get('FACEBOOK_CLIENT_SECRET', ''),
        'auth_url': 'https://www.facebook.com/v18.0/dialog/oauth',
        'token_url': 'https://graph.facebook.com/v18.0/oauth/access_token',
        'scope': 'email,public_profile,publish_actions',
    },
    'instagram': {
        'client_id': environ.get('INSTAGRAM_CLIENT_ID', ''),
        'client_secret': environ.get('INSTAGRAM_CLIENT_SECRET', ''),
        'auth_url': 'https://api.instagram.com/oauth/authorize',
        'token_url': 'https://api.instagram.com/oauth/access_token',
        'scope': 'basic,public_content',
    },
    'linkedin': {
        'client_id': environ.get('LINKEDIN_CLIENT_ID', ''),
        'client_secret': environ.get('LINKEDIN_CLIENT_SECRET', ''),
        'auth_url': 'https://www.linkedin.com/oauth/v2/authorization',
        'token_url': 'https://www.linkedin.com/oauth/v2/accessToken',
        'scope': 'r_liteprofile,r_emailaddress,w_member_social,w_organization_social,rw_organization_admin',
    },
    'youtube': {
        'client_id': environ.get('YOUTUBE_CLIENT_ID', ''),
        'client_secret': environ.get('YOUTUBE_CLIENT_SECRET', ''),
        'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'scope': 'https://www.googleapis.com/auth/youtube.upload',
    },
    'tiktok': {
        'client_id': environ.get('TIKTOK_CLIENT_KEY', ''),
        'client_secret': environ.get('TIKTOK_CLIENT_SECRET', ''),
        'auth_url': 'https://www.tiktok.com/v2/auth/authorize',
        'token_url': 'https://open.tiktokapis.com/v2/oauth/token/',
        'scope': 'user.info.basic,video.publish',
    },
    'pinterest': {
        'client_id': environ.get('PINTEREST_CLIENT_ID', ''),
        'client_secret': environ.get('PINTEREST_CLIENT_SECRET', ''),
        'auth_url': 'https://www.pinterest.com/oauth/',
        'token_url': 'https://api.pinterest.com/v5/oauth/token',
        'scope': 'boards:read,pins:read,pins:write',
    },
}

######################################################################
# Cloudinary Configuration
######################################################################
cloudinary.config(
    cloud_name=environ.get('CLOUDINARY_CLOUD_NAME', ''),
    api_key=environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=environ.get('CLOUDINARY_API_SECRET', ''),
    secure=True
)

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

######################################################################
# Celery Configuration
######################################################################
CELERY_BROKER_URL = environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'refresh-social-media-tokens': {
        'task': 'api.tasks.refresh_expired_tokens',
        'schedule': 3600.0,  # Every hour
    },
    'process-scheduled-posts': {
        'task': 'api.tasks.process_scheduled_posts',
        'schedule': 300.0,  # Every 5 minutes
    },
}

######################################################################
# Email Configuration
######################################################################
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = environ.get('DEFAULT_FROM_EMAIL', 'noreply@govara.com')

######################################################################
# Logging Configuration
######################################################################
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'api.services.webhook_handlers': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'api.services.stripe_service': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'api.services.integrations.meta_service': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'api.services.integrations.linkedin_service': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

######################################################################
# Stripe Configuration
######################################################################
STRIPE_PUBLISHABLE_KEY = environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_SECRET_KEY = environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = environ.get("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL=environ.get("FRONTEND_URL", "http://localhost:3000")

######################################################################
# Meta Integration Configuration
######################################################################
FACEBOOK_APP_ID = environ.get("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = environ.get("FACEBOOK_APP_SECRET", "")
META_REDIRECT_URI = environ.get("META_REDIRECT_URI", f"{environ.get('BACKEND_URL', 'http://localhost:8000')}/api/integrations/meta/callback/")

######################################################################
# Pinterest Integration Configuration
######################################################################
PINTEREST_APP_ID = environ.get("PINTEREST_APP_ID", "")
PINTEREST_APP_SECRET = environ.get("PINTEREST_APP_SECRET", "")
PINTEREST_REDIRECT_URI = environ.get("PINTEREST_REDIRECT_URI", f"{environ.get('BACKEND_URL', 'http://localhost:8000')}/api/integrations/pinterest/callback/")

######################################################################
# LinkedIn Integration Configuration
######################################################################
LINKEDIN_CLIENT_ID = environ.get("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = environ.get("LINKEDIN_CLIENT_SECRET", "")
LINKEDIN_REDIRECT_URI = environ.get("LINKEDIN_REDIRECT_URI", f"{environ.get('BACKEND_URL', 'http://localhost:8000')}/api/integrations/linkedin/callback/")

######################################################################
# OPENAI
######################################################################
OPENAI_API_KEY = environ.get("OPENAI_API_KEY", "")

######################################################################
# Unfold
######################################################################
UNFOLD = {
    "SITE_HEADER": _("Elevate Admin"),
    "SITE_TITLE": _("Elevate Admin"),
    "DASHBOARD_CALLBACK": "api.views.dashboard_callback",
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": _("User Management"),
                "separator": True,
                "items": [
                    {
                        "title": _("Users"),
                        "icon": "person",
                        "link": reverse_lazy("admin:api_user_changelist"),
                    },
                    {
                        "title": _("Groups"),
                        "icon": "group",
                        "link": reverse_lazy("admin:auth_group_changelist"),
                    },
                    {
                        "title": _("User Profiles"),
                        "icon": "account_circle",
                        "link": reverse_lazy("admin:api_userprofile_changelist"),
                    },
                ],
            },
            {
                "title": _("Profile Components"),
                "separator": True,
                "items": [
                    {
                        "title": _("User Social Links"),
                        "icon": "public",
                        "link": reverse_lazy("admin:api_usersociallinks_changelist"),
                    },
                    {
                        "title": _("Social Icons"),
                        "icon": "share",
                        "link": reverse_lazy("admin:api_socialicon_changelist"),
                    },
                    {
                        "title": _("Custom Links"),
                        "icon": "link",
                        "link": reverse_lazy("admin:api_customlink_changelist"),
                    },
                    {
                        "title": _("CTA Banners"),
                        "icon": "campaign",
                        "link": reverse_lazy("admin:api_ctabanner_changelist"),
                    },
                ],
            },
            {
                "title": _("Social Media"),
                "separator": True,
                "items": [
                    {
                        "title": _("Platforms"),
                        "icon": "apps",
                        "link": reverse_lazy("admin:api_socialmediaplatform_changelist"),
                    },
                    {
                        "title": _("Connections"),
                        "icon": "cable",
                        "link": reverse_lazy("admin:api_socialmediaconnection_changelist"),
                    },
                    {
                        "title": _("Posts"),
                        "icon": "post_add",
                        "link": reverse_lazy("admin:api_socialmediapost_changelist"),
                    },
                    {
                        "title": _("Post Templates"),
                        "icon": "description",
                        "link": reverse_lazy("admin:api_socialmediaposttemplate_changelist"),
                    },
                ],
            },
            {
                "title": _("AI & Automation"),
                "separator": True,
                "items": [
                    {
                        "title": _("AI Configuration"),
                        "icon": "settings_suggest",
                        "link": reverse_lazy("admin:api_aiconfiguration_changelist"),
                    },
                ],
            },
            {
                "title": _("Billing & Payments"),
                "separator": True,
                "items": [
                    {
                        "title": _("Plans"),
                        "icon": "payment",
                        "link": reverse_lazy("admin:api_plan_changelist"),
                    },
                    {
                        "title": _("Plan Features"),
                        "icon": "featured_play_list",
                        "link": reverse_lazy("admin:api_planfeature_changelist"),
                    },
                    {
                        "title": _("Subscriptions"),
                        "icon": "credit_card",
                        "link": reverse_lazy("admin:api_subscription_changelist"),
                    },
                    {
                        "title": _("Stripe Customers"),
                        "icon": "person_outline",
                        "link": reverse_lazy("admin:api_stripecustomer_changelist"),
                    },
                    {
                        "title": _("Payment Events"),
                        "icon": "receipt",
                        "link": reverse_lazy("admin:api_paymentevent_changelist"),
                    },
                ],
            },
            {
                "title": _("Analytics"),
                "separator": True,
                "items": [
                    {
                        "title": _("Profile Views"),
                        "icon": "visibility",
                        "link": reverse_lazy("admin:api_profileview_changelist"),
                    },
                    {
                        "title": _("Link Clicks"),
                        "icon": "mouse",
                        "link": reverse_lazy("admin:api_linkclick_changelist"),
                    },
                    {
                        "title": _("Banner Clicks"),
                        "icon": "ads_click",
                        "link": reverse_lazy("admin:api_bannerclick_changelist"),
                    },
                ],
            },
            {
                "title": _("Message Automation"),
                "separator": True,
                "items": [
                    {
                        "title": _("Comments"),
                        "icon": "comment",
                        "link": reverse_lazy("admin:api_comment_changelist"),
                    },
                    {
                        "title": _("Direct Messages"),
                        "icon": "message",
                        "link": reverse_lazy("admin:api_directmessage_changelist"),
                    },
                    {
                        "title": _("Automation Rules"),
                        "icon": "auto_awesome",
                        "link": reverse_lazy("admin:api_automationrule_changelist"),
                    },
                    {
                        "title": _("Automation Settings"),
                        "icon": "settings",
                        "link": reverse_lazy("admin:api_automationsettings_changelist"),
                    },
                    {
                        "title": _("Comment Replies"),
                        "icon": "reply",
                        "link": reverse_lazy("admin:api_commentreply_changelist"),
                    },
                    {
                        "title": _("DM Replies"),
                        "icon": "reply_all",
                        "link": reverse_lazy("admin:api_directmessagereply_changelist"),
                    },
                ],
            },
            {
                "title": _("Media Library"),
                "separator": True,
                "items": [
                    {
                        "title": _("Folders"),
                        "icon": "folder",
                        "link": reverse_lazy("admin:api_folder_changelist"),
                    },
                    {
                        "title": _("Media Files"),
                        "icon": "photo",
                        "link": reverse_lazy("admin:api_media_changelist"),
                    },
                ],
            },
        ],
    },
}
