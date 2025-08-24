import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class TokenEncryption:
    """Utility class for encrypting and decrypting OAuth tokens"""
    
    def __init__(self):
        self.secret_key = getattr(settings, 'TOKEN_ENCRYPTION_KEY', None)
        if not self.secret_key:
            raise ImproperlyConfigured(
                "TOKEN_ENCRYPTION_KEY must be set in settings for secure token storage"
            )
        
        # Generate a key from the secret
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'elevate_social_oauth',  # Fixed salt for consistency
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.secret_key.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, text: str) -> str:
        """Encrypt a string"""
        if not text:
            return ""
        return self.cipher.encrypt(text.encode()).decode()
    
    def decrypt(self, encrypted_text: str) -> str:
        """Decrypt a string"""
        if not encrypted_text:
            return ""
        try:
            return self.cipher.decrypt(encrypted_text.encode()).decode()
        except Exception:
            # Return empty string if decryption fails
            return ""


# Global instance
token_encryption = TokenEncryption()


def encrypt_token(token: str) -> str:
    """Convenience function to encrypt a token"""
    return token_encryption.encrypt(token)


def decrypt_token(encrypted_token: str) -> str:
    """Convenience function to decrypt a token"""
    return token_encryption.decrypt(encrypted_token)


# Analytics and Security Utilities
import ipaddress
from django.core.cache import cache
from django.utils import timezone
from django.http import HttpRequest


def get_client_ip(request: HttpRequest) -> str:
    """
    Get client IP address from request with proper proxy handling.
    """
    # Check for forwarded IP (from load balancers, proxies)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP in the chain (original client)
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    
    return ip


def anonymize_ip(ip_address: str) -> str:
    """
    Anonymize IP address for privacy compliance (GDPR/CCPA).
    Masks the last octet of IPv4 and last 80 bits of IPv6.
    """
    if not ip_address:
        return ip_address
    
    try:
        ip = ipaddress.ip_address(ip_address)
        
        if ip.version == 4:
            # IPv4: mask last octet (e.g., 192.168.1.100 -> 192.168.1.0)
            return str(ipaddress.IPv4Address(int(ip) & 0xFFFFFF00))
        else:
            # IPv6: mask last 80 bits (keep first 48 bits - network prefix)
            return str(ipaddress.IPv6Address(int(ip) & (0xFFFFFFFFFFFF0000 << 64)))
    except ValueError:
        # If IP parsing fails, return original (might be a hostname)
        return ip_address


def is_rate_limited(identifier: str, action: str, limit: int = 10, window: int = 60) -> bool:
    """
    Check if an identifier (IP, user) is rate limited for a specific action.
    
    Args:
        identifier: Unique identifier (IP address, user ID, etc.)
        action: Action being performed ('profile_view', 'link_click', etc.)
        limit: Maximum number of actions allowed in the time window
        window: Time window in seconds
        
    Returns:
        True if rate limited, False otherwise
    """
    cache_key = f"rate_limit:{action}:{identifier}"
    
    # Get current count
    current_count = cache.get(cache_key, 0)
    
    if current_count >= limit:
        return True
    
    # Increment counter
    if current_count == 0:
        # First request, set with expiry
        cache.set(cache_key, 1, window)
    else:
        # Increment existing counter (preserve TTL)
        try:
            # Try to get TTL if available (Redis cache)
            remaining_ttl = cache.ttl(cache_key) or window
        except AttributeError:
            # Fallback for caches without ttl method (LocMemCache)
            remaining_ttl = window
        cache.set(cache_key, current_count + 1, remaining_ttl)
    
    return False


def should_track_analytics(request: HttpRequest, user_profile_id: int) -> bool:
    """
    Determine if analytics should be tracked for this request.
    Prevents duplicate tracking from same IP within a short timeframe.
    
    Args:
        request: HTTP request object
        user_profile_id: ID of the profile being tracked
        
    Returns:
        True if should track, False otherwise
    """
    ip = get_client_ip(request)
    
    # Rate limit analytics tracking (max 5 views per IP per profile per minute)
    if is_rate_limited(f"{ip}:{user_profile_id}", 'analytics_track', limit=5, window=60):
        return False
    
    return True


def sanitize_referrer(referrer: str) -> str:
    """
    Sanitize referrer URL to remove sensitive parameters.
    """
    if not referrer:
        return referrer
    
    # Remove common sensitive parameters
    sensitive_params = ['token', 'api_key', 'password', 'secret', 'auth']
    
    try:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        
        parsed = urlparse(referrer)
        query_params = parse_qs(parsed.query)
        
        # Remove sensitive parameters
        clean_params = {
            k: v for k, v in query_params.items() 
            if not any(sensitive in k.lower() for sensitive in sensitive_params)
        }
        
        # Reconstruct URL
        clean_query = urlencode(clean_params, doseq=True)
        clean_url = urlunparse((
            parsed.scheme, parsed.netloc, parsed.path,
            parsed.params, clean_query, parsed.fragment
        ))
        
        return clean_url[:500]  # Limit length
    except Exception:
        # If parsing fails, return truncated original
        return referrer[:500]


