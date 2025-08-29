from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Verify Google OAuth token and return JWT tokens
    """
    try:
        # Get the Google ID token from the request
        google_token = request.data.get('credential') or request.data.get('token')
        
        if not google_token:
            return Response(
                {'error': 'Google token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the Google token
        try:
            idinfo = id_token.verify_oauth2_token(
                google_token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
        except ValueError as e:
            logger.error(f"Google token verification failed: {str(e)}")
            return Response(
                {'error': 'Invalid Google token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract user info from Google token
        email = idinfo.get('email')
        name = idinfo.get('name', '')
        given_name = idinfo.get('given_name', '')
        family_name = idinfo.get('family_name', '')
        picture = idinfo.get('picture', '')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create user
        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            
            # Ensure username is unique
            original_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=given_name,
                last_name=family_name,
                is_active=True
            )
            created = True

        # Update user profile if it exists
        if hasattr(user, 'profile'):
            profile = user.profile
            if not profile.display_name:
                profile.display_name = name or f"{given_name} {family_name}".strip()
            if picture and not profile.profile_image:
                # You could save the Google profile picture URL here
                # For now, we'll just log it
                logger.info(f"Google profile picture available for user {user.id}: {picture}")
            profile.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_new_user': created,
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Google OAuth login error: {str(e)}")
        return Response(
            {'error': 'Authentication failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_register(request):
    """
    Register a new user with Google OAuth (same as login for Google OAuth)
    """
    return google_oauth_login(request)