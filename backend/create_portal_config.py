#!/usr/bin/env python3
"""
Script to create a custom Stripe Customer Portal configuration for Elevate Social.
Run this script once to set up the portal branding.

Usage: python create_portal_config.py
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Load environment variables from .env.backend
env_file = project_root.parent / '.env.backend'
if env_file.exists():
    print(f"📁 Loading environment from: {env_file}")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value
    print("✅ Environment variables loaded")
else:
    print(f"⚠️  Environment file not found: {env_file}")
    print("Please make sure .env.backend exists in the project root")

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

import stripe
from django.conf import settings

def create_elevate_portal_config():
    """Create a custom Stripe Customer Portal configuration for Elevate Social."""
    
    # Initialize Stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    if not stripe.api_key:
        print("❌ Error: STRIPE_SECRET_KEY not found in environment variables")
        return None
    
    try:
        print("🔍 Checking for existing Elevate Social portal configurations...")
        
        # List existing configurations
        configurations = stripe.billing_portal.Configuration.list(limit=10)
        
        # Check if we already have an Elevate Social configuration
        for config in configurations.data:
            if config.business_profile and config.business_profile.headline == "Elevate Social":
                print(f"✅ Found existing Elevate Social portal configuration: {config.id}")
                return config.id
        
        print("🛠️ Creating new Elevate Social portal configuration...")
        
        # Create new configuration with Elevate Social branding
        configuration = stripe.billing_portal.Configuration.create(
            business_profile={
                "headline": "Elevate Social",
                "privacy_policy_url": f"{settings.FRONTEND_URL}/privacy",
                "terms_of_service_url": f"{settings.FRONTEND_URL}/terms",
            },
            features={
                "customer_update": {
                    "allowed_updates": ["email", "name", "phone", "address"],
                    "enabled": True,
                },
                "invoice_history": {"enabled": True},
                "payment_method_update": {"enabled": True},
                "subscription_cancel": {
                    "enabled": True,
                    "mode": "at_period_end",
                    "proration_behavior": "none",
                    "cancellation_reason": {
                        "enabled": True,
                        "options": [
                            "too_expensive",
                            "missing_features", 
                            "switched_service",
                            "unused",
                            "customer_service",
                            "too_complex",
                            "low_quality",
                            "other"
                        ]
                    }
                },
                "subscription_pause": {"enabled": False},
                "subscription_update": {
                    "enabled": False,  # Disable for now to avoid product specification
                    "default_allowed_updates": ["promotion_code"],
                    "proration_behavior": "create_prorations"
                },
            },
            default_return_url=f"{settings.FRONTEND_URL}/dashboard/subscription",
            login_page={
                "enabled": True
            },
            metadata={
                "created_by": "elevate_social_setup",
                "brand": "elevate_social"
            }
        )
        
        print(f"✅ Successfully created Elevate Social portal configuration!")
        print(f"📋 Configuration ID: {configuration.id}")
        print(f"🌐 Frontend URL: {settings.FRONTEND_URL}")
        print(f"🔗 Return URL: {settings.FRONTEND_URL}/dashboard/subscription")
        
        return configuration.id
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def list_existing_configs():
    """List all existing portal configurations."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    try:
        print("\n📋 Existing Portal Configurations:")
        print("-" * 50)
        
        configurations = stripe.billing_portal.Configuration.list(limit=10)
        
        if not configurations.data:
            print("No configurations found.")
            return
        
        for i, config in enumerate(configurations.data, 1):
            headline = "Unknown"
            if config.business_profile and config.business_profile.headline:
                headline = config.business_profile.headline
            
            print(f"{i}. ID: {config.id}")
            print(f"   Headline: {headline}")
            print(f"   Active: {config.is_default}")
            print(f"   Created: {config.created}")
            print()
            
    except Exception as e:
        print(f"❌ Error listing configurations: {e}")

if __name__ == "__main__":
    print("🚀 Elevate Social - Stripe Portal Configuration Setup")
    print("=" * 55)
    
    # List existing configurations first
    list_existing_configs()
    
    # Create or find Elevate Social configuration
    config_id = create_elevate_portal_config()
    
    if config_id:
        print(f"\n🎉 Portal configuration ready!")
        print(f"📝 Next steps:")
        print(f"   1. Update your Stripe service to use configuration: {config_id}")
        print(f"   2. Test the portal with a customer")
        print(f"   3. Customize further in Stripe Dashboard if needed")
    else:
        print("\n❌ Failed to create portal configuration.")
        print("Please check your Stripe keys and try again.")