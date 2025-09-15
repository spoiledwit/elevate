"""
Django management command to test Stripe Connect functionality.

Usage:
    docker compose exec api uv run python manage.py test_stripe_connect
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.services.stripe_connect_service import stripe_connect_service
from api.models import StripeConnectAccount

User = get_user_model()


class Command(BaseCommand):
    help = 'Test Stripe Connect account creation and onboarding'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up test data after running tests',
        )

    def handle(self, *args, **options):
        self.stdout.write("🚀 STRIPE CONNECT TEST")
        self.stdout.write("=" * 50)
        
        # Test 1: Check Stripe API connection
        if not self.test_stripe_connection():
            return
        
        # Test 2: Create/get test user
        user = self.create_test_user()
        if not user:
            return
        
        # Test 3: Create Connect account
        connect_account = self.test_connect_account_creation(user)
        if not connect_account:
            return
        
        # Test 4: Create account link for onboarding
        account_link_url = self.test_account_link_creation(connect_account)
        
        # Test 5: Get account status
        self.test_account_status(connect_account)
        
        # Test 6: Try login link (if onboarding completed)
        self.test_login_link_creation(connect_account)
        
        # Show next steps
        self.print_next_steps(account_link_url, connect_account)
        
        # Optional cleanup
        if options['cleanup']:
            self.cleanup_test_data()

    def test_stripe_connection(self):
        """Test basic Stripe API connection"""
        self.stdout.write("\n🔧 Testing Stripe API connection...")
        
        stripe_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe_key:
            self.stdout.write(
                self.style.ERROR("❌ STRIPE_SECRET_KEY not found in environment")
            )
            return False
        
        try:
            import stripe
            stripe.api_key = stripe_key
            balance = stripe.Balance.retrieve()
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Stripe API connected - Available: ${balance.available[0]['amount']/100:.2f} {balance.available[0]['currency'].upper()}"
                )
            )
            return True
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Stripe API connection failed: {e}")
            )
            return False

    def create_test_user(self):
        """Create or get a test user"""
        self.stdout.write("\n👤 Setting up test user...")
        
        test_email = "test@stripe-connect.com"
        test_username = "stripe_test_user"
        
        try:
            user = User.objects.get(username=test_username)
            self.stdout.write(
                self.style.SUCCESS(f"✅ Using existing test user: {user.username} ({user.email})")
            )
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=test_username,
                email=test_email,
                password="testpassword123"
            )
            self.stdout.write(
                self.style.SUCCESS(f"✅ Created test user: {user.username} ({user.email})")
            )
        
        return user

    def test_connect_account_creation(self, user):
        """Test creating a Stripe Connect account"""
        self.stdout.write("\n🏦 Testing Connect account creation...")
        
        # Check if user already has a Connect account
        try:
            existing_account = user.connect_account
            self.stdout.write(
                self.style.SUCCESS(f"✅ User already has Connect account: {existing_account.stripe_account_id}")
            )
            return existing_account
        except StripeConnectAccount.DoesNotExist:
            pass
        
        try:
            # Create Connect account
            connect_account = stripe_connect_service.create_express_account(
                user=user,
                email=user.email
            )
            self.stdout.write(
                self.style.SUCCESS(f"✅ Created Connect account: {connect_account.stripe_account_id}")
            )
            self.stdout.write(f"   Status: {connect_account.get_status()}")
            self.stdout.write(f"   Charges enabled: {connect_account.charges_enabled}")
            self.stdout.write(f"   Payouts enabled: {connect_account.payouts_enabled}")
            return connect_account
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Failed to create Connect account: {e}")
            )
            return None

    def test_account_link_creation(self, connect_account):
        """Test creating an account link for onboarding"""
        self.stdout.write("\n🔗 Testing account link creation...")
        
        try:
            # Create account link
            account_link_url = stripe_connect_service.create_account_link(
                account_id=connect_account.stripe_account_id,
                refresh_url="http://localhost:3000/settings/payments?refresh=true",
                return_url="http://localhost:3000/settings/payments?success=true"
            )
            self.stdout.write(self.style.SUCCESS("✅ Created account link successfully"))
            self.stdout.write(f"   🎯 Onboarding URL: {account_link_url}")
            return account_link_url
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Failed to create account link: {e}")
            )
            return None

    def test_account_status(self, connect_account):
        """Test getting account status from Stripe"""
        self.stdout.write("\n📊 Testing account status retrieval...")
        
        try:
            status = stripe_connect_service.get_account_status(connect_account.stripe_account_id)
            self.stdout.write(self.style.SUCCESS("✅ Retrieved account status successfully"))
            self.stdout.write(f"   Account ID: {status['account_id']}")
            self.stdout.write(f"   Charges enabled: {status['charges_enabled']}")
            self.stdout.write(f"   Payouts enabled: {status['payouts_enabled']}")
            self.stdout.write(f"   Details submitted: {status['details_submitted']}")
            self.stdout.write(f"   Country: {status['country']}")
            self.stdout.write(f"   Currency: {status['default_currency']}")
            self.stdout.write(f"   Is active: {status['is_active']}")
            
            if status.get('requirements'):
                req = status['requirements']
                if req.get('currently_due'):
                    self.stdout.write(f"   Currently due: {req['currently_due']}")
                if req.get('past_due'):
                    self.stdout.write(
                        self.style.WARNING(f"   Past due: {req['past_due']}")
                    )
            
            return status
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Failed to get account status: {e}")
            )
            return None

    def test_login_link_creation(self, connect_account):
        """Test creating login link to Express Dashboard"""
        self.stdout.write("\n🏠 Testing Express Dashboard login link...")
        
        if not connect_account.details_submitted:
            self.stdout.write(
                self.style.WARNING("⚠️  Skipping login link - account onboarding not completed")
            )
            return None
        
        try:
            login_url = stripe_connect_service.create_login_link(connect_account.stripe_account_id)
            self.stdout.write(self.style.SUCCESS("✅ Created login link successfully"))
            self.stdout.write(f"   Dashboard URL: {login_url}")
            return login_url
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Failed to create login link: {e}")
            )
            return None

    def print_next_steps(self, account_link_url, connect_account):
        """Print next steps for testing"""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("🎯 TESTING NEXT STEPS")
        self.stdout.write("=" * 60)
        
        if account_link_url:
            self.stdout.write("1. ONBOARDING TEST:")
            self.stdout.write(f"   Copy this URL to your browser: {account_link_url}")
            self.stdout.write("   Complete the Stripe onboarding process")
            self.stdout.write("   This will enable charges and payouts")
            self.stdout.write("")
        
        self.stdout.write("2. WEBHOOK TESTING:")
        self.stdout.write("   Run Stripe CLI to test webhooks:")
        self.stdout.write("   stripe listen --forward-to localhost:8000/api/stripe-connect/webhook")
        self.stdout.write("")
        
        self.stdout.write("3. RE-RUN THIS COMMAND:")
        self.stdout.write("   After onboarding, run this command again to see updated status")
        self.stdout.write("   docker compose exec api uv run python manage.py test_stripe_connect")
        self.stdout.write("")
        
        self.stdout.write("4. ADMIN PANEL:")
        self.stdout.write("   Check Django admin: http://localhost:8000/admin/api/stripeconnectaccount/")
        self.stdout.write(f"   Account ID: {connect_account.stripe_account_id}")
        self.stdout.write("")

    def cleanup_test_data(self):
        """Clean up test data"""
        self.stdout.write("\n🗑️  Cleaning up test data...")
        
        try:
            user = User.objects.get(username="stripe_test_user")
            # Note: This will NOT delete the Stripe account, only the local record
            self.stdout.write(
                self.style.WARNING("⚠️  Deleting local records (Stripe account will remain)")
            )
            user.delete()
            self.stdout.write(self.style.SUCCESS("✅ Test data cleaned up"))
        except User.DoesNotExist:
            self.stdout.write("ℹ️  No test data to clean up")