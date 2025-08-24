"""
Django management command to subscribe Facebook pages to webhooks
"""
import logging
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, models

from api.models import SocialMediaConnection
from api.services.integrations.meta_service import MetaService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Subscribe Facebook pages to webhooks for comment automation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--page-name',
            type=str,
            help='Name of the Facebook page to subscribe (e.g., "Testjj")',
        )
        parser.add_argument(
            '--page-id',
            type=str,
            help='Facebook page ID to subscribe',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='User ID who owns the page connection',
        )
        parser.add_argument(
            '--all-pages',
            action='store_true',
            help='Subscribe all connected Facebook pages to webhooks',
        )
        parser.add_argument(
            '--list-pages',
            action='store_true',
            help='List all connected Facebook pages',
        )

    def handle(self, *args, **options):
        if options['list_pages']:
            self.list_facebook_pages()
            return

        if options['all_pages']:
            self.subscribe_all_pages()
            return

        page_name = options.get('page_name')
        page_id = options.get('page_id')
        user_id = options.get('user_id')

        if not (page_name or page_id):
            raise CommandError(
                'You must specify either --page-name, --page-id, or use --all-pages'
            )

        if page_name:
            self.subscribe_page_by_name(page_name, user_id)
        elif page_id:
            self.subscribe_page_by_id(page_id, user_id)

    def list_facebook_pages(self):
        """List all connected Facebook pages."""
        self.stdout.write("🔍 Listing all connected Facebook pages...")
        self.stdout.write("=" * 80)

        connections = SocialMediaConnection.objects.filter(
            platform__name='facebook',
            is_active=True
        ).select_related('user', 'platform')

        if not connections:
            self.stdout.write(
                self.style.WARNING("No active Facebook page connections found.")
            )
            return

        for conn in connections:
            self.stdout.write(f"\n📄 Page: {conn.facebook_page_name or conn.platform_display_name}")
            self.stdout.write(f"   ID: {conn.facebook_page_id}")
            self.stdout.write(f"   User: {conn.user.username} (ID: {conn.user.id})")
            self.stdout.write(f"   Username: {conn.platform_username}")
            self.stdout.write(f"   Connection ID: {conn.id}")

        self.stdout.write(f"\n✅ Found {connections.count()} active Facebook connections")

    def subscribe_all_pages(self):
        """Subscribe all connected Facebook pages to webhooks."""
        self.stdout.write("🚀 Subscribing all Facebook pages to webhooks...")
        
        connections = SocialMediaConnection.objects.filter(
            platform__name='facebook',
            is_active=True
        ).select_related('user')

        if not connections:
            self.stdout.write(
                self.style.WARNING("No active Facebook page connections found.")
            )
            return

        success_count = 0
        error_count = 0

        for conn in connections:
            try:
                result = self.subscribe_connection_to_webhooks(conn)
                if result:
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error subscribing {conn.facebook_page_name}: {e}")
                )
                error_count += 1

        self.stdout.write(f"\n📊 Results:")
        self.stdout.write(f"   ✅ Successful: {success_count}")
        self.stdout.write(f"   ❌ Failed: {error_count}")

    def subscribe_page_by_name(self, page_name, user_id=None):
        """Subscribe a specific page by name to webhooks."""
        self.stdout.write(f"🎯 Looking for Facebook page: '{page_name}'")

        # Build query
        query = SocialMediaConnection.objects.filter(
            platform__name='facebook',
            is_active=True
        )

        # Add page name filter (case insensitive)
        query = query.filter(
            models.Q(facebook_page_name__icontains=page_name) |
            models.Q(platform_display_name__icontains=page_name) |
            models.Q(platform_username__icontains=page_name)
        )

        # Add user filter if specified
        if user_id:
            query = query.filter(user_id=user_id)

        connections = query.select_related('user')

        if not connections.exists():
            if user_id:
                self.stdout.write(
                    self.style.ERROR(
                        f"❌ No Facebook page matching '{page_name}' found for user ID {user_id}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ No Facebook page matching '{page_name}' found")
                )
            
            # Show available pages
            self.stdout.write("\n💡 Available pages:")
            self.list_facebook_pages()
            return

        if connections.count() > 1:
            self.stdout.write(
                self.style.WARNING(f"⚠️  Found {connections.count()} matching pages:")
            )
            for conn in connections:
                self.stdout.write(f"   - {conn.facebook_page_name} (User: {conn.user.username})")
            
            self.stdout.write("\n💡 Please specify --user-id to choose a specific page")
            return

        # Subscribe the found page
        connection = connections.first()
        self.stdout.write(f"✅ Found page: {connection.facebook_page_name}")
        self.stdout.write(f"   Owner: {connection.user.username}")
        self.stdout.write(f"   Page ID: {connection.facebook_page_id}")

        result = self.subscribe_connection_to_webhooks(connection)
        if result:
            self.stdout.write(
                self.style.SUCCESS(f"🎉 Successfully subscribed '{page_name}' to webhooks!")
            )
        else:
            self.stdout.write(
                self.style.ERROR(f"❌ Failed to subscribe '{page_name}' to webhooks")
            )

    def subscribe_page_by_id(self, page_id, user_id=None):
        """Subscribe a specific page by ID to webhooks."""
        self.stdout.write(f"🎯 Looking for Facebook page ID: {page_id}")

        query = SocialMediaConnection.objects.filter(
            platform__name='facebook',
            facebook_page_id=page_id,
            is_active=True
        )

        if user_id:
            query = query.filter(user_id=user_id)

        try:
            connection = query.select_related('user').get()
        except SocialMediaConnection.DoesNotExist:
            if user_id:
                self.stdout.write(
                    self.style.ERROR(
                        f"❌ No Facebook page with ID {page_id} found for user ID {user_id}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ No Facebook page with ID {page_id} found")
                )
            return

        self.stdout.write(f"✅ Found page: {connection.facebook_page_name}")
        self.stdout.write(f"   Owner: {connection.user.username}")

        result = self.subscribe_connection_to_webhooks(connection)
        if result:
            self.stdout.write(
                self.style.SUCCESS(f"🎉 Successfully subscribed page {page_id} to webhooks!")
            )
        else:
            self.stdout.write(
                self.style.ERROR(f"❌ Failed to subscribe page {page_id} to webhooks")
            )

    def subscribe_connection_to_webhooks(self, connection):
        """Subscribe a specific connection to webhooks."""
        try:
            self.stdout.write(f"📡 Subscribing {connection.facebook_page_name} to webhooks...")

            meta_service = MetaService(connection)
            result = meta_service.subscribe_page_to_webhooks(
                connection.facebook_page_id, 
                connection
            )

            if result.get('success'):
                self.stdout.write(
                    self.style.SUCCESS(f"   ✅ {connection.facebook_page_name} subscribed successfully")
                )
                self.stdout.write(f"   Result: {result.get('result')}")
                return True
            else:
                error = result.get('error', 'Unknown error')
                status_code = result.get('status_code')
                error_details = result.get('error_details', {})
                
                self.stdout.write(
                    self.style.ERROR(f"   ❌ Failed: {error}")
                )
                
                if status_code:
                    self.stdout.write(f"   Status Code: {status_code}")
                
                if error_details:
                    self.stdout.write(f"   Error Details: {error_details}")
                    
                    # Show specific Facebook error messages
                    if 'message' in error_details:
                        self.stdout.write(f"   Facebook Message: {error_details['message']}")
                    if 'code' in error_details:
                        self.stdout.write(f"   Facebook Code: {error_details['code']}")
                    if 'error_subcode' in error_details:
                        self.stdout.write(f"   Facebook Subcode: {error_details['error_subcode']}")
                
                return False

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"   ❌ Exception: {e}")
            )
            logger.error(f"Error subscribing {connection.facebook_page_name} to webhooks: {e}")
            return False