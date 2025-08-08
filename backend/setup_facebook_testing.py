#!/usr/bin/env python
"""
Setup script for Facebook testing
Run this script to initialize the Facebook platform and create test data
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import SocialMediaPlatform, SocialMediaConnection
from django.conf import settings


def create_facebook_platform():
    """Create Facebook platform if it doesn't exist"""
    try:
        platform = SocialMediaPlatform.objects.get(name='facebook')
        print(f"Facebook platform already exists: {platform}")
        return platform
    except SocialMediaPlatform.DoesNotExist:
        # Get Facebook settings from environment
        facebook_config = settings.SOCIAL_MEDIA_PLATFORMS.get('facebook', {})
        
        if not facebook_config:
            print("❌ Facebook configuration not found in settings.SOCIAL_MEDIA_PLATFORMS")
            print("Please add Facebook configuration to your settings.py")
            return None
        
        platform = SocialMediaPlatform.objects.create(
            name='facebook',
            display_name='Facebook',
            client_id=facebook_config.get('client_id', ''),
            client_secret=facebook_config.get('client_secret', ''),
            auth_url=facebook_config.get('auth_url', 'https://www.facebook.com/v18.0/dialog/oauth'),
            token_url=facebook_config.get('token_url', 'https://graph.facebook.com/v18.0/oauth/access_token'),
            scope=facebook_config.get('scope', 'email,public_profile,publish_actions'),
            is_active=True
        )
        print(f"✅ Created Facebook platform: {platform}")
        return platform


def create_test_user():
    """Create a test user if it doesn't exist"""
    try:
        user = User.objects.get(username='testuser')
        print(f"Test user already exists: {user}")
        return user
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"✅ Created test user: {user}")
        return user


def create_test_connection(user, platform):
    """Create a test Facebook connection (with dummy tokens)"""
    try:
        connection = SocialMediaConnection.objects.get(user=user, platform=platform)
        print(f"Test connection already exists: {connection}")
        return connection
    except SocialMediaConnection.DoesNotExist:
        # Create a dummy connection for testing
        from api.utils import encrypt_token
        
        connection = SocialMediaConnection.objects.create(
            user=user,
            platform=platform,
            access_token=encrypt_token('dummy_access_token'),
            refresh_token=encrypt_token('dummy_refresh_token'),
            token_type='Bearer',
            expires_at=datetime.now() + timedelta(hours=1),
            scope='email,public_profile,publish_actions',
            platform_user_id='123456789',
            platform_username='testuser',
            platform_display_name='Test User',
            platform_profile_url='https://facebook.com/testuser',
            is_active=True,
            is_verified=True
        )
        print(f"✅ Created test Facebook connection: {connection}")
        return connection


def check_environment():
    """Check if required environment variables are set"""
    print("🔍 Checking environment configuration...")
    
    required_vars = [
        'FACEBOOK_CLIENT_ID',
        'FACEBOOK_CLIENT_SECRET',
        'TOKEN_ENCRYPTION_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file")
        return False
    
    print("✅ Environment variables are configured")
    return True


def main():
    """Main setup function"""
    print("🚀 Setting up Facebook testing environment...")
    print("=" * 50)
    
    # Check environment
    if not check_environment():
        return
    
    # Create Facebook platform
    platform = create_facebook_platform()
    if not platform:
        return
    
    # Create test user
    user = create_test_user()
    
    # Create test connection
    connection = create_test_connection(user, platform)
    
    print("\n" + "=" * 50)
    print("✅ Setup complete!")
    print("\n📋 Next steps:")
    print("1. Start your Django server: python manage.py runserver")
    print("2. Start Redis: docker run -d -p 6379:6379 redis:alpine")
    print("3. Start Celery worker: celery -A api worker --loglevel=info")
    print("4. Follow the testing guide in FACEBOOK_TESTING_GUIDE.md")
    print("\n🔑 Test credentials:")
    print(f"Username: {user.username}")
    print(f"Password: testpass123")
    print(f"User ID: {user.id}")
    print(f"Connection ID: {connection.id}")


if __name__ == '__main__':
    main()
