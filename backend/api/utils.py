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


