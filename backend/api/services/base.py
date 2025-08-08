import logging
import requests
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from django.utils import timezone
from datetime import datetime, timedelta

from ..models import SocialMediaConnection, SocialMediaPost
from ..utils import decrypt_token

logger = logging.getLogger(__name__)


class SocialMediaService(ABC):
    """Base class for social media platform services"""
    
    def __init__(self, connection: SocialMediaConnection):
        self.connection = connection
        self.platform = connection.platform
        self.access_token = decrypt_token(connection.access_token)
        self.refresh_token = decrypt_token(connection.refresh_token) if connection.refresh_token else None
    
    @abstractmethod
    def get_user_info(self) -> Dict[str, Any]:
        """Get user information from the platform"""
        pass
    
    @abstractmethod
    def refresh_access_token(self) -> bool:
        """Refresh the access token"""
        pass
    
    @abstractmethod
    def post_content(self, text: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Post content to the platform"""
        pass
    
    @abstractmethod
    def validate_connection(self) -> bool:
        """Validate if the connection is still valid"""
        pass
    
    def make_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Make an authenticated request to the platform API"""
        headers = kwargs.get('headers', {})
        headers.update({
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        })
        kwargs['headers'] = headers
        
        response = requests.request(method, url, **kwargs)
        
        # Handle token refresh if needed
        if response.status_code == 401:
            if self.refresh_access_token():
                # Retry the request with new token
                headers['Authorization'] = f'Bearer {self.access_token}'
                response = requests.request(method, url, **kwargs)
        
        return response
    
    def update_connection_metadata(self, **kwargs):
        """Update connection metadata"""
        for key, value in kwargs.items():
            if hasattr(self.connection, key):
                setattr(self.connection, key, value)
        
        self.connection.last_used_at = timezone.now()
        self.connection.save()
    
    def log_error(self, error: str):
        """Log an error and update connection"""
        logger.error(f"Platform {self.platform.name} error for user {self.connection.user.username}: {error}")
        self.connection.last_error = error
        self.connection.save()
