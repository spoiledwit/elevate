import logging
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

from .base import SocialMediaService
from ..utils import encrypt_token

logger = logging.getLogger(__name__)


class LinkedInService(SocialMediaService):
    """LinkedIn OAuth and posting service"""
    
    BASE_URL = "https://api.linkedin.com/v2"
    
    def get_user_info(self) -> Dict[str, Any]:
        """Get LinkedIn user information"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/me")
            
            if response.status_code == 200:
                data = response.json()
                self.update_connection_metadata(
                    platform_user_id=data.get('id'),
                    platform_username=data.get('localizedFirstName', '') + ' ' + data.get('localizedLastName', ''),
                    platform_display_name=data.get('localizedFirstName', '') + ' ' + data.get('localizedLastName', ''),
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
        """Refresh LinkedIn access token"""
        try:
            response = requests.post('https://www.linkedin.com/oauth/v2/accessToken', data={
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
                
                logger.info(f"LinkedIn token refreshed for user {self.connection.user.username}")
                return True
            else:
                self.log_error(f"Failed to refresh token: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_error(f"Error refreshing token: {str(e)}")
            return False
    
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to LinkedIn"""
        try:
            # LinkedIn requires a specific format for posts
            post_data = {
                "author": f"urn:li:person:{self.connection.platform_user_id}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": text
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            # Add media if provided
            if media_urls:
                post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
                post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                    {
                        "status": "READY",
                        "description": {
                            "text": "Image"
                        },
                        "media": f"urn:li:digitalmediaAsset:{media_urls[0]}",
                        "title": {
                            "text": "Image"
                        }
                    }
                ]
            
            response = self.make_request('POST', f"{self.BASE_URL}/ugcPosts", json=post_data)
            
            if response.status_code == 201:
                data = response.json()
                return {
                    'success': True,
                    'post_id': data.get('id'),
                    'post_url': f"https://linkedin.com/feed/update/{data.get('id')}"
                }
            else:
                error_msg = f"Failed to post to LinkedIn: {response.status_code}"
                self.log_error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Error posting to LinkedIn: {str(e)}"
            self.log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def validate_connection(self) -> bool:
        """Validate LinkedIn connection"""
        try:
            response = self.make_request('GET', f"{self.BASE_URL}/me")
            return response.status_code == 200
        except Exception:
            return False
