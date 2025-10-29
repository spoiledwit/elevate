"""
Canva Connect API Integration

This module handles the full integration with Canva's visual editor:
1. OAuth authentication
2. Design creation via API
3. Return navigation from Canva editor
4. Design export and download

Setup:
1. Create app at https://www.canva.dev/
2. Add Client ID and Secret to settings
3. Set redirect URI: http://yoursite.com/canva/callback/
"""

import logging
import requests
import base64
import hashlib
from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.core.cache import cache
import secrets

from ..serializers import (
    CanvaAuthUrlSerializer,
    CanvaCallbackSerializer,
    CanvaCallbackResponseSerializer,
    CanvaCreateDesignSerializer,
    CanvaDesignResponseSerializer,
    CanvaExportSerializer,
    CanvaExportResponseSerializer,
    CanvaConnectionStatusSerializer,
    CanvaConnectionSerializer,
    CanvaDesignSerializer,
    CanvaDesignListSerializer
)
from ..models import CanvaConnection, CanvaDesign

logger = logging.getLogger(__name__)

# Canva API endpoints
CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize"
CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"
CANVA_API_BASE = "https://api.canva.com/rest/v1"


def get_canva_credentials():
    """Get Canva credentials from settings"""
    client_id = getattr(settings, 'CANVA_CLIENT_ID', None)
    client_secret = getattr(settings, 'CANVA_CLIENT_SECRET', None)

    if not client_id or not client_secret:
        raise ValueError(
            "Canva credentials not configured. "
            "Add CANVA_CLIENT_ID and CANVA_CLIENT_SECRET to your settings."
        )

    return client_id, client_secret


class CanvaAuthUrlView(APIView):
    """
    Get Canva OAuth authorization URL with PKCE
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: CanvaAuthUrlSerializer,
            500: {"description": "Internal server error"},
        },
        description="Generate OAuth authorization URL for connecting to Canva with PKCE"
    )
    def get(self, request):
        try:
            client_id, _ = get_canva_credentials()

            # Generate and store state for security
            state = secrets.token_urlsafe(32)
            cache.set(f"canva_state_{request.user.id}", state, timeout=600)  # 10 minutes

            # Generate PKCE code_verifier and code_challenge
            code_verifier = secrets.token_urlsafe(64)

            # code_challenge: Base64URL(SHA256(code_verifier))
            code_challenge = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode()).digest()
            ).decode().rstrip('=')

            # Store code_verifier for token exchange
            cache.set(f"canva_verifier_{request.user.id}", code_verifier, timeout=600)

            # Build authorization URL with PKCE
            redirect_uri = settings.CANVA_REDIRECT_URI

            auth_url = (
                f"{CANVA_AUTH_URL}"
                f"?client_id={client_id}"
                f"&redirect_uri={redirect_uri}"
                f"&response_type=code"
                f"&state={state}"
                f"&code_challenge={code_challenge}"
                f"&code_challenge_method=S256"
                f"&scope=asset:read asset:write design:content:read design:content:write design:meta:read"
            )

            return Response({"auth_url": auth_url}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error generating Canva auth URL: {str(e)}")
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CanvaOAuthCallbackView(APIView):
    """
    Handle OAuth callback from Canva
    Exchanges code for access token
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=CanvaCallbackSerializer,
        responses={
            200: CanvaCallbackResponseSerializer,
            400: {"description": "Bad request"},
            500: {"description": "Internal server error"},
        },
        description="Handle Canva OAuth callback and exchange code for access token"
    )
    def post(self, request):
        serializer = CanvaCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            code = serializer.validated_data['code']
            state = serializer.validated_data['state']
            user_id = serializer.validated_data['user_id']

            # Verify state to prevent CSRF
            stored_state = cache.get(f"canva_state_{user_id}")
            if state != stored_state:
                return Response(
                    {"error": "Invalid state parameter"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get stored code_verifier for PKCE
            code_verifier = cache.get(f"canva_verifier_{user_id}")
            if not code_verifier:
                return Response(
                    {"error": "PKCE code_verifier not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Exchange code for access token with PKCE
            client_id, client_secret = get_canva_credentials()
            redirect_uri = settings.CANVA_REDIRECT_URI

            # Prepare Basic Auth
            credentials = f"{client_id}:{client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()

            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }

            data = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier  # PKCE requirement
            }

            response = requests.post(CANVA_TOKEN_URL, headers=headers, data=data)

            if response.status_code != 200:
                logger.error(f"Canva token exchange failed: {response.text}")
                return Response(
                    {"error": "Failed to exchange authorization code"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token_data = response.json()
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            expires_in = token_data.get('expires_in')

            # Get user from user_id
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create or update CanvaConnection
            connection, _ = CanvaConnection.objects.update_or_create(
                user=user,
                defaults={
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'token_type': 'Bearer',
                    'is_active': True,
                    'last_error': ''
                }
            )

            # Update token expiry
            if expires_in:
                connection.update_tokens(access_token, refresh_token, expires_in)

            # Clean up PKCE code_verifier and state
            cache.delete(f"canva_verifier_{user_id}")
            cache.delete(f"canva_state_{user_id}")

            return Response({
                "success": True,
                "message": "Successfully connected to Canva"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Canva OAuth callback error: {str(e)}")
            return Response(
                {"error": "Authentication failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CanvaCreateDesignView(APIView):
    """
    Create a new design in Canva and return the edit URL
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CanvaCreateDesignSerializer,
        responses={
            200: CanvaDesignResponseSerializer,
            401: {"description": "Not authenticated with Canva"},
            500: {"description": "Internal server error"},
        },
        description="Create a new design in Canva and get the edit URL"
    )
    def post(self, request):
        serializer = CanvaCreateDesignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Get Canva connection
            try:
                connection = CanvaConnection.objects.get(user=request.user, is_active=True)
            except CanvaConnection.DoesNotExist:
                return Response(
                    {"error": "Not authenticated with Canva", "needs_auth": True},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Design type from request
            design_type_input = serializer.validated_data.get('design_type', 'square_post')
            width = serializer.validated_data.get('width')
            height = serializer.validated_data.get('height')

            # Build return URL for when user finishes designing
            # Canva will append ?correlation_jwt={JWT} to this URL
            return_url = f"{settings.FRONTEND_URL}/canva/return"

            headers = {
                "Authorization": f"Bearer {connection.access_token}",
                "Content-Type": "application/json"
            }

            # Build design_type payload based on type
            # Preset types: doc, whiteboard, presentation
            # Custom types: any dimensions (e.g., square_post = 1080x1080)
            if design_type_input in ['doc', 'whiteboard', 'presentation']:
                # Use preset
                design_type_payload = {
                    "type": "preset",
                    "name": design_type_input
                }
            else:
                # Use custom dimensions (default to 1080x1080 for square post)
                design_type_payload = {
                    "type": "custom",
                    "width": width or 1080,
                    "height": height or 1080
                }

            data = {
                "design_type": design_type_payload
            }

            # Create design via Canva API
            response = requests.post(
                f"{CANVA_API_BASE}/designs",
                headers=headers,
                json=data
            )

            if response.status_code != 200:
                logger.error(f"Failed to create Canva design: {response.text}")
                return Response(
                    {"error": "Failed to create design"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            design_data = response.json()

            # Extract design object from response
            design = design_data.get('design', {})
            design_id = design.get('id')

            if not design_id:
                logger.error(f"No design ID in Canva API response: {design_data}")
                return Response(
                    {"error": "Failed to create design - no ID returned"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Use edit URL from Canva API response with custom return URL
            base_edit_url = design.get('urls', {}).get('edit_url', '')

            # URL-encode the return_url to ensure proper handling
            from urllib.parse import quote
            encoded_return_url = quote(return_url, safe='')

            if base_edit_url:
                # Check if base_edit_url already has query parameters
                separator = '&' if '?' in base_edit_url else '?'
                edit_url = f"{base_edit_url}{separator}return_url={encoded_return_url}"
            else:
                # Fallback to manual construction
                edit_url = f"https://www.canva.com/design/{design_id}/edit?return_url={encoded_return_url}"

            # Extract thumbnail URL from response
            thumbnail = design.get('thumbnail', {})
            thumbnail_url = thumbnail.get('url', '')

            # Extract title if available
            title = design.get('title', '')

            # Create CanvaDesign record in database
            CanvaDesign.objects.create(
                user=request.user,
                connection=connection,
                design_id=design_id,
                design_type=design_type_input,
                title=title,
                edit_url=edit_url,
                thumbnail_url=thumbnail_url,
                status='editing'
            )

            # Update connection last_used_at
            connection.last_used_at = timezone.now()
            connection.save(update_fields=['last_used_at'])

            return Response({
                "design_id": design_id,
                "edit_url": edit_url,
                "message": "Design created successfully"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error creating Canva design: {str(e)}")
            return Response(
                {"error": "Failed to create design"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CanvaExportDesignView(APIView):
    """
    Export a Canva design and return the download URL
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CanvaExportSerializer,
        responses={
            200: CanvaExportResponseSerializer,
            400: {"description": "No design ID provided"},
            401: {"description": "Not authenticated with Canva"},
            500: {"description": "Internal server error"},
        },
        description="Export a Canva design and get the download URL"
    )
    def post(self, request):
        serializer = CanvaExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            design_id = serializer.validated_data.get('design_id')

            # Get Canva connection
            try:
                connection = CanvaConnection.objects.get(user=request.user, is_active=True)
            except CanvaConnection.DoesNotExist:
                return Response(
                    {"error": "Not authenticated with Canva"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get design from database
            if design_id:
                try:
                    canva_design = CanvaDesign.objects.get(
                        design_id=design_id,
                        user=request.user
                    )
                except CanvaDesign.DoesNotExist:
                    return Response(
                        {"error": "Design not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Get the most recent design
                canva_design = CanvaDesign.objects.filter(
                    user=request.user
                ).order_by('-created_at').first()

                if not canva_design:
                    return Response(
                        {"error": "No design found"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            headers = {
                "Authorization": f"Bearer {connection.access_token}",
                "Content-Type": "application/json"
            }

            # Request export (PNG format) - Creates an async job
            export_data = {
                "design_id": canva_design.design_id,
                "format": {
                    "type": "png"
                }
            }

            response = requests.post(
                f"{CANVA_API_BASE}/exports",
                headers=headers,
                json=export_data
            )

            if response.status_code != 200:
                logger.error(f"Failed to create export job: {response.text}")
                return Response(
                    {"error": "Failed to export design"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Get job ID from response
            export_result = response.json()
            job = export_result.get('job', {})
            job_id = job.get('id')

            if not job_id:
                logger.error(f"No job ID in export response: {export_result}")
                return Response(
                    {"error": "Export job creation failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Poll the export job status (max 30 seconds, check every 2 seconds)
            import time
            max_attempts = 15
            attempt = 0
            export_url = None

            while attempt < max_attempts:
                time.sleep(2)  # Wait 2 seconds between checks

                status_response = requests.get(
                    f"{CANVA_API_BASE}/exports/{job_id}",
                    headers=headers
                )

                if status_response.status_code != 200:
                    logger.error(f"Failed to check export status: {status_response.text}")
                    break

                status_data = status_response.json()
                job_status = status_data.get('job', {})
                current_status = job_status.get('status')

                if current_status == 'success':
                    # Export completed - get URL from urls array
                    urls = job_status.get('urls', [])
                    if urls:
                        export_url = urls[0]  # Get first URL
                    break
                elif current_status == 'failed':
                    error = job_status.get('error', {})
                    logger.error(f"Export failed: {error.get('message')}")
                    return Response(
                        {"error": f"Export failed: {error.get('message', 'Unknown error')}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                attempt += 1

            if not export_url:
                logger.error("Export timed out or failed")
                return Response(
                    {"error": "Export timed out or failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Update design record with export info
            canva_design.mark_as_exported(export_url, 'png')

            return Response({
                "export_url": export_url,
                "design_id": canva_design.design_id,
                "message": "Design exported successfully"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error exporting Canva design: {str(e)}")
            return Response(
                {"error": "Failed to export design"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CanvaConnectionStatusView(APIView):
    """
    Check if user is connected to Canva
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: CanvaConnectionStatusSerializer,
        },
        description="Check if user is connected to Canva"
    )
    def get(self, request):
        connected = CanvaConnection.objects.filter(
            user=request.user,
            is_active=True
        ).exists()

        return Response({
            "connected": connected
        }, status=status.HTTP_200_OK)


class CanvaDesignListView(APIView):
    """
    List all Canva designs for the authenticated user
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: CanvaDesignListSerializer(many=True),
        },
        description="Get list of all Canva designs for the user"
    )
    def get(self, request):
        designs = CanvaDesign.objects.filter(user=request.user).order_by('-created_at')

        # Get fresh thumbnails from Canva API (they expire after 15 minutes)
        try:
            connection = CanvaConnection.objects.get(user=request.user, is_active=True)
            headers = {
                "Authorization": f"Bearer {connection.access_token}"
            }

            # Fetch fresh design data with thumbnails from Canva
            for design in designs:
                try:
                    response = requests.get(
                        f"{CANVA_API_BASE}/designs/{design.design_id}",
                        headers=headers
                    )
                    if response.status_code == 200:
                        design_data = response.json().get('design', {})
                        logger.info(f"Design {design.design_id} data from Canva: {design_data}")
                        thumbnail = design_data.get('thumbnail', {})
                        if thumbnail:
                            thumbnail_url = thumbnail.get('url', '')
                            design.thumbnail_url = thumbnail_url
                            logger.info(f"Set thumbnail for {design.design_id}: {thumbnail_url}")
                        else:
                            logger.warning(f"No thumbnail found for design {design.design_id}")
                    else:
                        logger.error(f"Failed to fetch design {design.design_id}: {response.status_code} - {response.text}")
                except Exception as e:
                    logger.error(f"Exception fetching thumbnail for design {design.design_id}: {str(e)}")
                    continue

        except CanvaConnection.DoesNotExist:
            pass  # No connection, use stored thumbnails

        serializer = CanvaDesignListSerializer(designs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CanvaDesignDetailView(APIView):
    """
    Retrieve, update, or delete a specific Canva design
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, design_id, user):
        """Helper method to get design object"""
        try:
            return CanvaDesign.objects.get(design_id=design_id, user=user)
        except CanvaDesign.DoesNotExist:
            return None

    @extend_schema(
        responses={
            200: CanvaDesignSerializer,
            404: {"description": "Design not found"},
        },
        description="Get details of a specific Canva design"
    )
    def get(self, request, design_id):
        design = self.get_object(design_id, request.user)

        if not design:
            return Response(
                {"error": "Design not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Increment opened count
        design.increment_opened_count()

        serializer = CanvaDesignSerializer(design)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=CanvaDesignSerializer,
        responses={
            200: CanvaDesignSerializer,
            404: {"description": "Design not found"},
        },
        description="Update a Canva design (title, status, etc.)"
    )
    def patch(self, request, design_id):
        design = self.get_object(design_id, request.user)

        if not design:
            return Response(
                {"error": "Design not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only allow updating certain fields
        allowed_fields = ['title', 'status', 'thumbnail_url']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = CanvaDesignSerializer(design, data=update_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        responses={
            204: {"description": "Design deleted successfully"},
            404: {"description": "Design not found"},
        },
        description="Delete a Canva design from the database"
    )
    def delete(self, request, design_id):
        design = self.get_object(design_id, request.user)

        if not design:
            return Response(
                {"error": "Design not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        design.delete()

        return Response(
            {"message": "Design deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
