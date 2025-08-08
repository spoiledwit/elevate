import logging
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

from .base import SocialMediaService
from ..utils import encrypt_token

logger = logging.getLogger(__name__)


class InstagramService(SocialMediaService):
    """Instagram OAuth and posting service"""
    
    BASE_URL = "https://graph.instagram.com/v18.0"
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get Instagram user information"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/me", params={
                'fields': 'id,username,account_type'
            })
            
            if response.status_code == 200:
                data = response.json()
                self.update_connection_metadata(
                    platform_user_id=data.get('id'),
                    platform_username=data.get('username'),
                    platform_display_name=data.get('username'),
                    is_verified=True
                )
                return data
            else:
                self.log_error(f"Failed to get user info: {response.status_code}")
                return {}
                
        except Exception as e:
            self.log_error(f"Error getting user info: {str(e)}")
            return {}
    
    def refresh_access_token(self) -> bool:
        """Refresh Instagram access token"""
        try:
            response = requests.get(f"{self.BASE_URL}/refresh_access_token", params={
                'grant_type': 'ig_refresh_token',
                'access_token': self.access_token
            })
            
            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get('access_token')
                expires_in = data.get('expires_in', 0)
                
                # Update connection with new token
                self.connection.access_token = encrypt_token(new_access_token)
                self.connection.expires_at = timezone.now() + timedelta(seconds=expires_in)
                self.connection.save()
                
                # Update instance token
                self.access_token = new_access_token
                
                logger.info(f"Instagram token refreshed for user {self.connection.user.username}")
                return True
            else:
                self.log_error(f"Failed to refresh token: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_error(f"Error refreshing token: {str(e)}")
            return False
    
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to Instagram"""
        try:
            # Instagram requires media for posts, so we'll create a story or use a default image
            if not media_urls:
                # For text-only posts, we might need to create a story or use a default image
                # This is a simplified implementation
                return {
                    'success': False,
                    'error': 'Instagram requires media for posts'
                }
            
            # Create a media container first
            media_data = {
                'image_url': media_urls[0],
                'caption': text,
                'access_token': self.access_token
            }
            
            response = self.make_request('POST', f"{self.BASE_URL}/me/media", data=media_data)
            
            if response.status_code == 200:
                media_response = response.json()
                media_id = media_response.get('id')
                
                # Publish the media
                publish_data = {
                    'creation_id': media_id,
                    'access_token': self.access_token
                }
                
                publish_response = self.make_request('POST', f"{self.BASE_URL}/me/media_publish", data=publish_data)
                
                if publish_response.status_code == 200:
                    publish_data = publish_response.json()
                    return {
                        'success': True,
                        'post_id': publish_data.get('id'),
                        'post_url': f"https://instagram.com/p/{publish_data.get('id')}"
                    }
                else:
                    error_msg = f"Failed to publish Instagram post: {publish_response.status_code}"
                    self.log_error(error_msg)
                    return {
                        'success': False,
                        'error': error_msg
                    }
            else:
                error_msg = f"Failed to create Instagram media: {response.status_code}"
                self.log_error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Error posting to Instagram: {str(e)}"
            self.log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def validate_connection(self) -> bool:
        """Validate Instagram connection"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/me")
            return response.status_code == 200
        except Exception:
            return False
