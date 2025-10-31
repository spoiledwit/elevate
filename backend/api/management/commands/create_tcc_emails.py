from django.core.management.base import BaseCommand
from api.models import OptinFollowupEmail


class Command(BaseCommand):
    help = 'Create TCC (The Creators Code) opt-in follow-up email templates in sequence'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete existing TCC email templates and create new ones',
        )

    def handle(self, *_args, **options):
        if options['recreate']:
            self.stdout.write('Deleting existing TCC email templates...')
            OptinFollowupEmail.objects.filter(program='TCC').delete()

        # Define TCC email templates (plain text with template variables)
        email_templates = [
            {
                'program': 'TCC',
                'step_number': 1,
                'delay_days': 0,
                'send_time': '10:00',
                'subject': 'Can you relate?',
                'body': '''Hey {{ first_name }},
You did it — congrats on taking your very first step toward creating the life you've been dreaming about! I hope the Free Digital Guide opened your eyes to what's possible.
If you're feeling anything like I was, you're probably tired, a bit overwhelmed, and skeptical. Take a deep breath — I'm proud of you. Saying yes to change is hard, but this industry truly changed my life, and now I want to help you do the same.
I went to school, got the degree, the job, the car, the house — and still found myself stuck in traffic every day just to pay bills. I knew I was called to more but didn't know how to escape the rat race.
Then I saw everyday women online earning thousands through digital marketing. I was skeptical but desperate for a way out, so I decided to learn the skills. One key decision changed everything.
Within days of jumping in, I made my first commission — and just months later, I'd earned more than I ever had before.
Now I'm sharing the exact roadmap that worked for me: The Creators Code.
If you've already joined — amazing! I can't wait to see you inside.
 If not, don't wait another day — Click here to start: {{ affiliate_link }} and join thousands who are changing their lives.
You deserve the freedom you've been dreaming about.
Chat soon,
 {{ sender_name }}
 {{ personal_email }}''',
                'is_active': True
            },
            {
                'program': 'TCC',
                'step_number': 2,
                'delay_days': 2,
                'send_time': '10:00',
                'subject': 'Digital Marketing... what\'s the big deal?',
                'body': '''Hey {{ first_name }},
If you've googled "affiliate marketing," your feed's probably packed with courses and trends claiming to be the next big thing. So how do you know who's legit?
Let me make this simple — The Creators Code isn't just another course. It's a complete system that teaches you how to start and scale a digital business from scratch.
Inside The Code, you'll learn how to:
 ✅ Start your online business from zero
 ✅ Master content & branding that attract sales
 ✅ Automate your systems so your business works even when you don't
 ✅ Create and sell digital & affiliate products for multiple income streams
And when you're ready to take things further, you can join The Collective — our mentorship community that gives you personalized coaching, live sessions, content audits, and accountability from top creators earning 6 and 7 figures online.
Whether you're a beginner or a business owner ready to expand, this is where clarity meets action.
👉 Join The Creators Code Now: {{ affiliate_link }} and see why everyone's talking about it.
Let's get this party started!
 {{ sender_name }}
 {{ personal_email }}''',
                'is_active': True
            },
            {
                'program': 'TCC',
                'step_number': 3,
                'delay_days': 4,
                'send_time': '10:00',
                'subject': 'Are you ready for this?',
                'body': '''Hey {{ first_name }},
Just checking in — have you started The Code or The Collective yet?
If so, you're that much closer to launching your online business and celebrating your first commission! I still remember mine — seeing "You've earned a commission!" in my inbox was the moment everything clicked.
If you haven't started yet, what's holding you back?
 You'll get the training, resources, and support you need — all you have to do is show up for yourself.
Are you ready to take the first step toward your dream life?
 Click here to get started: {{ affiliate_link }} and let's make it happen.
Chat soon,
 {{ sender_name }}
 {{ personal_email }}''',
                'is_active': True
            },
            {
                'program': 'TCC',
                'step_number': 4,
                'delay_days': 6,
                'send_time': '10:00',
                'subject': 'My Big "Aha" Moment',
                'body': '''Hey {{ first_name }},
Ever wake up to an alarm and feel like you're living the same day on repeat? That was me.
 5 AM alarms. Traffic. Cold office. No freedom.
Then one day, I heard this so clearly:
"Stop believing the lie that this is all there is for you."
That was my aha moment. I realized I could create a life of freedom and purpose — and I was done waiting for "one day."
The digital marketing world gave me two priceless things:
 1️⃣ A way to share what I love and help others while getting paid.
 2️⃣ A "freedom" income that runs on autopilot after you set it up.
This is the model that gives you time, location, and financial freedom.
So {{ first_name }}, are you ready to start creating your life?
 👉 Join The Creators Code Now: {{ affiliate_link }} and let's do this together.
Talk soon,
 {{ sender_name }}
 {{ personal_email }}''',
                'is_active': True
            },
            {
                'program': 'TCC',
                'step_number': 5,
                'delay_days': 8,
                'send_time': '10:00',
                'subject': 'Don\'t know where to start?',
                'body': '''Hey {{ first_name }},
Feeling excited but a bit overwhelmed? I get it. The sooner you start, the sooner you get paid — and I'm here to help.
If you want a proven shortcut, The Creators Code + Collective Mentorship will take you step by step through launching and growing your business — even if you have zero experience.
Here's what you'll learn once you jump in:
How to pick your niche and find affiliate programs that pay well

How to build your brand and social storefront fast

How to start posting content that turns followers into buyers

If you've been waiting for a sign — this is it.
 👉 Get Instant Access to The Creators Code: {{ affiliate_link }}
Let's crush this together,
 {{ sender_name }}
 {{ personal_email }}''',
                'is_active': True
            },
        ]

        created_emails = []

        for email_data in email_templates:
            self.stdout.write(f'Creating TCC email {email_data["step_number"]}...')

            # Create or update email template
            email, created = OptinFollowupEmail.objects.get_or_create(
                program='TCC',
                step_number=email_data['step_number'],
                defaults=email_data
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created Email {email.step_number} - Day {email.delay_days}: {email.subject[:60]}...')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Email {email.step_number} already exists, updating...')
                )
                # Update existing email
                for key, value in email_data.items():
                    setattr(email, key, value)
                email.save()

            created_emails.append(email)

        # Summary
        self.stdout.write('\n' + '='*70)
        self.stdout.write('SUMMARY')
        self.stdout.write('='*70)
        self.stdout.write(f'Total TCC email templates created/updated: {len(created_emails)}')

        # Display email schedule
        self.stdout.write('\nTCC Email Sequence Schedule:')
        for email in created_emails:
            status = "✓ Active" if email.is_active else "✗ Inactive"
            self.stdout.write(f'  {status} | Email {email.step_number:2d} | Day {email.delay_days:2d} @ {email.send_time} | {email.subject[:55]}...')

        self.stdout.write(self.style.SUCCESS('\n✓ TCC email sequence creation completed!'))