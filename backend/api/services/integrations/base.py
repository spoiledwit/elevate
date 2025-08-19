"""
Base Integration Service

Abstract base class for all social media platform integrations.
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class BaseIntegrationService(ABC):
    """
    Abstract base class for social media platform integrations.
    
    All platform-specific services should inherit from this class
    and implement the required methods.
    """
    
    def __init__(self):
        self.platform_name = self.__class__.__name__.replace('Service', '').lower()
        self.logger = logging.getLogger(f"api.services.integrations.{self.platform_name}")
    
    @abstractmethod
    def connect_account(self, user, auth_code: str, **kwargs) -> Dict[str, Any]:
        """
        Connect a user's account to the social media platform.
        
        Args:
            user: Django User instance
            auth_code: OAuth authorization code
            **kwargs: Platform-specific parameters
            
        Returns:
            Dict containing connection information
            
        Raises:
            IntegrationError: If connection fails
        """
        pass
    
    @abstractmethod
    def publish_post(self, connection, content: str, media_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Publish a post to the social media platform.
        
        Args:
            connection: SocialMediaConnection instance
            content: Post text content
            media_url: Optional media URL to include
            **kwargs: Platform-specific options
            
        Returns:
            Dict containing post information (id, url, etc.)
            
        Raises:
            IntegrationError: If publishing fails
        """
        pass
    
    @abstractmethod
    def refresh_token(self, connection) -> bool:
        """
        Refresh the access token for a connection.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if refresh successful, False otherwise
            
        Raises:
            IntegrationError: If refresh fails
        """
        pass
    
    @abstractmethod
    def disconnect_account(self, connection) -> bool:
        """
        Disconnect a user's account from the platform.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if disconnection successful, False otherwise
        """
        pass
    
    def log_error(self, message: str, error: Exception = None, **kwargs):
        """Log an error with context information."""
        if error:
            self.logger.error(f"{message}: {str(error)}", extra=kwargs, exc_info=True)
        else:
            self.logger.error(message, extra=kwargs)
    
    def log_info(self, message: str, **kwargs):
        """Log an info message with context information."""
        self.logger.info(message, extra=kwargs)


class IntegrationError(Exception):
    """Custom exception for integration-related errors."""
    
    def __init__(self, message: str, platform: str = None, error_code: str = None):
        self.platform = platform
        self.error_code = error_code
        super().__init__(message)