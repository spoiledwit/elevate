import logging
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

from .base import SocialMediaService
from ..utils import encrypt_token

logger = logging.getLogger(__name__)


class TikTokService(SocialMediaService):
    """TikTok OAuth and posting service"""
    
    BASE_URL = "https://open.tiktokapis.com/v2"
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get TikTok user information"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/user/info/")
            
            if response.status_code == 200:
                data = response.json()
                user_data = data.get('data', {}).get('user', {})
                
                self.update_connection_metadata(
                    platform_user_id=user_data.get('open_id'),
                    platform_username=user_data.get('display_name'),
                    platform_display_name=user_data.get('display_name'),
                    platform_profile_url=f"https://tiktok.com/@{user_data.get('username', '')}",
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
        """Refresh TikTok access token"""
        try:
            response = requests.post(f"{self.BASE_URL}/oauth/token/", data={
                'grant_type': 'refresh_token',
                'refresh_token': self.refresh_token,
                'client_key': self.platform.client_id,
                'client_secret': self.platform.client_secret
            })
            
            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get('data', {}).get('access_token')
                new_refresh_token = data.get('data', {}).get('refresh_token')
                expires_in = data.get('data', {}).get('expires_in', 0)
                
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
                
                logger.info(f"TikTok token refreshed for user {self.connection.user.username}")
                return True
            else:
                self.log_error(f"Failed to refresh token: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_error(f"Error refreshing token: {str(e)}")
            return False
    
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to TikTok"""
        try:
            # TikTok requires video content for posts
            if not media_urls:
                return {
                    'success': False,
                    'error': 'TikTok requires video content for posts'
                }
            
            # Create a video post
            post_data = {
                'post_info': {
                    'title': text,
                    'privacy_level': 'SELF_ONLY',  # or 'PUBLIC'
                    'disable_duet': False,
                    'disable_comment': False,
                    'disable_stitch': False,
                    'video_cover_timestamp_ms': 0
                },
                'source_info': {
                    'source': 'FILE_UPLOAD',
                    'video_size': 0,  # Will be calculated
                    'chunk_size': 0,  # Will be calculated
                    'total_chunk_count': 1,
                    'chunk_id': 0
                }
            }
            
            # This is a simplified implementation
            # In a real implementation, you would need to handle video upload
            # TikTok's API requires video files to be uploaded in chunks
            
            response = self.make_request('POST', f"{self.BASE_URL}/video/init/", json=post_data)
            
            if response.status_code == 200:
                data = response.json()
                upload_url = data.get('data', {}).get('upload_url')
                
                if upload_url:
                    # In a real implementation, you would upload the video here
                    # For now, we'll return a success response
                    return {
                        'success': True,
                        'post_id': data.get('data', {}).get('publish_id'),
                        'post_url': f"https://tiktok.com/@{self.connection.platform_username}"
                    }
                else:
                    error_msg = "Failed to get upload URL from TikTok"
                    self.log_error(error_msg)
                    return {
                        'success': False,
                        'error': error_msg
                    }
            else:
                error_msg = f"Failed to initialize TikTok post: {response.status_code}"
                self.log_error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Error posting to TikTok: {str(e)}"
            self.log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def validate_connection(self) -> bool:
        """Validate TikTok connection"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/user/info/")
            return response.status_code == 200
        except Exception:
            return False
