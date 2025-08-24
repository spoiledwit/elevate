"""
Social Media Service Factory

Factory class to get the appropriate service for each platform.
"""

from .integrations.meta_service import MetaService
from .integrations.pinterest_service import PinterestService  
from .integrations.linkedin_service import LinkedInService


class SocialMediaServiceFactory:
    """Factory to get the appropriate service for each social media platform"""
    
    SERVICES = {
        'facebook': MetaService,
        'instagram': MetaService,  # Instagram uses Meta service
        'pinterest': PinterestService,
        'linkedin': LinkedInService,
    }
    
    @classmethod
    def get_service(cls, platform_name: str, connection):
        """
        Get the appropriate service for the given platform
        
        Args:
            platform_name (str): Name of the platform (e.g., 'facebook', 'instagram')
            connection: SocialMediaConnection instance
            
        Returns:
            Service instance for the platform
            
        Raises:
            ValueError: If platform is not supported
        """
        service_class = cls.SERVICES.get(platform_name.lower())
        
        if not service_class:
            raise ValueError(f"Unsupported platform: {platform_name}")
        
        return service_class(connection)
    
    @classmethod
    def get_supported_platforms(cls):
        """Get list of supported platform names"""
        return list(cls.SERVICES.keys())
    
    @classmethod
    def is_platform_supported(cls, platform_name: str) -> bool:
        """Check if a platform is supported"""
        return platform_name.lower() in cls.SERVICES