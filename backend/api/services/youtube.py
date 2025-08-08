import logging
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

from .base import SocialMediaService
from ..utils import encrypt_token

logger = logging.getLogger(__name__)


class YouTubeService(SocialMediaService):
    """YouTube OAuth and posting service"""
    
    BASE_URL = "https://www.googleapis.com/youtube/v3"
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get YouTube user information"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/channels", params={
                'part': 'snippet,statistics',
                'mine': 'true'
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('items'):
                    channel = data['items'][0]
                    snippet = channel.get('snippet', {})
                    
                    self.update_connection_metadata(
                        platform_user_id=channel.get('id'),
                        platform_username=snippet.get('title'),
                        platform_display_name=snippet.get('title'),
                        platform_profile_url=f"https://youtube.com/channel/{channel.get('id')}",
                        is_verified=True
                    )
                    return channel
                else:
                    self.log_error("No YouTube channel found")
                    return {}
            else:
                self.log_error(f"Failed to get user info: {response.status_code}")
                return {}
                
        except Exception as e:
            self.log_error(f"Error getting user info: {str(e)}")
            return {}
    
    def refresh_access_token(self) -> bool:
        """Refresh YouTube access token"""
        try:
            response = requests.post('https://oauth2.googleapis.com/token', data={
                'grant_type': 'refresh_token',
                'refresh_token': self.refresh_token,
                'client_id': self.platform.client_id,
                'client_secret': self.platform.client_secret
            })
            
            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get('access_token')
                new_refresh_token = data.get('refresh_token')
                expires_in = data.get('expires_in', 0)
                
                # Update connection with new tokens
                self.connection.access_token = encrypt_token(new_access_token)
                if new_refresh_token:
                    self.connection.refresh_token = encrypt_token(new_refresh_token)
                self.connection.expires_at = timezone.now() + timedelta(seconds=expires_in)
                self.connection.save()
                
                # Update instance tokens
                self.access_token = new_access_token
                if new_refresh_token:
                    self.refresh_token = new_refresh_token
                
                logger.info(f"YouTube token refreshed for user {self.connection.user.username}")
                return True
            else:
                self.log_error(f"Failed to refresh token: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_error(f"Error refreshing token: {str(e)}")
            return False
    
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to YouTube (as a comment or community post)"""
        try:
            # YouTube doesn't have a direct "post" API like other platforms
            # We can post to community tab if available, or create a comment
            # For now, we'll implement community post functionality
            
            if not self.connection.platform_user_id:
                return {
                    'success': False,
                    'error': 'YouTube channel not found'
                }
            
            # Create a community post
            post_data = {
                'snippet': {
                    'channelId': self.connection.platform_user_id,
                    'text': text
                }
            }
            
            response = self.make_request('POST', f"{self.BASE_URL}/community", json=post_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'post_id': data.get('id'),
                    'post_url': f"https://youtube.com/channel/{self.connection.platform_user_id}/community"
                }
            else:
                # Fallback to comment posting on a video
                # This is a simplified implementation
                error_msg = f"Failed to post to YouTube: {response.status_code}"
                self.log_error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Error posting to YouTube: {str(e)}"
            self.log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def validate_connection(self) -> bool:
        """Validate YouTube connection"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/channels", params={
                'part': 'id',
                'mine': 'true'
            })
            return response.status_code == 200
        except Exception:
            return False
