"""
Meta Service for Facebook and Instagram Integration

Handles OAuth authentication, token management, and content publishing
for Facebook Pages and Instagram Business accounts.
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


class MetaService(BaseIntegrationService):
    """
    Service for integrating with Meta platforms (Facebook and Instagram).
    
    Supports:
    - OAuth 2.0 authentication
    - Long-lived token exchange
    - Facebook Page publishing
    - Instagram Business account publishing
    - Token refresh and management
    """
    
    def __init__(self):
        super().__init__()
        self.app_id = getattr(settings, 'FACEBOOK_APP_ID', '')
        self.app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', '')
        self.redirect_uri = getattr(settings, 'META_REDIRECT_URI', '')
        self.graph_api_base = "https://graph.facebook.com/v19.0"
        
        if not all([self.app_id, self.app_secret]):
            self.log_error("Meta credentials not properly configured in settings")
    
    def get_auth_url(self, state: str = None) -> str:
        """
        Generate OAuth authorization URL for Meta platforms.
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            str: Authorization URL
        """
        params = {
            'client_id': self.app_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'instagram_basic,instagram_content_publish,pages_show_list,pages_manage_posts',
            'response_type': 'code',
        }
        
        if state:
            params['state'] = state
            
        return f"https://www.facebook.com/v19.0/dialog/oauth?{urlencode(params)}"
    
    def connect_account(self, user: User, auth_code: str, **kwargs) -> Dict[str, Any]:
        """
        Connect user's Meta account (Facebook/Instagram).
        
        Args:
            user: Django User instance
            auth_code: OAuth authorization code from Meta
            
        Returns:
            Dict containing connection information
        """
        try:
            logger.debug(f"Starting Meta connection for user {user.username} with auth_code: {auth_code[:10]}...")
            
            # Step 1: Exchange code for short-lived access token
            short_token = self._exchange_code_for_token(auth_code)
            logger.debug(f"Got short token: {short_token[:10]}...")
            
            # Step 2: Exchange for long-lived token
            long_token_data = self._exchange_for_long_lived_token(short_token)
            logger.debug(f"Got long token data: {long_token_data}")
            
            # Step 3: Get user's pages and Instagram accounts
            accounts_data = self._get_user_accounts(long_token_data['access_token'])
            logger.debug(f"Got accounts data: {accounts_data}")
            
            # Step 4: Create connections for each account
            connections = []
            
            # Create Facebook page connections
            pages = accounts_data.get('pages', [])
            logger.debug(f"Found {len(pages)} Facebook pages: {pages}")
            for page in pages:
                logger.debug(f"Creating Facebook connection for page: {page}")
                connection = self._create_facebook_connection(user, page, long_token_data)
                connections.append(connection)
                logger.debug(f"Created Facebook connection: {connection}")
            
            # Create Instagram business connections
            ig_accounts = accounts_data.get('instagram_accounts', [])
            logger.debug(f"Found {len(ig_accounts)} Instagram accounts: {ig_accounts}")
            for ig_account in ig_accounts:
                logger.debug(f"Creating Instagram connection for account: {ig_account}")
                connection = self._create_instagram_connection(user, ig_account, long_token_data)
                connections.append(connection)
                logger.debug(f"Created Instagram connection: {connection}")
            
            self.log_info(
                f"Successfully connected {len(connections)} Meta accounts for user {user.username}",
                user_id=user.id,
                connection_count=len(connections)
            )
            
            return {
                'success': True,
                'connections_created': len(connections),
                'accounts': [
                    {
                        'platform': conn.platform.name,
                        'username': conn.platform_username,
                        'display_name': conn.platform_display_name
                    }
                    for conn in connections
                ]
            }
            
        except Exception as e:
            self.log_error(f"Failed to connect Meta account for user {user.username}", e, user_id=user.id)
            raise IntegrationError(f"Meta connection failed: {str(e)}", platform='meta')
    
    def publish_post(self, connection: SocialMediaConnection, content: str, 
                    media_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Publish a post to Facebook or Instagram.
        
        Args:
            connection: SocialMediaConnection instance
            content: Post text content
            media_url: Optional image/video URL
            **kwargs: Platform-specific options
            
        Returns:
            Dict containing post information
        """
        try:
            if connection.platform.name == 'facebook':
                return self._publish_facebook_post(connection, content, media_url, **kwargs)
            elif connection.platform.name == 'instagram':
                return self._publish_instagram_post(connection, content, media_url, **kwargs)
            else:
                raise IntegrationError(f"Unsupported platform: {connection.platform.name}", platform='meta')
                
        except Exception as e:
            self.log_error(
                f"Failed to publish post for connection {connection.id}",
                e,
                connection_id=connection.id,
                platform=connection.platform.name
            )
            raise IntegrationError(f"Post publishing failed: {str(e)}", platform='meta')
    
    def refresh_token(self, connection: SocialMediaConnection) -> bool:
        """
        Refresh access token for Meta connection.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if refresh successful
        """
        try:
            url = f"{self.graph_api_base}/oauth/access_token"
            params = {
                'grant_type': 'fb_exchange_token',
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'fb_exchange_token': connection.access_token
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Update connection with new token
            connection.access_token = data['access_token']
            if 'expires_in' in data:
                connection.expires_at = timezone.now() + timezone.timedelta(seconds=data['expires_in'])
            connection.save()
            
            self.log_info(f"Successfully refreshed token for connection {connection.id}")
            return True
            
        except Exception as e:
            self.log_error(f"Failed to refresh token for connection {connection.id}", e)
            return False
    
    def disconnect_account(self, connection: SocialMediaConnection) -> bool:
        """
        Disconnect Meta account.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if disconnection successful
        """
        try:
            # Deauthorize the app (optional - Meta doesn't require this)
            # Just mark as inactive
            connection.is_active = False
            connection.save()
            
            self.log_info(f"Successfully disconnected connection {connection.id}")
            return True
            
        except Exception as e:
            self.log_error(f"Failed to disconnect connection {connection.id}", e)
            return False
    
    def _exchange_code_for_token(self, auth_code: str) -> str:
        """Exchange authorization code for short-lived access token."""
        url = f"{self.graph_api_base}/oauth/access_token"
        params = {
            'client_id': self.app_id,
            'client_secret': self.app_secret,
            'redirect_uri': self.redirect_uri,
            'code': auth_code
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data['access_token']
    
    def _exchange_for_long_lived_token(self, short_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token."""
        url = f"{self.graph_api_base}/oauth/access_token"
        params = {
            'grant_type': 'fb_exchange_token',
            'client_id': self.app_id,
            'client_secret': self.app_secret,
            'fb_exchange_token': short_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def _get_user_accounts(self, access_token: str) -> Dict[str, Any]:
        """Get user's Facebook pages and Instagram business accounts."""
        # Get Facebook pages
        pages_url = f"{self.graph_api_base}/me/accounts"
        pages_params = {
            'access_token': access_token,
            'fields': 'id,name,access_token,instagram_business_account'
        }
        
        logger.debug(f"Requesting Facebook pages from: {pages_url}")
        logger.debug(f"Request params: {pages_params}")
        
        pages_response = requests.get(pages_url, params=pages_params)
        logger.debug(f"Facebook pages API response status: {pages_response.status_code}")
        logger.debug(f"Facebook pages API response: {pages_response.text}")
        
        pages_response.raise_for_status()
        pages_data = pages_response.json()
        logger.debug(f"Parsed pages data: {pages_data}")
        
        instagram_accounts = []
        pages = []
        
        # Process pages and extract Instagram business accounts
        for page in pages_data.get('data', []):
            pages.append({
                'id': page['id'],
                'name': page['name'],
                'access_token': page['access_token']
            })
            
            # Check if page has Instagram business account
            if 'instagram_business_account' in page:
                ig_id = page['instagram_business_account']['id']
                
                # Get Instagram account details
                ig_url = f"{self.graph_api_base}/{ig_id}"
                ig_params = {
                    'access_token': page['access_token'],
                    'fields': 'id,username,name,profile_picture_url'
                }
                
                ig_response = requests.get(ig_url, params=ig_params)
                if ig_response.status_code == 200:
                    ig_data = ig_response.json()
                    instagram_accounts.append({
                        'id': ig_data['id'],
                        'username': ig_data.get('username', ''),
                        'name': ig_data.get('name', ''),
                        'profile_picture_url': ig_data.get('profile_picture_url', ''),
                        'access_token': page['access_token'],
                        'page_id': page['id']
                    })
        
        return {
            'pages': pages,
            'instagram_accounts': instagram_accounts
        }
    
    def _create_facebook_connection(self, user: User, page_data: Dict[str, Any], 
                                  token_data: Dict[str, Any]) -> SocialMediaConnection:
        """Create Facebook page connection."""
        # Get or create Facebook platform
        platform, _ = SocialMediaPlatform.objects.get_or_create(
            name='facebook',
            defaults={
                'display_name': 'Facebook',
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'auth_url': 'https://www.facebook.com/v19.0/dialog/oauth',
                'token_url': f"{self.graph_api_base}/oauth/access_token",
                'scope': 'pages_show_list,pages_manage_posts',
                'is_active': True
            }
        )
        
        # Create or update connection using the new constraint fields
        # Important: Don't set instagram_business_id to empty string to avoid constraint conflicts
        defaults = {
            'access_token': page_data['access_token'],  # Use page token, not user token
            'platform_user_id': page_data['id'],
            'platform_username': page_data['name'],
            'platform_display_name': page_data['name'],
            'facebook_page_name': page_data['name'],
            'is_active': True,
            'is_verified': True
        }
        
        connection, created = SocialMediaConnection.objects.update_or_create(
            user=user,
            platform=platform,
            facebook_page_id=page_data['id'],  # This is now part of the unique constraint
            defaults=defaults
        )
        
        return connection
    
    def _create_instagram_connection(self, user: User, ig_data: Dict[str, Any], 
                                   token_data: Dict[str, Any]) -> SocialMediaConnection:
        """Create Instagram business connection."""
        # Get or create Instagram platform
        platform, _ = SocialMediaPlatform.objects.get_or_create(
            name='instagram',
            defaults={
                'display_name': 'Instagram',
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'auth_url': 'https://www.facebook.com/v19.0/dialog/oauth',
                'token_url': f"{self.graph_api_base}/oauth/access_token",
                'scope': 'instagram_basic,instagram_content_publish',
                'is_active': True
            }
        )
        
        # Create or update connection using the new constraint fields
        connection, created = SocialMediaConnection.objects.update_or_create(
            user=user,
            platform=platform,
            instagram_business_id=ig_data['id'],  # This is now part of the unique constraint
            defaults={
                'access_token': ig_data['access_token'],  # Use page token for IG business
                'platform_user_id': ig_data['id'],
                'platform_username': ig_data.get('username', ''),
                'platform_display_name': ig_data.get('name', ig_data.get('username', '')),
                'platform_profile_url': ig_data.get('profile_picture_url', ''),
                'instagram_username': ig_data.get('username', ''),
                'facebook_page_id': ig_data.get('page_id', ''),
                'is_active': True,
                'is_verified': True
            }
        )
        
        return connection
    
    def _publish_facebook_post(self, connection: SocialMediaConnection, content: str,
                             media_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Publish post to Facebook page."""
        url = f"{self.graph_api_base}/{connection.facebook_page_id}/feed"
        
        data = {
            'message': content,
            'access_token': connection.access_token
        }
        
        if media_url:
            data['link'] = media_url
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        result = response.json()
        
        return {
            'platform': 'facebook',
            'post_id': result['id'],
            'post_url': f"https://www.facebook.com/{result['id']}",
            'success': True
        }
    
    def _publish_instagram_post(self, connection: SocialMediaConnection, content: str,
                              media_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Publish post to Instagram business account."""
        if not media_url:
            raise IntegrationError("Instagram posts require media (image or video)", platform='instagram')
        
        # Step 1: Create media container
        container_url = f"{self.graph_api_base}/{connection.instagram_business_id}/media"
        container_data = {
            'image_url': media_url,
            'caption': content,
            'access_token': connection.access_token
        }
        
        container_response = requests.post(container_url, data=container_data)
        container_response.raise_for_status()
        container_result = container_response.json()
        
        # Step 2: Publish the container
        publish_url = f"{self.graph_api_base}/{connection.instagram_business_id}/media_publish"
        publish_data = {
            'creation_id': container_result['id'],
            'access_token': connection.access_token
        }
        
        publish_response = requests.post(publish_url, data=publish_data)
        publish_response.raise_for_status()
        publish_result = publish_response.json()
        
        return {
            'platform': 'instagram',
            'post_id': publish_result['id'],
            'post_url': f"https://www.instagram.com/p/{publish_result['id']}/",
            'success': True
        }