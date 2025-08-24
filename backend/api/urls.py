from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse
from django.views.generic import RedirectView

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({"status": "healthy"})

# Import storefront ViewSets
from .apis.storefront import (
    UserProfileStorefrontViewSet,
    CustomLinkViewSet,
    SocialIconViewSet,
    CTABannerViewSet,
)

from .apis.auth import (
    UserViewSet, UserProfileViewSet
)
from .apis.plans import PlanViewSet
from .apis.subscriptions import (
    CreateCheckoutSessionView,
    CreatePortalSessionView,
    StripeWebhookView,
    CurrentSubscriptionView,
    CancelSubscriptionView,
)
from .apis.integrations import (
    MetaAuthUrlView,
    MetaOAuthCallbackView,
    MetaConnectionsView,
    MetaPublishView,
    MetaDisconnectView,
    PlatformStatusView,
    PinterestAuthUrlView,
    PinterestOAuthCallbackView,
    PinterestConnectionsView,
    PinterestPublishView,
    PinterestDisconnectView,
    LinkedInAuthUrlView,
    LinkedInOAuthCallbackView,
    LinkedInConnectionsView,
    LinkedInPublishView,
    LinkedInDisconnectView,
)
from .apis.openai import OpenAIViewSet
from .apis.posts import (
    PostListCreateView,
    PostDetailView,
    bulk_create_posts,
    update_post_status,
    duplicate_post,
    get_post_stats,
    get_scheduled_posts,
    publish_now,
)
from .apis.media import (
    FolderListCreateAPIView,
    FolderDetailAPIView,
    MediaListCreateAPIView,
    MediaDetailAPIView,
    bulk_delete_media,
    media_stats,
    move_media_to_folder,
)
from .apis.webhooks import FacebookWebhookView
from .apis.comments import (
    subscribe_page_webhooks,
    get_post_comments,
    reply_to_comment,
    list_facebook_pages,
)

router = routers.DefaultRouter()
router.register("users", UserViewSet, basename="api-users")
router.register("profiles", UserProfileViewSet, basename="api-profiles")
router.register("plans", PlanViewSet, basename="api-plans")
router.register("ai", OpenAIViewSet, basename="api-ai")

# Storefront API endpoints
router.register("storefront/profiles", UserProfileStorefrontViewSet, basename="storefront-profiles")
router.register("storefront/links", CustomLinkViewSet, basename="storefront-links")
router.register("storefront/social-icons", SocialIconViewSet, basename="storefront-social-icons")
router.register("storefront/cta-banners", CTABannerViewSet, basename="storefront-cta-banners")

urlpatterns = [
    path("", RedirectView.as_view(url="/admin/", permanent=True), name="root_redirect"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
    ),
    path("health/", health_check, name="health_check"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/", include(router.urls)),
    
    # Authentication URLs
    path("api/auth/register/", UserViewSet.as_view({'post': 'create'}), name="auth_register"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="auth_login"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", UserViewSet.as_view({'get': 'me', 'put': 'me', 'patch': 'me'}), name="auth_me"),
    path("api/auth/change-password/", UserViewSet.as_view({'post': 'change_password'}), name="auth_change_password"),
    path("api/auth/check-username/", UserViewSet.as_view({'post': 'check_username'}), name="auth_check_username"),
    
    # Legacy JWT URLs (for compatibility)
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Subscription URLs
    path("api/subscriptions/create-checkout/", CreateCheckoutSessionView.as_view(), name="create_checkout_session"),
    path("api/subscriptions/create-portal/", CreatePortalSessionView.as_view(), name="create_portal_session"),
    path("api/subscriptions/current/", CurrentSubscriptionView.as_view(), name="current_subscription"),
    path("api/subscriptions/cancel/", CancelSubscriptionView.as_view(), name="cancel_subscription"),
    
    # Webhook URLs
    path("api/webhooks/stripe/", StripeWebhookView.as_view(), name="stripe_webhook"),
    path("api/webhooks/facebook/", FacebookWebhookView.as_view(), name="facebook_webhook"),
    
    # Meta Integration URLs
    path("api/integrations/meta/auth/", MetaAuthUrlView.as_view(), name="meta_auth_url"),
    path("api/integrations/meta/callback/", MetaOAuthCallbackView.as_view(), name="meta_oauth_callback"),
    path("api/integrations/meta/connections/", MetaConnectionsView.as_view(), name="meta_connections"),
    path("api/integrations/meta/publish/", MetaPublishView.as_view(), name="meta_publish"),
    path("api/integrations/meta/disconnect/<int:connection_id>/", MetaDisconnectView.as_view(), name="meta_disconnect"),
    
    # Pinterest Integration URLs
    path("api/integrations/pinterest/auth/", PinterestAuthUrlView.as_view(), name="pinterest_auth_url"),
    path("api/integrations/pinterest/callback/", PinterestOAuthCallbackView.as_view(), name="pinterest_oauth_callback"),
    path("api/integrations/pinterest/connections/", PinterestConnectionsView.as_view(), name="pinterest_connections"),
    path("api/integrations/pinterest/publish/", PinterestPublishView.as_view(), name="pinterest_publish"),
    path("api/integrations/pinterest/disconnect/<int:connection_id>/", PinterestDisconnectView.as_view(), name="pinterest_disconnect"),
    
    # LinkedIn Integration URLs
    path("api/integrations/linkedin/auth/", LinkedInAuthUrlView.as_view(), name="linkedin_auth_url"),
    path("api/integrations/linkedin/callback/", LinkedInOAuthCallbackView.as_view(), name="linkedin_oauth_callback"),
    path("api/integrations/linkedin/connections/", LinkedInConnectionsView.as_view(), name="linkedin_connections"),
    path("api/integrations/linkedin/publish/", LinkedInPublishView.as_view(), name="linkedin_publish"),
    path("api/integrations/linkedin/disconnect/<int:connection_id>/", LinkedInDisconnectView.as_view(), name="linkedin_disconnect"),
    
    # Platform Status URL
    path("api/integrations/platforms/status/", PlatformStatusView.as_view(), name="platform_status"),
    
    # OpenAI/AI URLs
    path("api/ai/generate-text/", OpenAIViewSet.as_view({'post': 'generate_text'}), name="ai_generate_text"),
    path("api/ai/generate-text-stream/", OpenAIViewSet.as_view({'post': 'generate_streaming_text'}), name="ai_generate_text_stream"),
    path("api/ai/generate-image/", OpenAIViewSet.as_view({'post': 'generate_image'}), name="ai_generate_image"),
    path("api/ai/analyze-image/", OpenAIViewSet.as_view({'post': 'analyze_image'}), name="ai_analyze_image"),
    path("api/ai/generate-social-content/", OpenAIViewSet.as_view({'post': 'generate_social_content'}), name="ai_generate_social_content"),
    path("api/ai/improve-content/", OpenAIViewSet.as_view({'post': 'improve_content'}), name="ai_improve_content"),
    
    # Posts Management URLs
    path("api/posts/", PostListCreateView.as_view(), name="posts_list_create"),
    path("api/posts/<int:pk>/", PostDetailView.as_view(), name="posts_detail"),
    path("api/posts/bulk-create/", bulk_create_posts, name="posts_bulk_create"),
    path("api/posts/<int:post_id>/status/", update_post_status, name="posts_update_status"),
    path("api/posts/<int:post_id>/duplicate/", duplicate_post, name="posts_duplicate"),
    path("api/posts/<int:post_id>/publish/", publish_now, name="posts_publish_now"),
    path("api/posts/stats/", get_post_stats, name="posts_stats"),
    path("api/posts/scheduled/", get_scheduled_posts, name="posts_scheduled"),
    
    # Media Management URLs
    path("api/media/folders/", FolderListCreateAPIView.as_view(), name="media_folders_list_create"),
    path("api/media/folders/<int:pk>/", FolderDetailAPIView.as_view(), name="media_folders_detail"),
    path("api/media/", MediaListCreateAPIView.as_view(), name="media_list_create"),
    path("api/media/<int:pk>/", MediaDetailAPIView.as_view(), name="media_detail"),
    path("api/media/bulk-delete/", bulk_delete_media, name="media_bulk_delete"),
    path("api/media/stats/", media_stats, name="media_stats"),
    path("api/media/move/", move_media_to_folder, name="media_move_to_folder"),
    
    # Comment Management URLs
    path("api/comments/pages/", list_facebook_pages, name="comments_facebook_pages"),
    path("api/comments/subscribe-webhooks/", subscribe_page_webhooks, name="comments_subscribe_webhooks"),
    path("api/comments/", get_post_comments, name="comments_get_post_comments"),
    path("api/comments/reply/", reply_to_comment, name="comments_reply"),
    
    path("admin/", admin.site.urls),
    

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
