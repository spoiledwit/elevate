import csv
import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils.text import slugify
from api.models import UserProfile, UserPermissions

User = get_user_model()


class Command(BaseCommand):
    help = 'Import affiliate users from a CSV file using bulk operations'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file containing affiliate data'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Number of records to process in each batch (default: 500)'
        )
        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Update existing users if email already exists'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the import without actually saving to database'
        )
        parser.add_argument(
            '--set-password',
            type=str,
            default=None,
            help='Set a default password for all imported users (optional)'
        )

    def handle(self, *args, **options):
        csv_file_path = options['csv_file']
        batch_size = options['batch_size']
        update_existing = options['update_existing']
        dry_run = options['dry_run']
        default_password = options['set_password']
        
        # Check if file exists
        if not os.path.exists(csv_file_path):
            raise CommandError(f'CSV file "{csv_file_path}" does not exist')
        
        self.stdout.write(self.style.SUCCESS(f'Starting bulk import from {csv_file_path}'))
        self.stdout.write(self.style.SUCCESS(f'Batch size: {batch_size}'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be saved'))
        
        # Prepare password hash once if provided
        password_hash = make_password(default_password) if default_password else None
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                # Validate CSV headers
                required_headers = {'Email', 'Affiliate Full name'}
                if not required_headers.issubset(reader.fieldnames):
                    raise CommandError(f'CSV must contain headers: {required_headers}')

                # Check if Password column exists
                has_password_column = 'Password' in reader.fieldnames
                
                # Read all rows first
                all_rows = list(reader)
                total_rows = len(all_rows)
                self.stdout.write(self.style.SUCCESS(f'Processing {total_rows} rows...'))
                
                with transaction.atomic():
                    # Process all emails at once
                    all_emails = [row['Email'].strip().lower() for row in all_rows if row['Email'].strip()]
                    
                    # Get existing emails in one query
                    existing_emails = set(User.objects.filter(
                        email__in=all_emails
                    ).values_list('email', flat=True))
                    
                    # Get existing usernames for duplicate checking
                    all_potential_usernames = [email.split('@')[0] for email in all_emails]
                    existing_usernames = set(User.objects.filter(
                        username__in=all_potential_usernames
                    ).values_list('username', flat=True))
                    
                    # Prepare users to create and update
                    users_to_create = []
                    profiles_to_create = []
                    permissions_to_create = []
                    users_to_update = []
                    username_counter = {}
                    
                    # Statistics
                    skipped_count = 0
                    error_count = 0
                    
                    for row_num, row in enumerate(all_rows, start=2):
                        try:
                            email = row['Email'].strip().lower()
                            full_name = row['Affiliate Full name'].strip()

                            # Validate email
                            if not email or '@' not in email:
                                self.stdout.write(
                                    self.style.WARNING(f'Row {row_num}: Invalid email "{email}" - skipping')
                                )
                                error_count += 1
                                continue

                            # Split full name
                            name_parts = full_name.split(' ', 1)
                            first_name = name_parts[0] if name_parts else ''
                            last_name = name_parts[1] if len(name_parts) > 1 else ''

                            # Get password from CSV if available
                            row_password = row.get('Password', '').strip() if has_password_column else None

                            # Handle existing users
                            if email in existing_emails:
                                if update_existing:
                                    users_to_update.append({
                                        'email': email,
                                        'first_name': first_name,
                                        'last_name': last_name,
                                        'full_name': full_name,
                                        'password': row_password
                                    })
                                else:
                                    skipped_count += 1
                                continue
                            
                            # Generate unique username
                            base_username = email.split('@')[0]
                            username = base_username
                            
                            # Check if username needs to be made unique
                            if username in existing_usernames or username in username_counter:
                                if username not in username_counter:
                                    username_counter[username] = 1
                                username_counter[username] += 1
                                username = f'{base_username}{username_counter[username]}'
                            
                            existing_usernames.add(username)
                            
                            # Create user object
                            user = User(
                                username=username,
                                email=email,
                                first_name=first_name,
                                last_name=last_name,
                                is_active=True
                            )

                            # Set password: priority is CSV password > default password > unusable
                            if row_password:
                                user.password = make_password(row_password)
                            elif password_hash:
                                user.password = password_hash
                            else:
                                user.set_unusable_password()
                            
                            users_to_create.append(user)
                            
                            # Prepare profile data
                            profiles_to_create.append({
                                'username': username,
                                'display_name': full_name,
                                'slug': slugify(username)
                            })
                            
                            # Prepare permissions data (affiliates get restricted access)
                            permissions_to_create.append({
                                'username': username,
                                # Dashboard sections - OFF for affiliates
                                'can_access_content': False,  # Content & Social OFF
                                'can_access_automation': False,  # Automation OFF
                                'can_access_ai_tools': False,  # AI & Tools OFF
                                'can_access_business': False,  # Business OFF
                                # Dashboard sections - ON for affiliates
                                'can_access_overview': True,  # Overview ON
                                'can_access_linkinbio': True,  # Link-in-Bio ON
                                'can_access_account': True,  # Account ON
                                # Additional permissions - ON for affiliates
                                'can_edit_profile': True,
                                'can_manage_integrations': True,
                                'can_view_analytics': True,
                            })
                            
                        except Exception as e:
                            error_count += 1
                            self.stdout.write(
                                self.style.ERROR(f'Row {row_num}: Error processing {row.get("Email", "unknown")}: {str(e)}')
                            )
                    
                    # Perform bulk operations
                    created_count = 0
                    updated_count = 0
                    
                    if not dry_run:
                        # Bulk create users in batches
                        for i in range(0, len(users_to_create), batch_size):
                            batch = users_to_create[i:i + batch_size]
                            created_users = User.objects.bulk_create(batch, batch_size=batch_size)
                            created_count += len(created_users)
                            self.stdout.write(
                                self.style.SUCCESS(f'Created batch of {len(created_users)} users ({created_count}/{len(users_to_create)})')
                            )
                        
                        # Get all created users to map to profiles and permissions
                        if profiles_to_create or permissions_to_create:
                            username_to_user = {
                                user.username: user 
                                for user in User.objects.filter(
                                    username__in=[p['username'] for p in profiles_to_create]
                                )
                            }
                            
                            # Create profile objects
                            if profiles_to_create:
                                profile_objects = [
                                    UserProfile(
                                        user=username_to_user[profile['username']],
                                        display_name=profile['display_name'],
                                        slug=profile['slug']
                                    )
                                    for profile in profiles_to_create
                                    if profile['username'] in username_to_user
                                ]
                                
                                # Bulk create profiles in batches
                                for i in range(0, len(profile_objects), batch_size):
                                    batch = profile_objects[i:i + batch_size]
                                    UserProfile.objects.bulk_create(batch, batch_size=batch_size)
                                    self.stdout.write(
                                        self.style.SUCCESS(f'Created batch of {len(batch)} profiles')
                                    )
                            
                            # Create permission objects  
                            if permissions_to_create:
                                permission_objects = [
                                    UserPermissions(
                                        user=username_to_user[perm['username']],
                                        can_access_overview=perm['can_access_overview'],
                                        can_access_linkinbio=perm['can_access_linkinbio'],
                                        can_access_content=perm['can_access_content'],
                                        can_access_automation=perm['can_access_automation'],
                                        can_access_ai_tools=perm['can_access_ai_tools'],
                                        can_access_business=perm['can_access_business'],
                                        can_access_account=perm['can_access_account'],
                                        can_edit_profile=perm['can_edit_profile'],
                                        can_manage_integrations=perm['can_manage_integrations'],
                                        can_view_analytics=perm['can_view_analytics'],
                                    )
                                    for perm in permissions_to_create
                                    if perm['username'] in username_to_user
                                ]
                                
                                # Bulk create permissions in batches
                                for i in range(0, len(permission_objects), batch_size):
                                    batch = permission_objects[i:i + batch_size]
                                    UserPermissions.objects.bulk_create(batch, batch_size=batch_size)
                                    self.stdout.write(
                                        self.style.SUCCESS(f'Created batch of {len(batch)} user permissions')
                                    )
                        
                        # Bulk update existing users if requested
                        if update_existing and users_to_update:
                            # Fetch existing users to update in bulk
                            emails_to_update = [u['email'] for u in users_to_update]
                            existing_users = User.objects.filter(email__in=emails_to_update)
                            existing_profiles = UserProfile.objects.filter(user__email__in=emails_to_update)

                            # Create lookup dictionaries
                            email_to_user = {user.email: user for user in existing_users}
                            email_to_profile = {profile.user.email: profile for profile in existing_profiles}

                            # Update users in memory
                            users_to_bulk_update = []
                            profiles_to_bulk_update = []

                            for update_data in users_to_update:
                                email = update_data['email']

                                # Update user
                                if email in email_to_user:
                                    user = email_to_user[email]
                                    user.first_name = update_data['first_name']
                                    user.last_name = update_data['last_name']

                                    # Update password if provided
                                    if update_data.get('password'):
                                        user.password = make_password(update_data['password'])
                                    elif default_password:
                                        user.password = password_hash

                                    users_to_bulk_update.append(user)

                                # Update profile
                                if email in email_to_profile:
                                    profile = email_to_profile[email]
                                    profile.display_name = update_data['full_name']
                                    profiles_to_bulk_update.append(profile)

                            # Perform bulk updates in batches
                            if users_to_bulk_update:
                                update_fields = ['first_name', 'last_name']
                                if any(u.get('password') for u in users_to_update) or default_password:
                                    update_fields.append('password')

                                for i in range(0, len(users_to_bulk_update), batch_size):
                                    batch = users_to_bulk_update[i:i + batch_size]
                                    User.objects.bulk_update(batch, update_fields, batch_size=batch_size)
                                    self.stdout.write(
                                        self.style.SUCCESS(f'Updated batch of {len(batch)} users ({i + len(batch)}/{len(users_to_bulk_update)})')
                                    )

                            if profiles_to_bulk_update:
                                for i in range(0, len(profiles_to_bulk_update), batch_size):
                                    batch = profiles_to_bulk_update[i:i + batch_size]
                                    UserProfile.objects.bulk_update(batch, ['display_name'], batch_size=batch_size)
                                    self.stdout.write(
                                        self.style.SUCCESS(f'Updated batch of {len(batch)} profiles')
                                    )

                            updated_count = len(users_to_update)
                            self.stdout.write(
                                self.style.SUCCESS(f'Total updated: {updated_count} users')
                            )
                    else:
                        created_count = len(users_to_create)
                        updated_count = len(users_to_update)
                    
                    if dry_run:
                        # Rollback transaction in dry run mode
                        transaction.set_rollback(True)
                    
                    # Print summary
                    self.stdout.write(self.style.SUCCESS('\n' + '='*50))
                    self.stdout.write(self.style.SUCCESS('IMPORT SUMMARY:'))
                    self.stdout.write(self.style.SUCCESS(f'Total rows processed: {total_rows}'))
                    self.stdout.write(self.style.SUCCESS(f'Created: {created_count} users'))
                    if update_existing:
                        self.stdout.write(self.style.SUCCESS(f'Updated: {updated_count} users'))
                    self.stdout.write(self.style.WARNING(f'Skipped (existing): {skipped_count} users'))
                    self.stdout.write(self.style.ERROR(f'Errors: {error_count} rows'))
                    self.stdout.write(self.style.SUCCESS('='*50))
                    
                    if dry_run:
                        self.stdout.write(self.style.WARNING('\nDRY RUN COMPLETE - No data was saved to database'))
                    else:
                        self.stdout.write(self.style.SUCCESS('\nBulk import completed successfully!'))
        
        except FileNotFoundError:
            raise CommandError(f'Could not open file {csv_file_path}')
        except Exception as e:
            raise CommandError(f'Error reading CSV file: {str(e)}')