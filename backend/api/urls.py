from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .api import (
    UserViewSet, UserProfileViewSet, 
    SocialMediaPlatformViewSet, SocialMediaConnectionViewSet, 
    SocialMediaPostViewSet, SocialMediaPostTemplateViewSet
)

router = routers.DefaultRouter()
router.register("users", UserViewSet, basename="api-users")
router.register("profiles", UserProfileViewSet, basename="api-profiles")
router.register("social-platforms", SocialMediaPlatformViewSet, basename="api-social-platforms")
router.register("social-connections", SocialMediaConnectionViewSet, basename="api-social-connections")
router.register("social-posts", SocialMediaPostViewSet, basename="api-social-posts")
router.register("social-templates", SocialMediaPostTemplateViewSet, basename="api-social-templates")


urlpatterns = [
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
    ),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/", include(router.urls)),
    
    # Authentication URLs
    path("api/auth/register/", UserViewSet.as_view({'post': 'create'}), name="auth_register"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="auth_login"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", UserViewSet.as_view({'get': 'me', 'put': 'me', 'patch': 'me'}), name="auth_me"),
    path("api/auth/change-password/", UserViewSet.as_view({'post': 'change_password'}), name="auth_change_password"),
    
    # Social Media OAuth URLs
    path("api/social/oauth/callback/", SocialMediaConnectionViewSet.as_view({'post': 'oauth_callback'}), name="social_oauth_callback"),
    path("api/social/posts/post-now/", SocialMediaPostViewSet.as_view({'post': 'post_now'}), name="social_post_now"),
    
    # Legacy JWT URLs (for compatibility)
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    path("admin/", admin.site.urls),
    

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
