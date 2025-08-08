from typing import Dict, Type
from .base import SocialMediaService
from .facebook import FacebookService
from .instagram import InstagramService
from .linkedin import LinkedInService
from .youtube import YouTubeService
from .tiktok import TikTokService
from .pinterest import PinterestService


class SocialMediaServiceFactory:
    """Factory for creating social media service instances"""
    
    _services: Dict[str, Type[SocialMediaService]] = {
        'facebook': FacebookService,
        'instagram': InstagramService,
        'linkedin': LinkedInService,
        'youtube': YouTubeService,
        'tiktok': TikTokService,
        'pinterest': PinterestService,
    }
    
    @classmethod
    def get_service(cls, platform_name: str, connection) -> SocialMediaService:
        """Get a service instance for the specified platform"""
        service_class = cls._services.get(platform_name.lower())
        if not service_class:
            raise ValueError(f"Unsupported platform: {platform_name}")
        
        return service_class(connection)
    
    @classmethod
    def get_supported_platforms(cls) -> list:
        """Get list of supported platform names"""
        return list(cls._services.keys())
    
    @classmethod
    def is_supported(cls, platform_name: str) -> bool:
        """Check if a platform is supported"""
        return platform_name.lower() in cls._services
