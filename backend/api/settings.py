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

######################################################################
# CORS Configuration
######################################################################
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://elevate.social",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins in development

WSGI_APPLICATION = "api.wsgi.application"

ROOT_URLCONF = "api.urls"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

######################################################################
# Apps
######################################################################
INSTALLED_APPS = [
    "unfold.contrib.import_export",  # Must be before unfold
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "cloudinary_storage",
    "cloudinary",
    "rest_framework",
    "tinymce",
    "rest_framework_simplejwt",
    "rest_framework.authtoken",
    "drf_spectacular",
    "django_celery_beat",
    "import_export",
    "corsheaders",
    # Django Allauth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "api",
]

######################################################################
# Middleware
######################################################################
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
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
        "PORT": environ.get("DATABASE_PORT", "5432"),
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
    'send-freebie-followup-emails': {
        'task': 'api.tasks.send_scheduled_followup_emails',
        'schedule': 300.0,  # Every 5 minutes
    },
    'send-optin-followup-emails': {
        'task': 'api.tasks.send_scheduled_optin_emails',
        'schedule': 300.0,  # Every 5 minutes
    },
    'sync-gmail-accounts': {
        'task': 'api.tasks.sync_all_email_accounts',
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
DEFAULT_FROM_EMAIL = environ.get('DEFAULT_FROM_EMAIL', '')

# Resend API Configuration
RESEND_API_KEY = environ.get('RESEND_API_KEY', '')

# Gmail Integration Configuration (for user email management)
GOOGLE_EMAIL_CLIENT_ID = environ.get('GOOGLE_EMAIL_CLIENT_ID', '')
GOOGLE_EMAIL_CLIENT_SECRET = environ.get('GOOGLE_EMAIL_CLIENT_SECRET', '')
GOOGLE_EMAIL_REDIRECT_URI = environ.get('GOOGLE_EMAIL_REDIRECT_URI', f"{environ.get('BACKEND_URL', 'http://localhost:8000')}/api/email/callback/google/")

# Email Token Encryption Key (must be 32 url-safe base64-encoded bytes)
EMAIL_ENCRYPTION_KEY = environ.get('EMAIL_ENCRYPTION_KEY', '')

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
STRIPE_CONNECT_WEBHOOK_SECRET = environ.get("STRIPE_CONNECT_WEBHOOK_SECRET", "")
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
# Django Allauth & Google OAuth Configuration
######################################################################
SITE_ID = 1

# Django Allauth Settings
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'optional'
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_USER_MODEL_USERNAME_FIELD = None

# Social Account Settings
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_LOGIN_ON_GET = True

# Google OAuth Configuration
GOOGLE_OAUTH2_CLIENT_ID = environ.get("GOOGLE_OAUTH2_CLIENT_ID", "")
GOOGLE_OAUTH2_CLIENT_SECRET = environ.get("GOOGLE_OAUTH2_CLIENT_SECRET", "")

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'OAUTH_PKCE_ENABLED': True,
        'VERIFIED_EMAIL': True,
        'APP': {
            'client_id': GOOGLE_OAUTH2_CLIENT_ID,
            'secret': GOOGLE_OAUTH2_CLIENT_SECRET,
            'key': ''
        }
    }
}

# JWT Authentication for custom Google OAuth endpoint
# We're using our custom implementation instead of dj-rest-auth

######################################################################
# TinyMCE Configuration
######################################################################
TINYMCE_DEFAULT_CONFIG = {
    "theme": "silver",
    "height": 300,
    "menubar": False,
    "plugins": "advlist,autolink,lists,link,image,charmap,preview,anchor,"
    "searchreplace,visualblocks,code,fullscreen,insertdatetime,media,table,paste,"
    "code,help,wordcount",
    "toolbar": "undo redo | formatselect | "
    "bold italic backcolor | alignleft aligncenter "
    "alignright alignjustify | bullist numlist outdent indent | "
    "removeformat | help",
    "content_css": "//www.tiny.cloud/css/codepen.min.css"
}

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
                    {
                        "title": _("User Permissions"),
                        "icon": "security",
                        "link": reverse_lazy("admin:api_userpermissions_changelist"),
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
                        "title": _("Custom Link Templates"),
                        "icon": "dashboard_customize",
                        "link": reverse_lazy("admin:api_customlinktemplate_changelist"),
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
                    {
                        "title": _("Collect Info Fields"),
                        "icon": "input",
                        "link": reverse_lazy("admin:api_collectinfofield_changelist"),
                    },
                    {
                        "title": _("Collect Info Responses"),
                        "icon": "feedback",
                        "link": reverse_lazy("admin:api_collectinforesponse_changelist"),
                    },
                    {
                        "title": _("Orders"),
                        "icon": "shopping_cart",
                        "link": reverse_lazy("admin:api_order_changelist"),
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
                    {
                        "title": _("Milo Prompts"),
                        "icon": "smart_toy",
                        "link": reverse_lazy("admin:api_miloprompt_changelist"),
                    },
                    {
                        "title": _("Freebie Email Templates"),
                        "icon": "email",
                        "link": reverse_lazy("admin:api_freebiefollowupemail_changelist"),
                    },
                    {
                        "title": _("Opt-in Email Templates"),
                        "icon": "email",
                        "link": reverse_lazy("admin:api_optinfollowupemail_changelist"),
                    },
                    {
                        "title": _("Scheduled Freebie Emails"),
                        "icon": "schedule_send",
                        "link": reverse_lazy("admin:api_scheduledfollowupemail_changelist"),
                    },
                    {
                        "title": _("Scheduled Opt-in Emails"),
                        "icon": "schedule_send",
                        "link": reverse_lazy("admin:api_scheduledoptinemail_changelist"),
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
                    {
                        "title": _("Connect Accounts"),
                        "icon": "account_balance",
                        "link": reverse_lazy("admin:api_stripeconnectaccount_changelist"),
                    },
                    {
                        "title": _("Payment Transactions"),
                        "icon": "swap_horiz",
                        "link": reverse_lazy("admin:api_paymenttransaction_changelist"),
                    },
                    {
                        "title": _("Connect Webhook Events"),
                        "icon": "webhook",
                        "link": reverse_lazy("admin:api_connectwebhookevent_changelist"),
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
            {
                "title": _("Email Integration"),
                "separator": True,
                "items": [
                    {
                        "title": _("Email Accounts"),
                        "icon": "alternate_email",
                        "link": reverse_lazy("admin:api_emailaccount_changelist"),
                    },
                    {
                        "title": _("Email Messages"),
                        "icon": "mail",
                        "link": reverse_lazy("admin:api_emailmessage_changelist"),
                    },
                    {
                        "title": _("Email Attachments"),
                        "icon": "attach_file",
                        "link": reverse_lazy("admin:api_emailattachment_changelist"),
                    },
                    {
                        "title": _("Email Drafts"),
                        "icon": "drafts",
                        "link": reverse_lazy("admin:api_emaildraft_changelist"),
                    },
                ],
            },
            {
                "title": _("System"),
                "separator": True,
                "items": [
                    {
                        "title": _("Iframe Menu Items"),
                        "icon": "menu",
                        "link": reverse_lazy("admin:api_iframemenuitem_changelist"),
                    },
                ],
            },
        ],
    },
}
