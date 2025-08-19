from django.core.management.base import BaseCommand
from api.models import Plan, PlanFeature
from api.services.stripe_service import stripe_service


class Command(BaseCommand):
    help = 'Create Elevate Social pricing plans with features and sync them to Stripe'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete existing plans and create new ones',
        )

    def handle(self, *args, **options):
        if options['recreate']:
            self.stdout.write('Deleting existing plans...')
            Plan.objects.all().delete()
            PlanFeature.objects.all().delete()

        # Define Elevate Social plans data based on screenshot
        plans_data = [
            {
                'name': 'Free Me',
                'slug': 'free-me',
                'description': 'Perfect for getting started with your link-in-bio page',
                'price': 0.00,
                'billing_period': 'YEARLY',
                'trial_period_days': 0,
                'is_active': True,
                'is_featured': False,
                'sort_order': 1,
                'features': [
                    {'key': 'storefront_builder', 'name': 'Custom Storefront Builder', 'value': 'Yes', 'highlight': True},
                    {'key': 'embedded_video_cta', 'name': 'Embedded Video + Banner CTAs', 'value': 'Yes', 'highlight': True},
                ]
            },
            {
                'name': 'Champion',
                'slug': 'champion',
                'description': 'Advanced features for creators and content professionals',
                'price': 19.99,
                'billing_period': 'MONTHLY',
                'trial_period_days': 0,
                'is_active': True,
                'is_featured': True,
                'sort_order': 2,
                'features': [
                    {'key': 'storefront_builder', 'name': 'Custom Storefront Builder', 'value': 'Yes', 'highlight': False},
                    {'key': 'content_scheduler', 'name': 'Content Scheduler + Auto-Posting', 'value': 'Yes', 'highlight': True},
                    {'key': 'canva_integration', 'name': 'Canva / Google Drive Integration', 'value': 'Yes', 'highlight': True},
                    {'key': 'ai_assistant', 'name': 'AI Content Assistant (Basic)', 'value': 'Yes', 'highlight': True},
                    {'key': 'embedded_video_cta', 'name': 'Embedded Video + Banner CTAs', 'value': 'Yes', 'highlight': False},
                    {'key': 'performance_insights', 'name': 'Link Performance Insights', 'value': 'Yes', 'highlight': True},
                ]
            },
            {
                'name': 'Elite Pro',
                'slug': 'elite-pro',
                'description': 'Complete solution for businesses and professional creators',
                'price': 29.99,
                'billing_period': 'MONTHLY',
                'trial_period_days': 0,
                'is_active': True,
                'is_featured': False,
                'sort_order': 3,
                'features': [
                    {'key': 'storefront_builder', 'name': 'Custom Storefront Builder', 'value': 'Yes', 'highlight': False},
                    {'key': 'content_scheduler', 'name': 'Content Scheduler + Auto-Posting', 'value': 'Yes', 'highlight': False},
                    {'key': 'canva_integration', 'name': 'Canva / Google Drive Integration', 'value': 'Yes', 'highlight': False},
                    {'key': 'ai_assistant', 'name': 'AI Content Assistant (Basic)', 'value': 'Yes', 'highlight': False},
                    {'key': 'comment_trigger_dm', 'name': 'Comment Trigger + DM Automation', 'value': 'Yes', 'highlight': True},
                    {'key': 'custom_gpt_library', 'name': 'Custom GPT Library Access', 'value': 'Yes', 'highlight': True},
                    {'key': 'embedded_video_cta', 'name': 'Embedded Video + Banner CTAs', 'value': 'Yes', 'highlight': False},
                    {'key': 'performance_insights', 'name': 'Link Performance Insights', 'value': 'Yes', 'highlight': False},
                    {'key': 'link_heatmap', 'name': 'Link Heatmap', 'value': 'Yes', 'highlight': True},
                ]
            },
        ]

        created_plans = []
        
        for plan_data in plans_data:
            self.stdout.write(f'Creating plan: {plan_data["name"]}')
            
            # Extract features data
            features_data = plan_data.pop('features')
            
            # Create plan
            plan, created = Plan.objects.get_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created plan: {plan.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Plan {plan.name} already exists, updating...')
                )
                # Update existing plan
                for key, value in plan_data.items():
                    setattr(plan, key, value)
                plan.save()
            
            # Create plan features
            for idx, feature_data in enumerate(features_data, 1):
                feature, created = PlanFeature.objects.get_or_create(
                    plan=plan,
                    feature_key=feature_data['key'],
                    defaults={
                        'feature_name': feature_data['name'],
                        'feature_value': feature_data['value'],
                        'is_highlight': feature_data['highlight'],
                        'sort_order': idx
                    }
                )
                
                if created:
                    self.stdout.write(f'  ✓ Added feature: {feature.feature_name}')
                else:
                    # Update existing feature
                    feature.feature_name = feature_data['name']
                    feature.feature_value = feature_data['value']
                    feature.is_highlight = feature_data['highlight']
                    feature.sort_order = idx
                    feature.save()
            
            created_plans.append(plan)

        # Sync plans to Stripe
        self.stdout.write('\n' + '='*50)
        self.stdout.write('Syncing plans to Stripe...')
        self.stdout.write('='*50)
        
        success_count = 0
        error_count = 0
        
        for plan in created_plans:
            try:
                if plan.price > 0:  # Only sync paid plans to Stripe
                    self.stdout.write(f'Syncing {plan.name} to Stripe...')
                    result = stripe_service.sync_plan_to_stripe(plan)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Synced {plan.name} - Product: {result["stripe_product_id"][:20]}... Price: {result["stripe_price_id"][:20]}...'
                        )
                    )
                    success_count += 1
                else:
                    self.stdout.write(f'Skipping free plan: {plan.name}')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error syncing {plan.name}: {str(e)}')
                )
                error_count += 1

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('SUMMARY')
        self.stdout.write('='*50)
        self.stdout.write(f'Plans created/updated: {len(created_plans)}')
        self.stdout.write(f'Successfully synced to Stripe: {success_count}')
        if error_count > 0:
            self.stdout.write(f'Sync errors: {error_count}')
        
        # Display plan details
        self.stdout.write('\nCreated Plans:')
        for plan in created_plans:
            self.stdout.write(f'  • {plan.name} (${plan.price}/{plan.billing_period.lower()}) - {plan.features.count()} features')
        
        self.stdout.write(self.style.SUCCESS('\n✓ Elevate Social plans creation completed!'))