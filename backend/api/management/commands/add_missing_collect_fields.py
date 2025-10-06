from django.core.management.base import BaseCommand
from api.models import CustomLink, CollectInfoField


class Command(BaseCommand):
    help = 'Add missing name and email collect info fields to all custom links'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made\n'))

        # Get all custom links
        all_links = CustomLink.objects.all()
        total_links = all_links.count()

        self.stdout.write(f'Checking {total_links} custom links...\n')

        links_updated = 0
        name_fields_created = 0
        email_fields_created = 0

        fields_to_create = []

        for link in all_links:
            # Check if name field exists
            has_name_field = CollectInfoField.objects.filter(
                custom_link=link,
                field_type='text',
                label__icontains='name'
            ).exists()

            # Check if email field exists
            has_email_field = CollectInfoField.objects.filter(
                custom_link=link,
                field_type='email'
            ).exists()

            link_updated = False

            # Create name field if missing
            if not has_name_field:
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Would create name field for link: {link.title} (ID: {link.id})'
                        )
                    )
                else:
                    fields_to_create.append(
                        CollectInfoField(
                            custom_link=link,
                            field_type='text',
                            label='Full Name',
                            placeholder='Enter your full name',
                            is_required=True,
                            order=0
                        )
                    )
                name_fields_created += 1
                link_updated = True

            # Create email field if missing
            if not has_email_field:
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Would create email field for link: {link.title} (ID: {link.id})'
                        )
                    )
                else:
                    fields_to_create.append(
                        CollectInfoField(
                            custom_link=link,
                            field_type='email',
                            label='Email Address',
                            placeholder='Enter your email address',
                            is_required=True,
                            order=1
                        )
                    )
                email_fields_created += 1
                link_updated = True

            if link_updated:
                links_updated += 1

        # Bulk create all fields
        if not dry_run and fields_to_create:
            CollectInfoField.objects.bulk_create(fields_to_create, ignore_conflicts=True)

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('\nSummary:'))
        self.stdout.write(f'Total custom links checked: {total_links}')
        self.stdout.write(f'Links that needed updates: {links_updated}')
        self.stdout.write(f'Name fields {"to be " if dry_run else ""}created: {name_fields_created}')
        self.stdout.write(f'Email fields {"to be " if dry_run else ""}created: {email_fields_created}')

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    '\nThis was a dry run. Run without --dry-run to apply changes.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Successfully added {name_fields_created + email_fields_created} collect info fields!'
                )
            )
