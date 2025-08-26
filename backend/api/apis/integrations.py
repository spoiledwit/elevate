"""
Social Media Integration API Views

Handles OAuth connections and content publishing for various social media platforms.
"""
import logging
from django.utils import timezone
from django.shortcuts import redirect
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from ..models import SocialMediaConnection
from ..serializers import (
    MetaAuthUrlSerializer,
    MetaConnectionSerializer,
    MetaConnectionsListSerializer,
    MetaPublishPostSerializer,
    MetaPublishResponseSerializer,
    MetaDisconnectResponseSerializer,
    PinterestAuthUrlSerializer,
    PinterestConnectionSerializer,
    PinterestConnectionsListSerializer,
    PinterestPublishPostSerializer,
    PinterestPublishResponseSerializer,
    PinterestDisconnectResponseSerializer,
    LinkedInAuthUrlSerializer,
    LinkedInConnectionSerializer,
    LinkedInConnectionsListSerializer,
    LinkedInPublishPostSerializer,
    LinkedInPublishResponseSerializer,
    LinkedInDisconnectResponseSerializer
)
from ..services.integrations import MetaService
from ..services.integrations.pinterest_service import PinterestService
from ..services.integrations.linkedin_service import LinkedInService
from ..services.integrations.base import IntegrationError

logger = logging.getLogger(__name__)


class MetaAuthUrlView(APIView):
    """
    Get Meta OAuth authorization URL for connecting Facebook/Instagram accounts.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: MetaAuthUrlSerializer,
            500: {"description": "Internal server error"},
        },
        description="Generate OAuth authorization URL for connecting Facebook/Instagram accounts"
    )
    def get(self, request):
        try:
            meta_service = MetaService()
            
            # Generate state for CSRF protection
            state = f"user_{request.user.id}_{request.user.username}"
            auth_url = meta_service.get_auth_url(state=state)
            
            return Response({
                'auth_url': auth_url,
                'state': state
            })
            
        except Exception as e:
            logger.error(f"Error generating Meta auth URL: {e}")
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MetaOAuthCallbackView(APIView):
    """
    Handle Meta OAuth callback and create account connections.
    """
    permission_classes = []  # Allow unauthenticated access for OAuth callback
    
    @extend_schema(
        parameters=[
            {
                'name': 'code',
                'in': 'query',
                'description': 'OAuth authorization code',
                'required': False,
                'schema': {'type': 'string'}
            },
            {
                'name': 'state',
                'in': 'query', 
                'description': 'State parameter for CSRF protection',
                'required': False,
                'schema': {'type': 'string'}
            },
            {
                'name': 'error',
                'in': 'query',
                'description': 'Error code if authorization failed',
                'required': False,
                'schema': {'type': 'string'}
            }
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connections_created": {"type": "integer"},
                    "accounts": {"type": "array", "items": {"type": "object"}}
                }
            },
            400: {"description": "Bad request or authorization error"},
            500: {"description": "Internal server error"}
        },
        description="Process OAuth callback and create account connections"
    )
    def get(self, request):
        # PRINT EVERYTHING TO CONSOLE
        print("\n" + "="*80)
        print("FACEBOOK OAUTH CALLBACK - FULL REQUEST DEBUG")
        print("="*80)
        print(f"REQUEST METHOD: {request.method}")
        print(f"REQUEST PATH: {request.get_full_path()}")
        print(f"REQUEST URL: {request.build_absolute_uri()}")
        print("\n--- QUERY PARAMETERS ---")
        for key, value in request.GET.items():
            print(f"{key}: {value}")
        print("\n--- REQUEST HEADERS ---")
        for key, value in request.headers.items():
            print(f"{key}: {value}")
        print("\n--- REQUEST META ---")
        for key, value in request.META.items():
            if key.startswith(('HTTP_', 'REMOTE_', 'SERVER_')):
                print(f"{key}: {value}")
        print("="*80 + "\n")
        
        try:
            # Check for errors
            error = request.GET.get('error')
            if error:
                error_description = request.GET.get('error_description', 'Unknown error')
                logger.warning(f"Meta OAuth error: {error} - {error_description}")
                print(f"ERROR DETECTED: {error} - {error_description}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message={error_description}")
            
            # Get authorization code
            auth_code = request.GET.get('code')
            if not auth_code:
                print("ERROR: Missing authorization code")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Missing authorization code")
            
            # Verify state parameter and extract user info
            state = request.GET.get('state', '')
            if not state.startswith('user_'):
                logger.warning(f"Invalid state parameter format: {state}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Invalid state parameter")
            
            try:
                # Extract user ID from state: "user_123_username"
                state_parts = state.split('_', 2)  # Split into max 3 parts
                if len(state_parts) < 3:
                    raise ValueError("Invalid state format")
                
                user_id = int(state_parts[1])
                username = state_parts[2]
                
                # Get the user
                from ..models import User
                user = User.objects.get(id=user_id, username=username)
                
            except (ValueError, User.DoesNotExist) as e:
                logger.warning(f"Invalid state parameter or user not found: {state}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Invalid user information")
            
            # Connect the account
            print(f"\n--- CONNECTING ACCOUNT FOR USER: {user.username} (ID: {user.id}) ---")
            print(f"AUTH CODE: {auth_code[:20]}..." if len(auth_code) > 20 else auth_code)
            
            meta_service = MetaService()
            result = meta_service.connect_account(user, auth_code)
            
            print(f"\n--- CONNECTION RESULT ---")
            print(f"Success: {result.get('success')}")
            print(f"Connections created: {result.get('connections_created')}")
            print(f"Accounts: {result.get('accounts')}")
            
            # Redirect back to frontend with success
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            if result.get('success'):
                return redirect(f"{frontend_url}?connection=success&accounts={result.get('connections_created', 0)}")
            else:
                return redirect(f"{frontend_url}?connection=error")
            
        except IntegrationError as e:
            logger.error(f"Meta integration error: {e}")
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            return redirect(f"{frontend_url}?connection=error&message={str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in Meta callback: {e}")
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            return redirect(f"{frontend_url}?connection=error&message=Failed to connect account")


class MetaConnectionsView(APIView):
    """
    List user's Meta connections (Facebook/Instagram accounts).
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: MetaConnectionsListSerializer,
            500: {"description": "Internal server error"}
        },
        description="Get all connected Facebook/Instagram accounts for the current user"
    )
    def get(self, request):
        try:
            connections = SocialMediaConnection.objects.filter(
                user=request.user,
                platform__name__in=['facebook', 'instagram'],
                is_active=True
            ).select_related('platform')
            
            serializer = MetaConnectionSerializer(connections, many=True)
            
            return Response({'connections': serializer.data})
            
        except Exception as e:
            logger.error(f"Error listing Meta connections for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to list connections'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MetaPublishView(APIView):
    """
    Publish content to Facebook or Instagram.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=MetaPublishPostSerializer,
        responses={
            200: MetaPublishResponseSerializer,
            400: {"description": "Bad request"},
            404: {"description": "Connection not found"},
            500: {"description": "Internal server error"}
        },
        description="Publish content to Facebook or Instagram"
    )
    def post(self, request):
        serializer = MetaPublishPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            connection_id = serializer.validated_data['connection_id']
            content = serializer.validated_data['content']
            media_url = serializer.validated_data.get('media_url')
            
            # Get user's connection
            try:
                connection = SocialMediaConnection.objects.get(
                    id=connection_id,
                    user=request.user,
                    platform__name__in=['facebook', 'instagram'],
                    is_active=True
                )
            except SocialMediaConnection.DoesNotExist:
                return Response(
                    {'error': 'Connection not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Publish the post
            meta_service = MetaService()
            result = meta_service.publish_post(connection, content, media_url)
            
            # Update last used timestamp
            connection.last_used_at = timezone.now()
            connection.save(update_fields=['last_used_at'])
            
            return Response(result)
            
        except IntegrationError as e:
            logger.error(f"Meta publishing error for user {request.user.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error publishing to Meta for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to publish post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MetaDisconnectView(APIView):
    """
    Disconnect a Facebook or Instagram account.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: MetaDisconnectResponseSerializer,
            404: {"description": "Connection not found"},
            500: {"description": "Internal server error"}
        },
        description="Disconnect a Facebook or Instagram account"
    )
    def delete(self, request, connection_id):
        try:
            # Get user's connection
            try:
                connection = SocialMediaConnection.objects.get(
                    id=connection_id,
                    user=request.user,
                    platform__name__in=['facebook', 'instagram']
                )
            except SocialMediaConnection.DoesNotExist:
                return Response(
                    {'error': 'Connection not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Disconnect the account
            meta_service = MetaService()
            success = meta_service.disconnect_account(connection)
            
            if success:
                return Response({
                    'success': True,
                    'message': f'{connection.platform.display_name} account disconnected successfully'
                })
            else:
                return Response(
                    {'error': 'Failed to disconnect account'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Error disconnecting Meta account for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to disconnect account'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlatformStatusView(APIView):
    """
    Get user's connection status for all social media platforms.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: {
                "type": "object",
                "properties": {
                    "platforms": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "display_name": {"type": "string"},
                                "connected": {"type": "boolean"},
                                "connection_count": {"type": "integer"},
                                "connections": {
                                    "type": "array",
                                    "items": {"type": "object"}
                                }
                            }
                        }
                    }
                }
            },
            500: {"description": "Internal server error"}
        },
        description="Get connection status for all social media platforms for the current user"
    )
    def get(self, request):
        try:
            from ..models import SocialMediaPlatform
            
            # Get all active platforms
            all_platforms = SocialMediaPlatform.objects.filter(is_active=True)
            
            # Get user's connections
            user_connections = SocialMediaConnection.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('platform')
            
            # Build platform status
            platforms_status = []
            
            for platform in all_platforms:
                # Get connections for this platform
                platform_connections = [
                    conn for conn in user_connections 
                    if conn.platform_id == platform.id
                ]
                
                # Build connection details
                connections_data = []
                for conn in platform_connections:
                    connection_info = {
                        'id': conn.id,
                        'platform_username': conn.platform_username,
                        'platform_display_name': conn.platform_display_name,
                        'platform_profile_url': conn.platform_profile_url,
                        'is_verified': conn.is_verified,
                        'last_used_at': conn.last_used_at,
                        'created_at': conn.created_at
                    }
                    
                    # Add platform-specific data
                    if platform.name == 'facebook' and conn.facebook_page_id:
                        connection_info.update({
                            'facebook_page_id': conn.facebook_page_id,
                            'facebook_page_name': conn.facebook_page_name
                        })
                    elif platform.name == 'instagram' and conn.instagram_business_id:
                        connection_info.update({
                            'instagram_business_id': conn.instagram_business_id,
                            'instagram_username': conn.instagram_username
                        })
                    elif platform.name == 'pinterest' and conn.pinterest_user_id:
                        connection_info.update({
                            'pinterest_user_id': conn.pinterest_user_id
                        })
                    
                    connections_data.append(connection_info)
                
                platforms_status.append({
                    'name': platform.name,
                    'display_name': platform.display_name,
                    'connected': len(platform_connections) > 0,
                    'connection_count': len(platform_connections),
                    'connections': connections_data
                })
            
            return Response({'platforms': platforms_status})
            
        except Exception as e:
            logger.error(f"Error getting platform status for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to get platform status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Pinterest API Views

class PinterestAuthUrlView(APIView):
    """
    Get Pinterest OAuth authorization URL for connecting Pinterest accounts.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: PinterestAuthUrlSerializer,
            500: {"description": "Internal server error"},
        },
        description="Generate OAuth authorization URL for connecting Pinterest accounts"
    )
    def get(self, request):
        try:
            pinterest_service = PinterestService()
            
            # Generate state for CSRF protection
            state = f"user_{request.user.id}_{request.user.username}"
            auth_url = pinterest_service.get_auth_url(state=state)
            
            return Response({
                'auth_url': auth_url,
                'state': state
            })
            
        except Exception as e:
            logger.error(f"Error generating Pinterest auth URL: {e}")
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PinterestOAuthCallbackView(APIView):
    """
    Handle Pinterest OAuth callback and create account connections.
    """
    permission_classes = []  # Allow unauthenticated access for OAuth callback
    
    @extend_schema(
        parameters=[
            {
                'name': 'code',
                'in': 'query',
                'description': 'OAuth authorization code',
                'required': False,
                'schema': {'type': 'string'}
            },
            {
                'name': 'state',
                'in': 'query', 
                'description': 'State parameter for CSRF protection',
                'required': False,
                'schema': {'type': 'string'}
            },
            {
                'name': 'error',
                'in': 'query',
                'description': 'Error code if authorization failed',
                'required': False,
                'schema': {'type': 'string'}
            }
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connections_created": {"type": "integer"},
                    "accounts": {"type": "array", "items": {"type": "object"}}
                }
            },
            400: {"description": "Bad request or authorization error"},
            500: {"description": "Internal server error"}
        },
        description="Process OAuth callback and create account connections"
    )
    def get(self, request):
        try:
            # Check for errors
            error = request.GET.get('error')
            if error:
                error_description = request.GET.get('error_description', 'Unknown error')
                logger.warning(f"Pinterest OAuth error: {error} - {error_description}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message={error_description}")
            
            # Get authorization code
            auth_code = request.GET.get('code')
            if not auth_code:
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Missing authorization code")
            
            # Verify state parameter and extract user info
            state = request.GET.get('state', '')
            if not state.startswith('user_'):
                logger.warning(f"Invalid state parameter format: {state}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Invalid state parameter")
            
            try:
                # Extract user ID from state: "user_123_username"
                state_parts = state.split('_', 2)  # Split into max 3 parts
                if len(state_parts) < 3:
                    raise ValueError("Invalid state format")
                
                user_id = int(state_parts[1])
                username = state_parts[2]
                
                # Get the user
                from ..models import User
                user = User.objects.get(id=user_id, username=username)
                
            except (ValueError, User.DoesNotExist) as e:
                logger.warning(f"Invalid state parameter or user not found: {state}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Invalid user information")
            
            # Connect the account
            pinterest_service = PinterestService()
            result = pinterest_service.connect_account(user, auth_code)
            
            # Redirect back to frontend with success
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            if result.get('success'):
                return redirect(f"{frontend_url}?connection=success&accounts={result.get('connections_created', 0)}")
            else:
                return redirect(f"{frontend_url}?connection=error")
            
        except IntegrationError as e:
            logger.error(f"Pinterest integration error: {e}")
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            return redirect(f"{frontend_url}?connection=error&message={str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in Pinterest callback: {e}")
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            return redirect(f"{frontend_url}?connection=error&message=Failed to connect account")


class PinterestConnectionsView(APIView):
    """
    List user's Pinterest connections.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: PinterestConnectionsListSerializer,
            500: {"description": "Internal server error"}
        },
        description="Get all connected Pinterest accounts for the current user"
    )
    def get(self, request):
        try:
            connections = SocialMediaConnection.objects.filter(
                user=request.user,
                platform__name='pinterest',
                is_active=True
            ).select_related('platform')
            
            serializer = PinterestConnectionSerializer(connections, many=True)
            
            return Response({'connections': serializer.data})
            
        except Exception as e:
            logger.error(f"Error listing Pinterest connections for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to list connections'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PinterestPublishView(APIView):
    """
    Create a pin on Pinterest.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=PinterestPublishPostSerializer,
        responses={
            200: PinterestPublishResponseSerializer,
            400: {"description": "Bad request"},
            404: {"description": "Connection not found"},
            500: {"description": "Internal server error"}
        },
        description="Create a pin on Pinterest"
    )
    def post(self, request):
        serializer = PinterestPublishPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            connection_id = serializer.validated_data['connection_id']
            board_id = serializer.validated_data['board_id']
            description = serializer.validated_data['description']
            media_url = serializer.validated_data['media_url']
            
            # Optional fields
            title = serializer.validated_data.get('title', '')
            link = serializer.validated_data.get('link', '')
            alt_text = serializer.validated_data.get('alt_text', '')
            
            # Get user's connection
            try:
                connection = SocialMediaConnection.objects.get(
                    id=connection_id,
                    user=request.user,
                    platform__name='pinterest',
                    is_active=True
                )
            except SocialMediaConnection.DoesNotExist:
                return Response(
                    {'error': 'Connection not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create the pin
            pinterest_service = PinterestService()
            result = pinterest_service.publish_post(
                connection, 
                description, 
                media_url, 
                board_id,
                title=title,
                link=link,
                alt_text=alt_text
            )
            
            # Update last used timestamp
            connection.last_used_at = timezone.now()
            connection.save(update_fields=['last_used_at'])
            
            return Response(result)
            
        except IntegrationError as e:
            logger.error(f"Pinterest publishing error for user {request.user.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error publishing to Pinterest for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to create pin'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PinterestDisconnectView(APIView):
    """
    Disconnect a Pinterest account.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: PinterestDisconnectResponseSerializer,
            404: {"description": "Connection not found"},
            500: {"description": "Internal server error"}
        },
        description="Disconnect a Pinterest account"
    )
    def delete(self, request, connection_id):
        try:
            # Get user's connection
            try:
                connection = SocialMediaConnection.objects.get(
                    id=connection_id,
                    user=request.user,
                    platform__name='pinterest'
                )
            except SocialMediaConnection.DoesNotExist:
                return Response(
                    {'error': 'Connection not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Disconnect the account
            pinterest_service = PinterestService()
            success = pinterest_service.disconnect_account(connection)
            
            if success:
                return Response({
                    'success': True,
                    'message': f'{connection.platform.display_name} account disconnected successfully'
                })
            else:
                return Response(
                    {'error': 'Failed to disconnect account'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Error disconnecting Pinterest account for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to disconnect account'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# LinkedIn API Views

class LinkedInAuthUrlView(APIView):
    """
    Get LinkedIn OAuth authorization URL for connecting LinkedIn personal profiles.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: LinkedInAuthUrlSerializer,
            500: {"description": "Internal server error"},
        },
        description="Generate OAuth authorization URL for connecting LinkedIn personal profiles"
    )
    def get(self, request):
        try:
            linkedin_service = LinkedInService()
            
            # Generate state for CSRF protection
            state = f"user_{request.user.id}_{request.user.username}"
            auth_url = linkedin_service.get_auth_url(state=state)
            
            return Response({
                'auth_url': auth_url,
                'state': state
            })
            
        except Exception as e:
            logger.error(f"Error generating LinkedIn auth URL: {e}")
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LinkedInOAuthCallbackView(APIView):
    """
    Handle LinkedIn OAuth callback and create account connections.
    """
    permission_classes = []  # Allow unauthenticated access for OAuth callback
    
    @extend_schema(
        parameters=[
            {
                'name': 'code',
                'in': 'query',
                'description': 'OAuth authorization code',
                'required': False,
                'schema': {'type': 'string'}
            },
            {
                'name': 'state',
                'in': 'query', 
                'description': 'State parameter for CSRF protection',
                'required': False,
                'schema': {'type': 'string'}
            },
            {
                'name': 'error',
                'in': 'query',
                'description': 'Error code if authorization failed',
                'required': False,
                'schema': {'type': 'string'}
            }
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connections_created": {"type": "integer"},
                    "accounts": {"type": "array", "items": {"type": "object"}}
                }
            },
            400: {"description": "Bad request or authorization error"},
            500: {"description": "Internal server error"}
        },
        description="Process OAuth callback and create account connections"
    )
    def get(self, request):
        try:
            # Check for errors
            error = request.GET.get('error')
            if error:
                error_description = request.GET.get('error_description', 'Unknown error')
                logger.warning(f"LinkedIn OAuth error: {error} - {error_description}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message={error_description}")
            
            # Get authorization code
            auth_code = request.GET.get('code')
            if not auth_code:
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Missing authorization code")
            
            # Verify state parameter and extract user info
            state = request.GET.get('state', '')
            if not state.startswith('user_'):
                logger.warning(f"Invalid state parameter format: {state}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Invalid state parameter")
            
            try:
                # Extract user ID from state: "user_123_username"
                state_parts = state.split('_', 2)  # Split into max 3 parts
                if len(state_parts) < 3:
                    raise ValueError("Invalid state format")
                
                user_id = int(state_parts[1])
                username = state_parts[2]
                
                # Get the user
                from ..models import User
                user = User.objects.get(id=user_id, username=username)
                
            except (ValueError, User.DoesNotExist) as e:
                logger.warning(f"Invalid state parameter or user not found: {state}")
                frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
                return redirect(f"{frontend_url}?connection=error&message=Invalid user information")
            
            # Connect the account
            linkedin_service = LinkedInService()
            result = linkedin_service.connect_account(user, auth_code)
            
            # Redirect back to frontend with success
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            if result.get('success'):
                return redirect(f"{frontend_url}?connection=success&accounts={result.get('connections_created', 0)}")
            else:
                return redirect(f"{frontend_url}?connection=error")
            
        except IntegrationError as e:
            logger.error(f"LinkedIn integration error: {e}")
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            return redirect(f"{frontend_url}?connection=error&message={str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in LinkedIn callback: {e}")
            frontend_url = f"{settings.FRONTEND_URL}/social-accounts"
            return redirect(f"{frontend_url}?connection=error&message=Failed to connect account")


class LinkedInConnectionsView(APIView):
    """
    List user's LinkedIn connections.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: LinkedInConnectionsListSerializer,
            500: {"description": "Internal server error"}
        },
        description="Get all connected LinkedIn accounts for the current user"
    )
    def get(self, request):
        try:
            connections = SocialMediaConnection.objects.filter(
                user=request.user,
                platform__name='linkedin',
                is_active=True
            ).select_related('platform')
            
            serializer = LinkedInConnectionSerializer(connections, many=True)
            
            return Response({'connections': serializer.data})
            
        except Exception as e:
            logger.error(f"Error listing LinkedIn connections for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to list connections'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LinkedInPublishView(APIView):
    """
    Create a post on LinkedIn personal profile.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=LinkedInPublishPostSerializer,
        responses={
            200: LinkedInPublishResponseSerializer,
            400: {"description": "Bad request"},
            404: {"description": "Connection not found"},
            500: {"description": "Internal server error"}
        },
        description="Create a post on LinkedIn personal profile"
    )
    def post(self, request):
        serializer = LinkedInPublishPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            connection_id = serializer.validated_data['connection_id']
            text = serializer.validated_data['text']
            
            # Optional fields
            media_url = serializer.validated_data.get('media_url', '')
            link_url = serializer.validated_data.get('link_url', '')
            link_title = serializer.validated_data.get('link_title', '')
            link_description = serializer.validated_data.get('link_description', '')
            
            # Get user's connection
            try:
                connection = SocialMediaConnection.objects.get(
                    id=connection_id,
                    user=request.user,
                    platform__name='linkedin',
                    is_active=True
                )
            except SocialMediaConnection.DoesNotExist:
                return Response(
                    {'error': 'Connection not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create the post
            linkedin_service = LinkedInService()
            result = linkedin_service.publish_post(
                connection, 
                text,
                media_url=media_url,
                link_url=link_url,
                link_title=link_title,
                link_description=link_description
            )
            
            # Update last used timestamp
            connection.last_used_at = timezone.now()
            connection.save(update_fields=['last_used_at'])
            
            return Response(result)
            
        except IntegrationError as e:
            logger.error(f"LinkedIn publishing error for user {request.user.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error publishing to LinkedIn for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to create post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LinkedInDisconnectView(APIView):
    """
    Disconnect a LinkedIn account.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: LinkedInDisconnectResponseSerializer,
            404: {"description": "Connection not found"},
            500: {"description": "Internal server error"}
        },
        description="Disconnect a LinkedIn account"
    )
    def delete(self, request, connection_id):
        try:
            # Get user's connection
            try:
                connection = SocialMediaConnection.objects.get(
                    id=connection_id,
                    user=request.user,
                    platform__name='linkedin'
                )
            except SocialMediaConnection.DoesNotExist:
                return Response(
                    {'error': 'Connection not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Disconnect the account
            linkedin_service = LinkedInService()
            success = linkedin_service.disconnect_account(connection)
            
            if success:
                return Response({
                    'success': True,
                    'message': f'{connection.platform.display_name} account disconnected successfully'
                })
            else:
                return Response(
                    {'error': 'Failed to disconnect account'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Error disconnecting LinkedIn account for user {request.user.id}: {e}")
            return Response(
                {'error': 'Failed to disconnect account'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )