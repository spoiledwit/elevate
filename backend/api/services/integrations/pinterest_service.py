"""
Pinterest Service for Pinterest API Integration

Handles OAuth authentication, token management, and content publishing
for Pinterest boards and pins using Pinterest API v5.
"""
import requests
import logging
from typing import Dict, Any, Optional, List
from urllib.parse import urlencode
from django.conf import settings
from django.utils import timezone

from ...models import SocialMediaConnection, SocialMediaPlatform, User
from .base import BaseIntegrationService, IntegrationError

logger = logging.getLogger(__name__)


class PinterestService(BaseIntegrationService):
    """
    Service for integrating with Pinterest API v5.
    
    Supports:
    - OAuth 2.0 authentication
    - Board management
    - Pin creation and publishing
    - Token refresh and management
    """
    
    def __init__(self, connection=None):
        super().__init__(connection)
        self.app_id = getattr(settings, 'PINTEREST_APP_ID', '')
        self.app_secret = getattr(settings, 'PINTEREST_APP_SECRET', '')
        self.redirect_uri = getattr(settings, 'PINTEREST_REDIRECT_URI', '')
        self.api_base = "https://api.pinterest.com/v5"
        
        if not all([self.app_id, self.app_secret]):
            self.log_error("Pinterest credentials not properly configured in settings")
    
    def get_auth_url(self, state: str = None) -> str:
        """
        Generate OAuth authorization URL for Pinterest API v5.
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            str: Authorization URL
        """
        params = {
            'client_id': self.app_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'boards:read,boards:write,pins:read,pins:write,user_accounts:read',
        }
        
        if state:
            params['state'] = state
            
        return f"https://www.pinterest.com/oauth/?{urlencode(params)}"
    
    def connect_account(self, user: User, auth_code: str, **kwargs) -> Dict[str, Any]:
        """
        Connect user's Pinterest account.
        
        Args:
            user: Django User instance
            auth_code: OAuth authorization code from Pinterest
            
        Returns:
            Dict containing connection information
        """
        try:
            logger.debug(f"Starting Pinterest connection for user {user.username} with auth_code: {auth_code[:10]}...")
            
            # Step 1: Exchange code for access token
            access_token_data = self._exchange_code_for_token(auth_code)
            logger.debug(f"Got access token data: {access_token_data}")
            
            # Step 2: Get user information
            user_info = self._get_user_info(access_token_data['access_token'])
            logger.debug(f"Got user info: {user_info}")
            
            # Step 3: Get user's boards
            boards_data = self._get_user_boards(access_token_data['access_token'])
            logger.debug(f"Got boards data: {boards_data}")
            
            # Step 4: Create connection
            connection = self._create_pinterest_connection(user, user_info, access_token_data)
            logger.debug(f"Created Pinterest connection: {connection}")
            
            self.log_info(
                f"Successfully connected Pinterest account for user {user.username}",
                user_id=user.id,
                pinterest_username=user_info.get('username', '')
            )
            
            return {
                'success': True,
                'connections_created': 1,
                'accounts': [
                    {
                        'platform': 'pinterest',
                        'username': user_info.get('username', ''),
                        'display_name': user_info.get('first_name', '') + ' ' + user_info.get('last_name', ''),
                        'board_count': len(boards_data.get('items', []))
                    }
                ]
            }
            
        except Exception as e:
            self.log_error(f"Failed to connect Pinterest account for user {user.username}", e, user_id=user.id)
            raise IntegrationError(f"Pinterest connection failed: {str(e)}", platform='pinterest')
    
    def publish_post(self, connection: SocialMediaConnection, content: str, 
                    media_url: str = None, **kwargs) -> Dict[str, Any]:
        """
        Create a pin on Pinterest.
        
        Args:
            connection: SocialMediaConnection instance
            content: Pin description
            media_url: Image URL for the pin
            board_id: Pinterest board ID where to create the pin
            **kwargs: Additional pin options
            
        Returns:
            Dict containing pin information
        """
        try:
            if not media_url:
                raise IntegrationError("Pinterest pins require an image URL", platform='pinterest')
            
            # Get board_id from kwargs or use the first available board
            board_id = kwargs.get('board_id')
            if not board_id:
                # Get user's first available board as default
                print(f"\nFetching Pinterest boards for posting...")
                boards = self._get_user_boards(connection.access_token)
                print(f"Boards response: {boards}")
                
                boards_list = boards.get('items', [])
                print(f"Found {len(boards_list)} boards")
                
                if boards_list:
                    board_id = boards_list[0]['id']
                    board_name = boards_list[0].get('name', 'Unknown')
                    print(f"Using first board: {board_name} (ID: {board_id})")
                else:
                    raise IntegrationError("No boards available for Pinterest posting. Please create at least one board on your Pinterest account.", platform='pinterest')
            
            return self._create_pin(connection, content, media_url, board_id, **kwargs)
            
        except Exception as e:
            self.log_error(
                f"Failed to create pin for connection {connection.id}",
                e,
                connection_id=connection.id,
                platform='pinterest'
            )
            raise IntegrationError(f"Pin creation failed: {str(e)}", platform='pinterest')
    
    def refresh_token(self, connection: SocialMediaConnection) -> bool:
        """
        Refresh access token for Pinterest connection.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if refresh successful
        """
        try:
            if not connection.refresh_token:
                self.log_error(f"No refresh token available for connection {connection.id}")
                return False
            
            import base64
            
            url = f"{self.api_base}/oauth/token"
            
            # Pinterest API v5 requires Basic Auth for refresh token too
            credentials = f"{self.app_id}:{self.app_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode('utf-8')
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': connection.refresh_token
            }
            
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            
            # Update connection with new token
            connection.access_token = token_data['access_token']
            if 'refresh_token' in token_data:
                connection.refresh_token = token_data['refresh_token']
            if 'expires_in' in token_data:
                connection.expires_at = timezone.now() + timezone.timedelta(seconds=token_data['expires_in'])
            connection.save()
            
            self.log_info(f"Successfully refreshed token for connection {connection.id}")
            return True
            
        except Exception as e:
            self.log_error(f"Failed to refresh token for connection {connection.id}", e)
            return False
    
    def disconnect_account(self, connection: SocialMediaConnection) -> bool:
        """
        Disconnect Pinterest account.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if disconnection successful
        """
        try:
            # Pinterest doesn't require explicit token revocation
            # Just mark as inactive
            connection.is_active = False
            connection.save()
            
            self.log_info(f"Successfully disconnected connection {connection.id}")
            return True
            
        except Exception as e:
            self.log_error(f"Failed to disconnect connection {connection.id}", e)
            return False
    
    def _exchange_code_for_token(self, auth_code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        import base64
        
        url = f"{self.api_base}/oauth/token"
        
        # Pinterest API v5 requires Basic Auth with base64 encoded client_id:client_secret
        credentials = f"{self.app_id}:{self.app_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode('utf-8')
        
        headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'grant_type': 'authorization_code',
            'code': auth_code,
            'redirect_uri': self.redirect_uri
        }
        
        print(f"\nPinterest Token Exchange Debug:")
        print(f"URL: {url}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(url, headers=headers, data=data)
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Error Response: {response.text}")
        
        response.raise_for_status()
        
        result = response.json()
        print(f"Success Response: {result}")
        return result
    
    def _get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get Pinterest user information."""
        url = f"{self.api_base}/user_account"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def _get_user_boards(self, access_token: str) -> Dict[str, Any]:
        """Get user's Pinterest boards."""
        url = f"{self.api_base}/boards"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def _create_pinterest_connection(self, user: User, user_info: Dict[str, Any], 
                                   token_data: Dict[str, Any]) -> SocialMediaConnection:
        """Create Pinterest connection."""
        # Get or create Pinterest platform
        platform, _ = SocialMediaPlatform.objects.get_or_create(
            name='pinterest',
            defaults={
                'display_name': 'Pinterest',
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'auth_url': 'https://www.pinterest.com/oauth/',
                'token_url': f"{self.api_base}/oauth/token",
                'scope': 'boards:read,boards:write,pins:read,pins:write,user_accounts:read',
                'is_active': True
            }
        )
        
        # Create or update connection
        connection, created = SocialMediaConnection.objects.update_or_create(
            user=user,
            platform=platform,
            platform_user_id=user_info.get('id', ''),  # Use generic platform_user_id field
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token', ''),
                'token_type': token_data.get('token_type', 'Bearer'),
                'platform_user_id': user_info.get('id', ''),
                'platform_username': user_info.get('username', ''),
                'platform_display_name': self._format_display_name(user_info),
                'platform_profile_url': user_info.get('profile_image', ''),
                'scope': token_data.get('scope', ''),
                'is_active': True,
                'is_verified': True
            }
        )
        
        # Set expiration if provided
        if 'expires_in' in token_data:
            connection.expires_at = timezone.now() + timezone.timedelta(seconds=token_data['expires_in'])
            connection.save()
        
        return connection
    
    def _format_display_name(self, user_info: Dict[str, Any]) -> str:
        """Format display name with username and full name."""
        username = user_info.get('username', '')
        first_name = user_info.get('first_name', '').strip()
        last_name = user_info.get('last_name', '').strip()
        
        # Build display name
        if username:
            display_name = f"@{username}"
            if first_name or last_name:
                full_name = f"{first_name} {last_name}".strip()
                if full_name:
                    display_name += f" ({full_name})"
            return display_name
        elif first_name or last_name:
            return f"{first_name} {last_name}".strip()
        else:
            return "Pinterest User"
    
    def _create_pin(self, connection: SocialMediaConnection, description: str,
                   media_url: str, board_id: str, **kwargs) -> Dict[str, Any]:
        """Create a pin on Pinterest."""
        url = f"{self.api_base}/pins"
        headers = {
            'Authorization': f'Bearer {connection.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'board_id': board_id,
            'description': description,
            'media_source': {
                'source_type': 'image_url',
                'url': media_url
            }
        }
        
        # Add optional parameters
        if 'link' in kwargs:
            data['link'] = kwargs['link']
        if 'title' in kwargs:
            data['title'] = kwargs['title']
        if 'alt_text' in kwargs:
            data['alt_text'] = kwargs['alt_text']
        
        print(f"\nPinterest Pin Creation Debug:")
        print(f"URL: {url}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(url, headers=headers, json=data)
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code != 201:  # Pinterest returns 201 for successful pin creation
            print(f"Error Response: {response.text}")
        
        response.raise_for_status()
        
        result = response.json()
        print(f"Success Response: {result}")
        
        return {
            'platform': 'pinterest',
            'post_id': result['id'],
            'post_url': result.get('url', ''),
            'success': True
        }