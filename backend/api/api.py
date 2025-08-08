from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta

from .models import UserProfile, SocialMediaPlatform, SocialMediaConnection, SocialMediaPost, SocialMediaPostTemplate
from .serializers import (
    UserChangePasswordErrorSerializer,
    UserChangePasswordSerializer,
    UserCreateErrorSerializer,
    UserCreateSerializer,
    UserCurrentErrorSerializer,
    UserCurrentSerializer,
    UserProfileSerializer,
    UserProfilePublicSerializer,
    SocialMediaPlatformSerializer,
    SocialMediaConnectionSerializer,
    SocialMediaConnectionCreateSerializer,
    SocialMediaPostSerializer,
    SocialMediaPostCreateSerializer,
    SocialMediaPostTemplateSerializer,
)
from .services.factory import SocialMediaServiceFactory
from .utils import encrypt_token

User = get_user_model()


class UserViewSet(
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all()
    serializer_class = UserCurrentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(pk=self.request.user.pk)

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]

        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        elif self.action == "me":
            return UserCurrentSerializer
        elif self.action == "change_password":
            return UserChangePasswordSerializer

        return super().get_serializer_class()

    @extend_schema(
        responses={
            200: UserCreateSerializer,
            400: UserCreateErrorSerializer,
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        responses={
            200: UserCurrentSerializer,
            400: UserCurrentErrorSerializer,
        }
    )
    @action(["get", "put", "patch"], detail=False)
    def me(self, request, *args, **kwargs):
        if request.method == "GET":
            serializer = self.get_serializer(self.request.user)
            return Response(serializer.data)
        elif request.method == "PUT":
            serializer = self.get_serializer(
                self.request.user, data=request.data, partial=False
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        elif request.method == "PATCH":
            serializer = self.get_serializer(
                self.request.user, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @extend_schema(
        responses={
            204: None,
            400: UserChangePasswordErrorSerializer,
        }
    )
    @action(["post"], url_path="change-password", detail=False)
    def change_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.request.user.set_password(serializer.data["password_new"])
        self.request.user.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(["delete"], url_path="delete-account", detail=False)
    def delete_account(self, request, *args, **kwargs):
        self.request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def get_permissions(self):
        if self.action == "retrieve" and self.lookup_field == 'slug':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "retrieve" and self.lookup_field == 'slug':
            return UserProfilePublicSerializer
        return UserProfileSerializer

    @extend_schema(
        responses={
            200: UserProfilePublicSerializer,
            404: None,
        }
    )
    def retrieve(self, request, *args, **kwargs):
        # For public access by slug
        if self.lookup_field == 'slug':
            profile = get_object_or_404(UserProfile, slug=kwargs['slug'], is_active=True)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return super().retrieve(request, *args, **kwargs)


class SocialMediaPlatformViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for social media platforms"""
    queryset = SocialMediaPlatform.objects.filter(is_active=True)
    serializer_class = SocialMediaPlatformSerializer
    permission_classes = [IsAuthenticated]


class SocialMediaConnectionViewSet(viewsets.ModelViewSet):
    """ViewSet for social media connections"""
    serializer_class = SocialMediaConnectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SocialMediaConnection.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SocialMediaConnectionCreateSerializer
        return SocialMediaConnectionSerializer
    
    @extend_schema(
        responses={
            200: SocialMediaConnectionSerializer,
            400: None,
        }
    )
    @action(['post'], detail=False)
    def oauth_callback(self, request):
        """Handle OAuth callback from social media platforms"""
        platform_name = request.data.get('platform')
        authorization_code = request.data.get('code')
        state = request.data.get('state')
        
        if not platform_name or not authorization_code:
            return Response(
                {'error': 'Platform name and authorization code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get platform
            platform = SocialMediaPlatform.objects.get(name=platform_name, is_active=True)
        except SocialMediaPlatform.DoesNotExist:
            return Response(
                {'error': f'Platform {platform_name} is not supported'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Exchange authorization code for tokens
            # This is a simplified implementation
            # In a real implementation, you would make the OAuth token exchange request
            
            # For now, we'll create a placeholder connection
            connection, created = SocialMediaConnection.objects.get_or_create(
                user=request.user,
                platform=platform,
                defaults={
                    'access_token': encrypt_token('placeholder_token'),
                    'refresh_token': encrypt_token('placeholder_refresh_token'),
                    'expires_at': timezone.now() + timedelta(hours=1),
                }
            )
            
            # Get user info from platform
            service = SocialMediaServiceFactory.get_service(platform_name, connection)
            user_info = service.get_user_info()
            
            if user_info:
                connection.is_verified = True
                connection.save()
            
            serializer = self.get_serializer(connection)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'OAuth callback failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        responses={
            200: None,
            400: None,
        }
    )
    @action(['post'], detail=True)
    def refresh_token(self, request, pk=None):
        """Refresh access token for a connection"""
        connection = self.get_object()
        
        try:
            service = SocialMediaServiceFactory.get_service(connection.platform.name, connection)
            success = service.refresh_access_token()
            
            if success:
                return Response({'message': 'Token refreshed successfully'})
            else:
                return Response(
                    {'error': 'Failed to refresh token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': f'Token refresh failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        responses={
            200: None,
            400: None,
        }
    )
    @action(['post'], detail=True)
    def validate(self, request, pk=None):
        """Validate a connection"""
        connection = self.get_object()
        
        try:
            service = SocialMediaServiceFactory.get_service(connection.platform.name, connection)
            is_valid = service.validate_connection()
            
            if is_valid:
                connection.is_verified = True
                connection.last_error = ""
                connection.save()
                return Response({'message': 'Connection is valid'})
            else:
                connection.is_verified = False
                connection.save()
                return Response(
                    {'error': 'Connection is invalid'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            connection.is_verified = False
            connection.last_error = str(e)
            connection.save()
            return Response(
                {'error': f'Validation failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class SocialMediaPostViewSet(viewsets.ModelViewSet):
    """ViewSet for social media posts"""
    serializer_class = SocialMediaPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SocialMediaPost.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SocialMediaPostCreateSerializer
        return SocialMediaPostSerializer
    
    @extend_schema(
        responses={
            200: SocialMediaPostSerializer,
            400: None,
        }
    )
    @action(['post'], detail=False)
    def post_now(self, request):
        """Post content immediately to connected platforms"""
        text = request.data.get('text')
        media_urls = request.data.get('media_urls', [])
        platform_names = request.data.get('platform_names', [])
        
        if not text:
            return Response(
                {'error': 'Text content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not platform_names:
            return Response(
                {'error': 'At least one platform must be specified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        
        for platform_name in platform_names:
            try:
                # Get user's connection for this platform
                connection = SocialMediaConnection.objects.get(
                    user=request.user,
                    platform__name=platform_name,
                    is_active=True,
                    is_verified=True
                )
                
                # Create service and post
                service = SocialMediaServiceFactory.get_service(platform_name, connection)
                result = service.post_content(text, media_urls)
                
                # Create post record
                post = SocialMediaPost.objects.create(
                    user=request.user,
                    connection=connection,
                    text=text,
                    media_urls=media_urls,
                    status='sent' if result.get('success') else 'failed',
                    platform_post_id=result.get('post_id', ''),
                    platform_post_url=result.get('post_url', ''),
                    error_message=result.get('error', ''),
                    sent_at=timezone.now() if result.get('success') else None
                )
                
                results.append({
                    'platform': platform_name,
                    'success': result.get('success', False),
                    'post_id': post.id,
                    'error': result.get('error', '')
                })
                
            except SocialMediaConnection.DoesNotExist:
                results.append({
                    'platform': platform_name,
                    'success': False,
                    'error': f'No active connection found for {platform_name}'
                })
            except Exception as e:
                results.append({
                    'platform': platform_name,
                    'success': False,
                    'error': str(e)
                })
        
        return Response({
            'results': results,
            'total_platforms': len(platform_names),
            'successful_posts': len([r for r in results if r['success']])
        })


class SocialMediaPostTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for social media post templates"""
    serializer_class = SocialMediaPostTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SocialMediaPostTemplate.objects.filter(user=self.request.user)
    
    @extend_schema(
        responses={
            200: SocialMediaPostSerializer,
            400: None,
        }
    )
    @action(['post'], detail=True)
    def use_template(self, request, pk=None):
        """Use a template to create and post content"""
        template = self.get_object()
        
        # Get template data
        text = template.text_template
        media_urls = template.media_urls
        platforms = [p.name for p in template.platforms.all()]
        
        if not platforms:
            return Response(
                {'error': 'Template has no platforms configured'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create post using the template
        post_data = {
            'text': text,
            'media_urls': media_urls,
            'platform_names': platforms
        }
        
        # Use the post_now action from SocialMediaPostViewSet
        post_viewset = SocialMediaPostViewSet()
        post_viewset.request = request
        post_viewset.action = 'post_now'
        
        return post_viewset.post_now(request)



