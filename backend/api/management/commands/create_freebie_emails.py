from django.core.management.base import BaseCommand
from api.models import FreebieFollowupEmail


class Command(BaseCommand):
    help = 'Create freebie follow-up email templates in sequence'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete existing freebie email templates and create new ones',
        )

    def handle(self, *_args, **options):
        if options['recreate']:
            self.stdout.write('Deleting existing freebie email templates...')
            FreebieFollowupEmail.objects.all().delete()

        # Define freebie email templates (plain text with template variables)
        email_templates = [
            {
                'step_number': 1,
                'delay_days': 0,
                'send_time': '10:00',
                'subject': 'Welcome & Live Invite',
                'body': '''Hey {{ first_name }},
If you're here, it's probably because:

✨ You're tired of inconsistent results.
 ✨ You're wondering why your content isn't growing your audience.
 ✨ You're craving a business that feels lighter —but still creates abundant 💫 months.
 ✨ Or maybe you've wanted to monetize social media but never knew where to begin.

I see you —and I built this for you. Let's make it simple, light, and impactful.

Inside our live webinar, we'll show you how creators are building 🌟 consistent commission days and four-figure months — without tech headaches or endless hustle.
Even better? We're giving away 1k in surprise bonuses for those who attend live! 🎉
👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?
Dive into my free masterclass here: {{ affiliate_link }}
Have questions? Click {{ personal_email }} and drop me a note 💌

— {{ sender_name }} 🤍✨💼🔥''',
                'is_active': True
            },
            {
                'step_number': 2,
                'delay_days': 2,
                'send_time': '10:00',
                'subject': 'Welcome to The Wealth Creator',
                'body': '''Hi {{ first_name }}!
Welcome! You've taken the first step toward discovering how our done-for-you digital product system can help you create 💰 high-value commissions — without building everything from scratch.

WEBINAR ⮕ {{ affiliate_link }}

Here's what to expect:
 ✅ A launch-ready system in 3 days —not months.
 ✅ No product creation or complicated tech setup.
 ✅ Custom business framework for any niche.
 ✅ Up to 💸 $1K-style commissions per sale.
 ✅ Automation-driven marketing + VIP support.
Our goal is to make it effortless for you to start generating results FAST.
 Stay tuned for our next email — I'll show you exactly how the process works.
👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?
Dive into my free masterclass here: {{ affiliate_link }}
Have questions? Click {{ personal_email }} and drop me any questions 💌

— {{ sender_name }}''',
                'is_active': True
            },
            {
                'step_number': 3,
                'delay_days': 4,
                'send_time': '10:00',
                'subject': 'Missed the Masterclass? Replay Inside',
                'body': '''Hey {{ first_name }},
Couldn't make it to The Wealth Creator Masterclass? No worries - the replay's ready! 🎥 ➭ {{ affiliate_link }}

In this session, we explored how you can start creating consistent 💵 days using our proven digital system - even if you're brand new.
You'll learn:
 • A step-by-step guide to launching your automated business.
 • Real examples showing how others achieved their first big wins.
 • Answers to key questions so you feel confident to start.
🎬 Watch the Replay Here: https://us06web.zoom.us/rec/share/thEIEbHYF5kHsTwQ9j8RYaNIHGKJJ_h7wEDl4DvgsSi7EnUlzketRWtkIQe9oWsL.mQHJ7v90cN1fMllt

👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010
P.S. Want to start seeing results today?

Dive into my free masterclass here: {{ affiliate_link }}

Questions? Reach out anytime → {{ personal_email }}

— {{ sender_name }}''',
                'is_active': True
            },
            {
                'step_number': 4,
                'delay_days': 6,
                'send_time': '10:00',
                'subject': 'Proof That It Works',
                'body': '''{{ first_name }},
Don't just take my word for it - here's what others have experienced:
Jen: "I had my first $2,000 day yesterday!"


When you step into The Wealth Creator:
 📅 Day 1 — Your strategy mapped out.
 📅 Day 2 — Funnels + automation running.
 📅 Day 3 — You're ready to grow 🌱

Clients have seen 💸 four-figure days within weeks of joining.
Imagine planting a tree that bears fruit overnight — that's the power of alignment and automation.

👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?
Dive into my free masterclass here: {{ affiliate_link }}
Have questions? Email me → {{ personal_email }}

— {{ sender_name }}''',
                'is_active': True
            },
            {
                'step_number': 5,
                'delay_days': 8,
                'send_time': '10:00',
                'subject': 'Your Top Questions Answered',
                'body': '''Hey {{ first_name }},
Still thinking it through? Totally understandable.
 Let's tackle the most common questions:
1️⃣ "What if I'm new?"
 No problem at all! Our training is built for beginners 🪴 … you'll learn how to turn everyday scrolling into a revenue-building strategy.
2️⃣ "Is there ongoing support?"
 Yes! VIP mentorship + a 24/7 community chat so you're never alone.
3️⃣ "What if I don't have time?"
 With automations in place, you can see momentum working just a few hours a day.
4️⃣ "How is this different?"
 We filled the gaps other offers leave - building funnels + emails for you 💼 and closing sales through our high-conversion webinars.

👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?

Dive into my free masterclass here: {{ affiliate_link }}
Questions? Click {{ personal_email }} and let's chat 💬
- {{ sender_name }}''',
                'is_active': True
            },
            {
                'step_number': 6,
                'delay_days': 10,
                'send_time': '10:00',
                'subject': 'Replace the Hustle with Ease',
                'body': '''Hi {{ first_name }}!

Sound familiar?
 📱 Posting daily.
 ✉️ Endless DMs.
 💡 Trying every new strategy.

But you know the truth — that grind isn't building wealth ⚙️

Inside The Wealth Creator, we replace the hustle with a system that works for you.

Think of it like a self-driving business…  you steer, it runs.
Let's create a business that supports your life -  not the other way around.

👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?

 Dive into my free masterclass here: {{ affiliate_link }}

 Need clarity? Reach me → {{ personal_email }}
-  {{ sender_name }}''',
                'is_active': True
            },
            {
                'step_number': 7,
                'delay_days': 12,
                'send_time': '10:00',
                'subject': 'Your Breakthrough Is Waiting',
                'body': '''{{ first_name }},
You've dreamed about it long enough 🕊️ -
 💡 Working less while earning more.
 💡 Consistent income without burnout.
 💡 Finally seeing those $5K–$30K month milestones 🌟
The Wealth Creator turns that vision into reality.
 Everything fits you perfectly - it's your business, your style, your flow.
Are you ready to step into your breakthrough?

👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?

Dive into my free masterclass here: {{ affiliate_link }}
Questions? Just reply → {{ personal_email }}
- {{ sender_name }}''',
                'is_active': True
            },
            {
                'step_number': 8,
                'delay_days': 14,
                'send_time': '10:00',
                'subject': 'Kait\'s Story (Proof & Inspiration)',
                'body': '''Hey {{ first_name }},
When Kait joined The Wealth Creator, she was skeptical 😬 - she'd tried other programs with no results.

But within days, she saw her first 💸 commission day.

By 30 days, she had scaled past five figures through the system she once doubted.

Her secret? She trusted the process.

You can be the next success story. Let's build the business you deserve ✨

👉 Join the live webinar Wednesday at 8 PM CST: https://us06web.zoom.us/j/89869445010

P.S. Want to start seeing results today?
Dive into my free masterclass here: {{ affiliate_link }}
Have questions? Click {{ personal_email }} and drop me a message!

- {{ sender_name }}''',
                'is_active': True
            },
        ]

        created_emails = []

        for email_data in email_templates:
            self.stdout.write(f'Creating freebie email {email_data["step_number"]}...')

            # Create or update email template
            email, created = FreebieFollowupEmail.objects.get_or_create(
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
        self.stdout.write(f'Total freebie email templates created/updated: {len(created_emails)}')

        # Display email schedule
        self.stdout.write('\nEmail Sequence Schedule:')
        for email in created_emails:
            status = "✓ Active" if email.is_active else "✗ Inactive"
            self.stdout.write(f'  {status} | Email {email.step_number:2d} | Day {email.delay_days:2d} @ {email.send_time} | {email.subject[:55]}...')

        self.stdout.write(self.style.SUCCESS('\n✓ Freebie email sequence creation completed!'))
