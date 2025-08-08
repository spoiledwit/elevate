import logging
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

from .base import SocialMediaService
from ..utils import encrypt_token

logger = logging.getLogger(__name__)


class FacebookService(SocialMediaService):
    """Facebook OAuth and posting service"""
    
    BASE_URL = "https://graph.facebook.com/v18.0"
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get Facebook user information"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/me", params={
                'fields': 'id,name,username,link'
            })
            
            if response.status_code == 200:
                data = response.json()
                self.update_connection_metadata(
                    platform_user_id=data.get('id'),
                    platform_username=data.get('username'),
                    platform_display_name=data.get('name'),
                    platform_profile_url=data.get('link'),
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
        """Refresh Facebook access token"""
        try:
            response = requests.post(f"{self.BASE_URL}/oauth/access_token", data={
                'grant_type': 'fb_exchange_token',
                'client_id': self.platform.client_id,
                'client_secret': self.platform.client_secret,
                'fb_exchange_token': self.access_token
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
                
                logger.info(f"Facebook token refreshed for user {self.connection.user.username}")
                return True
            else:
                self.log_error(f"Failed to refresh token: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_error(f"Error refreshing token: {str(e)}")
            return False
    
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to Facebook"""
        try:
            # For now, we'll post to the user's feed
            # In a real implementation, you might want to post to pages or groups
            post_data = {
                'message': text
            }
            
            response = self.make_request('POST', f"{self.BASE_URL}/me/feed", data=post_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'post_id': data.get('id'),
                    'post_url': f"https://facebook.com/{data.get('id')}"
                }
            else:
                error_msg = f"Failed to post to Facebook: {response.status_code}"
                self.log_error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Error posting to Facebook: {str(e)}"
            self.log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def validate_connection(self) -> bool:
        """Validate Facebook connection"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/me")
            return response.status_code == 200
        except Exception:
            return False
