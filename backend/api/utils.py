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


# Email Validation Utilities
from email_validator import validate_email as ev_validate, EmailNotValidError, caching_resolver
from disposable_email_checker.validators import validate_disposable_email as check_disposable
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

# Create a cached DNS resolver for better performance
_dns_resolver = caching_resolver(timeout=10)


class EmailValidationError(Exception):
    """Custom exception for email validation failures"""
    pass


def validate_email_address(
    email: str,
    check_dns: bool = True,
    check_disposable: bool = True,
    raise_exception: bool = True
) -> tuple[bool, str, str]:
    """
    Comprehensive email validation with syntax, DNS, and disposable checks.

    Args:
        email: Email address to validate
        check_dns: Whether to check DNS/MX records (adds network latency)
        check_disposable: Whether to check for disposable email providers
        raise_exception: Whether to raise exception on validation failure

    Returns:
        tuple: (is_valid, normalized_email, error_message)

    Raises:
        EmailValidationError: If raise_exception=True and validation fails

    Examples:
        # For user registration (strict validation)
        is_valid, email, error = validate_email_address(
            'user@example.com',
            check_dns=True,
            check_disposable=True
        )

        # For order emails (lenient validation)
        is_valid, email, error = validate_email_address(
            'customer@example.com',
            check_dns=False,
            check_disposable=False
        )

        # Before sending email (syntax only)
        is_valid, email, error = validate_email_address(
            'recipient@example.com',
            check_dns=False,
            check_disposable=False,
            raise_exception=False
        )
    """
    if not email:
        error_msg = "Email address is required"
        if raise_exception:
            raise EmailValidationError(error_msg)
        return (False, email if email else "", error_msg)

    # Strip whitespace
    email = email.strip()

    # Step 1: Syntax validation (always required)
    try:
        emailinfo = ev_validate(
            email,
            check_deliverability=check_dns,
            dns_resolver=_dns_resolver if check_dns else None
        )
        normalized_email = emailinfo.normalized
    except EmailNotValidError as e:
        error_msg = str(e)
        logger.warning(f"Email validation failed for {email}: {error_msg}")
        if raise_exception:
            raise EmailValidationError(error_msg)
        return (False, email, error_msg)

    # Step 2: Disposable email check (optional)
    if check_disposable:
        try:
            check_disposable(normalized_email)
        except ValidationError as e:
            error_msg = f"Disposable email addresses are not allowed: {str(e)}"
            logger.warning(f"Disposable email detected: {normalized_email}")
            if raise_exception:
                raise EmailValidationError(error_msg)
            return (False, normalized_email, error_msg)

    return (True, normalized_email, "")


def validate_email_with_cache(
    email: str,
    check_dns: bool = True,
    check_disposable: bool = True,
    cache_ttl: int = 3600
) -> tuple[bool, str, str]:
    """
    Validate email with caching to improve performance for repeated validations.
    Useful for bulk operations or high-traffic scenarios.

    Args:
        email: Email address to validate
        check_dns: Whether to check DNS/MX records
        check_disposable: Whether to check for disposable email providers
        cache_ttl: Cache time-to-live in seconds (default: 1 hour)

    Returns:
        tuple: (is_valid, normalized_email, error_message)
    """
    # Create cache key based on validation parameters
    cache_key = f"email_validation:{email}:{check_dns}:{check_disposable}"

    # Check cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    # Perform validation
    result = validate_email_address(
        email,
        check_dns=check_dns,
        check_disposable=check_disposable,
        raise_exception=False
    )

    # Cache the result
    cache.set(cache_key, result, cache_ttl)

    return result


def is_valid_email(email: str, check_dns: bool = False) -> bool:
    """
    Simple boolean check for email validity.

    Args:
        email: Email address to validate
        check_dns: Whether to check DNS/MX records

    Returns:
        bool: True if valid, False otherwise
    """
    is_valid, _, _ = validate_email_address(
        email,
        check_dns=check_dns,
        check_disposable=False,
        raise_exception=False
    )
    return is_valid


