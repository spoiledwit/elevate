"""
Meta Service for Facebook and Instagram Integration

Handles OAuth authentication, token management, and content publishing
for Facebook Pages and Instagram Business accounts.
"""
import requests
import logging
import json
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
    
    def __init__(self, connection=None):
        super().__init__()
        self.connection = connection
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
            'scope': 'instagram_basic,instagram_content_publish,pages_show_list,pages_manage_posts,pages_manage_engagement,pages_read_engagement,pages_manage_metadata,business_management,instagram_manage_insights',
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
            
            print("\n" + "="*80)
            print("FACEBOOK PAGES AND INSTAGRAM ACCOUNTS DISCOVERY")
            print("="*80)
            
            # Step 4: Create connections for each account
            connections = []
            
            # Create Facebook page connections
            pages = accounts_data.get('pages', [])
            print(f"\n--- FACEBOOK PAGES FOUND: {len(pages)} ---")
            for i, page in enumerate(pages, 1):
                print(f"\nPage {i}:")
                print(f"  ID: {page.get('id')}")
                print(f"  Name: {page.get('name')}")
                print(f"  Has Token: {'access_token' in page}")
                print(f"  Has Instagram: {'instagram_business_account' in page}")
                
                logger.debug(f"Creating Facebook connection for page: {page}")
                try:
                    connection = self._create_facebook_connection(user, page, long_token_data)
                    connections.append(connection)
                    print(f"  ✓ Facebook connection created: {connection.id}")
                except Exception as e:
                    print(f"  ✗ Failed to create Facebook connection: {str(e)}")
                    logger.error(f"Failed to create Facebook connection for page {page.get('name')}: {e}")
            
            # Create Instagram business connections
            ig_accounts = accounts_data.get('instagram_accounts', [])
            print(f"\n--- INSTAGRAM ACCOUNTS FOUND: {len(ig_accounts)} ---")
            for i, ig_account in enumerate(ig_accounts, 1):
                print(f"\nInstagram Account {i}:")
                print(f"  ID: {ig_account.get('id')}")
                print(f"  Username: {ig_account.get('username')}")
                print(f"  Name: {ig_account.get('name')}")
                print(f"  Page ID: {ig_account.get('page_id')}")
                print(f"  Has Token: {'access_token' in ig_account}")
                
                logger.debug(f"Creating Instagram connection for account: {ig_account}")
                try:
                    connection = self._create_instagram_connection(user, ig_account, long_token_data)
                    connections.append(connection)
                    print(f"  ✓ Instagram connection created: {connection.id}")
                except Exception as e:
                    print(f"  ✗ Failed to create Instagram connection: {str(e)}")
                    logger.error(f"Failed to create Instagram connection for account {ig_account.get('username')}: {e}")
            
            print(f"\n--- TOTAL CONNECTIONS CREATED: {len(connections)} ---")
            print("="*80)
            
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
    
    def get_post_comments(self, post_id: str, connection: SocialMediaConnection) -> Dict[str, Any]:
        """
        Get comments for a specific Facebook post.
        
        Args:
            post_id: Facebook post ID
            connection: SocialMediaConnection instance
            
        Returns:
            Dict containing comments data
        """
        try:
            url = f"{self.graph_api_base}/{post_id}/comments"
            params = {
                'access_token': connection.access_token,
                'fields': 'id,message,from,created_time,parent',
                'limit': 100
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            self.log_info(f"Retrieved {len(data.get('data', []))} comments for post {post_id}")
            return {
                'success': True,
                'comments': data.get('data', []),
                'paging': data.get('paging', {})
            }
            
        except Exception as e:
            self.log_error(f"Failed to get comments for post {post_id}", e)
            return {'success': False, 'error': str(e)}
    
    def reply_to_comment(self, comment_id: str, message: str, connection: SocialMediaConnection) -> Dict[str, Any]:
        """
        Reply to a Facebook comment.
        
        Args:
            comment_id: Facebook comment ID to reply to
            message: Reply message text
            connection: SocialMediaConnection instance
            
        Returns:
            Dict containing reply information
        """
        try:
            url = f"{self.graph_api_base}/{comment_id}/comments"
            data = {
                'message': message,
                'access_token': connection.access_token
            }
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            result = response.json()
            
            self.log_info(f"Successfully replied to comment {comment_id}")
            return {
                'success': True,
                'reply_id': result['id'],
                'message': message
            }
            
        except Exception as e:
            self.log_error(f"Failed to reply to comment {comment_id}", e)
            return {'success': False, 'error': str(e)}
    
    def send_private_reply(self, page_id: str, comment_id: str, message: str, connection: SocialMediaConnection) -> Dict[str, Any]:
        """
        Send a private message reply to a comment (one-time DM).
        
        Args:
            page_id: Facebook page ID
            comment_id: Comment ID to reply to privately
            message: Private message text
            connection: SocialMediaConnection instance
            
        Returns:
            Dict containing private reply information
        """
        try:
            url = f"{self.graph_api_base}/{page_id}/messages"
            data = {
                'recipient': json.dumps({'comment_id': comment_id}),
                'message': json.dumps({'text': message}),
                'access_token': connection.access_token
            }
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            result = response.json()
            
            self.log_info(f"Successfully sent private reply for comment {comment_id}")
            return {
                'success': True,
                'message_id': result.get('message_id', ''),
                'message': message
            }
            
        except Exception as e:
            self.log_error(f"Failed to send private reply for comment {comment_id}", e)
            return {'success': False, 'error': str(e)}
    
    def subscribe_page_to_webhooks(self, page_id: str, connection: SocialMediaConnection) -> Dict[str, Any]:
        """
        Subscribe a Facebook page to webhooks for real-time notifications.
        
        Args:
            page_id: Facebook page ID
            connection: SocialMediaConnection instance
            
        Returns:
            Dict containing subscription result
        """
        try:
            url = f"{self.graph_api_base}/{page_id}/subscribed_apps"
            data = {
                'subscribed_fields': 'feed,mention',
                'access_token': connection.access_token
            }
            
            logger.info(f"Subscribing page {page_id} to webhooks with data: {data}")
            
            response = requests.post(url, data=data)
            
            # Log the response details for debugging
            logger.info(f"Facebook API response status: {response.status_code}")
            logger.info(f"Facebook API response headers: {response.headers}")
            
            try:
                response_data = response.json()
                logger.info(f"Facebook API response data: {response_data}")
            except:
                logger.info(f"Facebook API response text: {response.text}")
                response_data = {'raw_response': response.text}
            
            if response.status_code != 200:
                error_msg = f"Facebook API error {response.status_code}: {response_data}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'status_code': response.status_code,
                    'response_data': response_data
                }
            
            response.raise_for_status()
            
            self.log_info(f"Successfully subscribed page {page_id} to webhooks")
            return {
                'success': True,
                'result': response_data
            }
            
        except requests.exceptions.HTTPError as e:
            # Try to get more specific error from response
            try:
                error_data = response.json()
                error_msg = f"Facebook API HTTP {response.status_code}: {error_data.get('error', {}).get('message', str(e))}"
                detailed_error = error_data.get('error', {})
                
                logger.error(f"HTTP Error subscribing page {page_id}: {error_msg}")
                logger.error(f"Error details: {detailed_error}")
                
                return {
                    'success': False,
                    'error': error_msg,
                    'status_code': response.status_code,
                    'error_details': detailed_error
                }
            except:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"Failed to parse error response: {error_msg}")
                return {'success': False, 'error': error_msg, 'status_code': response.status_code}
                
        except Exception as e:
            error_msg = f"Exception subscribing page {page_id} to webhooks: {str(e)}"
            self.log_error(error_msg, e)
            return {'success': False, 'error': error_msg}
    
    def unsubscribe_page_from_webhooks(self, page_id: str, connection: SocialMediaConnection) -> Dict[str, Any]:
        """
        Unsubscribe a Facebook page from webhooks.
        
        Args:
            page_id: Facebook page ID
            connection: SocialMediaConnection instance
            
        Returns:
            Dict containing unsubscription result
        """
        try:
            url = f"{self.graph_api_base}/{page_id}/subscribed_apps"
            params = {
                'access_token': connection.access_token
            }
            
            response = requests.delete(url, params=params)
            response.raise_for_status()
            
            result = response.json()
            
            self.log_info(f"Successfully unsubscribed page {page_id} from webhooks")
            return {
                'success': True,
                'result': result
            }
            
        except Exception as e:
            self.log_error(f"Failed to unsubscribe page {page_id} from webhooks", e)
            return {'success': False, 'error': str(e)}
    
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
        print("\n" + "-"*80)
        print("FETCHING USER ACCOUNTS FROM FACEBOOK API")
        print("-"*80)
        
        instagram_accounts = []
        pages = []
        
        # Get Facebook pages with pagination
        pages_url = f"{self.graph_api_base}/me/accounts"
        pages_params = {
            'access_token': access_token,
            'fields': 'id,name,access_token,instagram_business_account',
            'limit': 100  # Get more pages per request
        }
        
        page_count = 0
        request_count = 0
        
        while pages_url:
            request_count += 1
            print(f"\nRequest #{request_count}: {pages_url}")
            print(f"With fields: {pages_params.get('fields', 'N/A')}")
            
            pages_response = requests.get(pages_url, params=pages_params)
            print(f"Response status: {pages_response.status_code}")
            
            pages_response.raise_for_status()
            pages_data = pages_response.json()
            
            current_batch = pages_data.get('data', [])
            print(f"Pages in this batch: {len(current_batch)}")
            page_count += len(current_batch)
            
            # Check if there's pagination
            if 'paging' in pages_data:
                print(f"Has pagination: YES")
                if 'next' in pages_data.get('paging', {}):
                    pages_url = pages_data['paging']['next']
                    pages_params = {}  # Clear params for next URL (already included in next URL)
                    print(f"Next page URL found - continuing...")
                else:
                    print(f"No next page - ending pagination")
                    pages_url = None
            else:
                print(f"No pagination - ending")
                pages_url = None
            
            # Process pages and extract Instagram business accounts
            print(f"\n--- PROCESSING BATCH #{request_count} PAGES ---")
            for idx, page in enumerate(current_batch, 1):
                global_idx = len(pages) + idx
                print(f"\nPage {global_idx}: {page.get('name', 'Unknown')}")
                print(f"  Page ID: {page.get('id')}")
                print(f"  Has access_token: {'access_token' in page}")
                print(f"  Has instagram_business_account: {'instagram_business_account' in page}")
                
                pages.append({
                    'id': page['id'],
                    'name': page['name'],
                    'access_token': page['access_token']
                })
                
                # Check if page has Instagram business account
                if 'instagram_business_account' in page:
                    ig_id = page['instagram_business_account']['id']
                    print(f"  Instagram Business Account ID: {ig_id}")
                    
                    # Get Instagram account details
                    ig_url = f"{self.graph_api_base}/{ig_id}"
                    ig_params = {
                        'access_token': page['access_token'],
                        'fields': 'id,username,name,profile_picture_url'
                    }
                    
                    print(f"  Fetching Instagram details from: {ig_url}")
                    ig_response = requests.get(ig_url, params=ig_params)
                    print(f"  Instagram API response status: {ig_response.status_code}")
                    
                    if ig_response.status_code == 200:
                        ig_data = ig_response.json()
                        print(f"  Instagram username: {ig_data.get('username', 'N/A')}")
                        print(f"  Instagram name: {ig_data.get('name', 'N/A')}")
                        
                        instagram_accounts.append({
                            'id': ig_data['id'],
                            'username': ig_data.get('username', ''),
                            'name': ig_data.get('name', ''),
                            'profile_picture_url': ig_data.get('profile_picture_url', ''),
                            'access_token': page['access_token'],
                            'page_id': page['id']
                        })
                        print(f"  ✓ Instagram account added to list")
                    else:
                        print(f"  ✗ Failed to fetch Instagram details: {ig_response.text}")
                        print(f"  Full error response: {ig_response.json() if ig_response.headers.get('content-type', '').startswith('application/json') else ig_response.text}")
                else:
                    print(f"  No Instagram business account linked")
                    # Try alternative method - check if this page manages any Instagram accounts directly
                    print(f"  Trying alternative Instagram discovery method...")
                    
                    alt_ig_url = f"{self.graph_api_base}/{page['id']}"
                    alt_ig_params = {
                        'access_token': page['access_token'],
                        'fields': 'instagram_accounts{id,username,name,profile_picture_url}'
                    }
                    
                    print(f"  Alternative Instagram API call: {alt_ig_url}")
                    alt_ig_response = requests.get(alt_ig_url, params=alt_ig_params)
                    print(f"  Alternative API response status: {alt_ig_response.status_code}")
                    
                    if alt_ig_response.status_code == 200:
                        alt_ig_data = alt_ig_response.json()
                        print(f"  Alternative response: {alt_ig_data}")
                        
                        if 'instagram_accounts' in alt_ig_data:
                            alt_accounts = alt_ig_data['instagram_accounts'].get('data', [])
                            print(f"  Found {len(alt_accounts)} Instagram accounts via alternative method")
                            
                            for alt_account in alt_accounts:
                                print(f"    Alt Instagram ID: {alt_account.get('id')}")
                                print(f"    Alt Instagram username: {alt_account.get('username')}")
                                
                                instagram_accounts.append({
                                    'id': alt_account['id'],
                                    'username': alt_account.get('username', ''),
                                    'name': alt_account.get('name', ''),
                                    'profile_picture_url': alt_account.get('profile_picture_url', ''),
                                    'access_token': page['access_token'],
                                    'page_id': page['id']
                                })
                                print(f"    ✓ Alternative Instagram account added")
                        else:
                            print(f"  No instagram_accounts field in alternative response")
                    else:
                        print(f"  ✗ Alternative Instagram discovery failed: {alt_ig_response.text}")
        
        print(f"\n--- FINAL SUMMARY ---")
        print(f"Total API requests made: {request_count}")
        print(f"Total Facebook pages found: {len(pages)}")
        print(f"Total Instagram accounts found: {len(instagram_accounts)}")
        
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
        if not container_response.ok:
            logger.error(f"Instagram API error: {container_response.status_code}")
            logger.error(f"Response: {container_response.text}")
            logger.error(f"Request data: {container_data}")
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