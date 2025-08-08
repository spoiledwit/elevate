#!/usr/bin/env python
"""
Test script for Facebook posting functionality
This script tests the Facebook OAuth and posting APIs
"""

import os
import sys
import requests
import json
from datetime import datetime, timedelta

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

import django
django.setup()

from django.contrib.auth.models import User
from api.models import SocialMediaPlatform, SocialMediaConnection
from rest_framework_simplejwt.tokens import RefreshToken


class FacebookTester:
    """Test class for Facebook functionality"""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.auth_token = None
        self.test_user = None
        
    def get_auth_token(self, username="testuser", password="testpass123"):
        """Get JWT token for authentication"""
        try:
            # Get or create test user
            self.test_user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': 'test@example.com',
                    'password': 'testpass123'
                }
            )
            
            # Generate JWT token
            refresh = RefreshToken.for_user(self.test_user)
            self.auth_token = str(refresh.access_token)
            
            print(f"✅ Authenticated as {username}")
            return True
            
        except Exception as e:
            print(f"❌ Authentication failed: {e}")
            return False
    
    def test_get_platforms(self):
        """Test getting available social media platforms"""
        print("\n🔍 Testing: Get Social Media Platforms")
        
        url = f"{self.base_url}/api/social-platforms/"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {data.get('count', 0)} platforms")
                for platform in data.get('results', []):
                    print(f"  - {platform['display_name']} ({platform['name']})")
                return data
            else:
                print(f"❌ Failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def test_oauth_callback(self, platform="facebook", code="test_code"):
        """Test OAuth callback (with dummy code)"""
        print(f"\n🔍 Testing: OAuth Callback for {platform}")
        
        url = f"{self.base_url}/api/social/oauth/callback/"
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        data = {
            "platform": platform,
            "code": code
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            print(f"Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"✅ OAuth callback processed")
                print(f"  Connection ID: {result.get('id')}")
                return result
            else:
                print(f"❌ Failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def test_post_now(self, text="Test post from Django app!", platforms=["facebook"]):
        """Test immediate posting"""
        print(f"\n🔍 Testing: Immediate Posting")
        
        url = f"{self.base_url}/api/social/posts/post-now/"
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        data = {
            "text": text,
            "platform_names": platforms
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            print(f"Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"✅ Post request processed")
                print(f"  Success: {result.get('success')}")
                
                posts = result.get('posts', [])
                for post in posts:
                    print(f"  Platform: {post.get('platform')}")
                    print(f"  Success: {post.get('success')}")
                    if post.get('post_id'):
                        print(f"  Post ID: {post.get('post_id')}")
                    if post.get('error'):
                        print(f"  Error: {post.get('error')}")
                
                return result
            else:
                print(f"❌ Failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def test_scheduled_post(self, text="Scheduled test post", platforms=["facebook"]):
        """Test scheduled posting"""
        print(f"\n🔍 Testing: Scheduled Posting")
        
        url = f"{self.base_url}/api/social-posts/"
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Schedule for 5 minutes from now
        scheduled_time = (datetime.now() + timedelta(minutes=5)).isoformat()
        
        data = {
            "text": text,
            "platform_names": platforms,
            "scheduled_at": scheduled_time
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            print(f"Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"✅ Scheduled post created")
                print(f"  Post ID: {result.get('id')}")
                print(f"  Scheduled for: {result.get('scheduled_at')}")
                return result
            else:
                print(f"❌ Failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def test_get_connections(self):
        """Test getting user's social media connections"""
        print(f"\n🔍 Testing: Get User Connections")
        
        url = f"{self.base_url}/api/social-connections/"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {data.get('count', 0)} connections")
                for connection in data.get('results', []):
                    print(f"  - {connection['platform']['display_name']} ({connection['platform']['name']})")
                    print(f"    Status: {'Active' if connection['is_active'] else 'Inactive'}")
                    print(f"    Verified: {'Yes' if connection['is_verified'] else 'No'}")
                return data
            else:
                print(f"❌ Failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def test_connection_validation(self, connection_id=1):
        """Test connection validation"""
        print(f"\n🔍 Testing: Connection Validation")
        
        url = f"{self.base_url}/api/social-connections/{connection_id}/validate/"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.post(url, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Connection validation completed")
                print(f"  Valid: {result.get('valid')}")
                if result.get('error'):
                    print(f"  Error: {result.get('error')}")
                return result
            else:
                print(f"❌ Failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Facebook Functionality Tests")
        print("=" * 50)
        
        # Authenticate
        if not self.get_auth_token():
            return
        
        # Test 1: Get platforms
        self.test_get_platforms()
        
        # Test 2: Get connections
        self.test_get_connections()
        
        # Test 3: OAuth callback (will fail with dummy code, but tests endpoint)
        self.test_oauth_callback()
        
        # Test 4: Immediate posting
        self.test_post_now("Hello from Django! This is a test post. 🚀")
        
        # Test 5: Scheduled posting
        self.test_scheduled_post("This is a scheduled test post! 📅")
        
        # Test 6: Connection validation
        self.test_connection_validation()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        print("\n📝 Notes:")
        print("- OAuth callback will fail with dummy code (expected)")
        print("- Posting will fail without real Facebook tokens (expected)")
        print("- Check the responses for detailed error messages")
        print("- Follow FACEBOOK_TESTING_GUIDE.md for real OAuth setup")


def main():
    """Main function"""
    tester = FacebookTester()
    tester.run_all_tests()


if __name__ == '__main__':
    main()
