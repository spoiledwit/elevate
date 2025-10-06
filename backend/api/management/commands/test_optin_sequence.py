from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Order, OptinFollowupEmail, ScheduledOptinEmail


class Command(BaseCommand):
    help = 'Test opt-in email sequence by scheduling emails with 1-minute intervals'

    def add_arguments(self, parser):
        parser.add_argument(
            'order_id',
            type=str,
            help='Order ID to schedule test emails for'
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=1,
            help='Interval in minutes between emails (default: 1 minute)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing scheduled emails for this order first'
        )

    def handle(self, *args, **options):
        order_id = options['order_id']
        interval_minutes = options['interval']
        clear_existing = options['clear']

        try:
            # Get the order
            order = Order.objects.get(order_id=order_id)
            self.stdout.write(f'Found order: {order.order_id} - {order.customer_email}')

            if order.custom_link.type != 'opt_in':
                self.stdout.write(
                    self.style.WARNING(f'Warning: Order type is "{order.custom_link.type}", not "opt_in"')
                )
                proceed = input('Do you want to continue? (yes/no): ')
                if proceed.lower() != 'yes':
                    self.stdout.write('Aborted.')
                    return

            # Clear existing scheduled emails if requested
            if clear_existing:
                deleted_count = ScheduledOptinEmail.objects.filter(order=order).delete()[0]
                self.stdout.write(
                    self.style.WARNING(f'Deleted {deleted_count} existing scheduled emails')
                )

            # Get all active email templates
            email_templates = OptinFollowupEmail.objects.filter(is_active=True).order_by('step_number')

            if not email_templates.exists():
                self.stdout.write(
                    self.style.ERROR('No active opt-in email templates found! Run create_optin_emails first.')
                )
                return

            self.stdout.write(f'\nFound {email_templates.count()} active email templates')
            self.stdout.write(f'Scheduling with {interval_minutes} minute intervals\n')

            now = timezone.now()
            scheduled_count = 0

            for idx, template in enumerate(email_templates):
                # Schedule with minute intervals instead of day intervals
                scheduled_datetime = now + timedelta(minutes=idx * interval_minutes)

                # Create scheduled email
                scheduled_email = ScheduledOptinEmail.objects.create(
                    order=order,
                    email_template=template,
                    scheduled_for=scheduled_datetime
                )
                scheduled_count += 1

                # Display schedule
                time_until = scheduled_datetime - now
                minutes_until = int(time_until.total_seconds() / 60)

                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Email {template.step_number:2d} scheduled for {scheduled_datetime.strftime("%Y-%m-%d %H:%M:%S")} '
                        f'(in {minutes_until} min) - {template.subject[:50]}...'
                    )
                )

            # Summary
            self.stdout.write('\n' + '='*70)
            self.stdout.write('TEST SEQUENCE SCHEDULED')
            self.stdout.write('='*70)
            self.stdout.write(f'Order: {order.order_id}')
            self.stdout.write(f'Customer: {order.customer_email}')
            self.stdout.write(f'Total emails scheduled: {scheduled_count}')
            self.stdout.write(f'Interval: {interval_minutes} minute(s)')
            self.stdout.write(f'First email: {now.strftime("%Y-%m-%d %H:%M:%S")}')
            self.stdout.write(f'Last email: {(now + timedelta(minutes=(scheduled_count-1) * interval_minutes)).strftime("%Y-%m-%d %H:%M:%S")}')

            self.stdout.write('\n' + self.style.WARNING('IMPORTANT:'))
            self.stdout.write('Make sure Celery worker is running:')
            self.stdout.write('  docker compose logs -f celery')
            self.stdout.write('\nThe send_scheduled_optin_emails task runs every 5 minutes.')
            self.stdout.write('Monitor the admin panel to see emails being sent:\n')
            self.stdout.write('  Scheduled Opt-in Emails section\n')

        except Order.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Order with ID "{order_id}" not found!')
            )
            self.stdout.write('\nAvailable opt-in orders:')

            optin_orders = Order.objects.filter(
                custom_link__type='opt_in'
            ).order_by('-created_at')[:10]

            if optin_orders.exists():
                for order in optin_orders:
                    self.stdout.write(f'  • {order.order_id} - {order.customer_email} - {order.created_at.strftime("%Y-%m-%d %H:%M")}')
            else:
                self.stdout.write('  No opt-in orders found.')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )
