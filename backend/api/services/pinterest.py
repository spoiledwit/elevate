import logging
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

from .base import SocialMediaService
from ..utils import encrypt_token

logger = logging.getLogger(__name__)


class PinterestService(SocialMediaService):
    """Pinterest OAuth and posting service"""
    
    BASE_URL = "https://api.pinterest.com/v5"
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get Pinterest user information"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/user_account")
            
            if response.status_code == 200:
                data = response.json()
                user_data = data.get('items', [{}])[0]
                
                self.update_connection_metadata(
                    platform_user_id=user_data.get('username'),
                    platform_username=user_data.get('username'),
                    platform_display_name=user_data.get('full_name'),
                    platform_profile_url=f"https://pinterest.com/{user_data.get('username', '')}",
                    is_verified=True
                )
                return user_data
            else:
                self.log_error(f"Failed to get user info: {response.status_code}")
                return {}
                
        except Exception as e:
            self.log_error(f"Error getting user info: {str(e)}")
            return {}
    
    def refresh_access_token(self) -> bool:
        """Refresh Pinterest access token"""
        try:
            response = requests.post('https://api.pinterest.com/v5/oauth/token', data={
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
                
                logger.info(f"Pinterest token refreshed for user {self.connection.user.username}")
                return True
            else:
                self.log_error(f"Failed to refresh token: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_error(f"Error refreshing token: {str(e)}")
            return False
    
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to Pinterest (create a pin)"""
        try:
            # Pinterest requires an image for pins
            if not media_urls:
                return {
                    'success': False,
                    'error': 'Pinterest requires an image for pins'
                }
            
            # Create a pin
            pin_data = {
                'title': text[:100],  # Pinterest title limit
                'description': text,
                'link': 'https://pinterest.com',  # Default link
                'media_source': {
                    'source_type': 'image_url',
                    'url': media_urls[0]
                }
            }
            
            response = self.make_request('POST', f"{self.BASE_URL}/pins", json=pin_data)
            
            if response.status_code == 201:
                data = response.json()
                return {
                    'success': True,
                    'post_id': data.get('id'),
                    'post_url': data.get('link')
                }
            else:
                error_msg = f"Failed to create Pinterest pin: {response.status_code}"
                self.log_error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Error posting to Pinterest: {str(e)}"
            self.log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def validate_connection(self) -> bool:
        """Validate Pinterest connection"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/user_account")
            return response.status_code == 200
        except Exception:
            return False
