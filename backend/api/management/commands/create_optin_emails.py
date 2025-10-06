from django.core.management.base import BaseCommand
from api.models import OptinFollowupEmail


class Command(BaseCommand):
    help = 'Create opt-in follow-up email templates in sequence'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete existing opt-in email templates and create new ones',
        )

    def handle(self, *args, **options):
        if options['recreate']:
            self.stdout.write('Deleting existing opt-in email templates...')
            OptinFollowupEmail.objects.all().delete()

        # Define opt-in email templates (plain text with template variables)
        email_templates = [
            {
                'step_number': 1,
                'delay_days': 0,
                'send_time': '10:00',
                'subject': '{{ first_name }}, you just unlocked something powerful.',
                'body': '''{{ first_name }}, you just unlocked something powerful.

Welcome to HTP Elevate — the built-for-you business system designed to help you launch fast, earn with purpose, and grow with support.

Whether you're brand new or scaling, Elevate removes the guesswork and hands you:

✅ A done-for-you funnel + storefront
✅ Plug-and-post content & email templates
✅ Live coaching + daily support
✅ Optional automation + recurring commissions

This is what we wish we had when we started — and now it's here for you.

👉 See Pricing + Get Started: {{ affiliate_link }}

🎥 Weekly Live Overview Call
Every Tuesday @ 8PM CT — walk through the system live with our team.
Join the Zoom Call: https://us06web.zoom.us/j/89413312212

– {{ sender_name }}

P.S. Click the Pricing tab and choose your path. You'll see me listed as your Purpose Partner — I'd love to support you! Questions? Email {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 2,
                'delay_days': 1,
                'send_time': '10:00',
                'subject': '{{ first_name }}, most people stay stuck here...',
                'body': '''{{ first_name }}, most people stay stuck here…

They binge content. Download freebies. Get inspired — and then ghost their dreams.

Not because they're lazy. Because they're doing it alone.

Elevate changes that with:

✅ A system you don't have to build
✅ Plug-and-go monetization
✅ Coaching and content ready from Day 1

Let's get you moving:

👉 See Your Starter Plan: {{ affiliate_link }}

– {{ sender_name }}

P.S. Click your link above, tap the Pricing tab, and choose your path. Don't forget to select me as your Purpose Partner!''',
                'is_active': True
            },
            {
                'step_number': 3,
                'delay_days': 3,
                'send_time': '10:00',
                'subject': 'Most people don\'t need more info - they need this.',
                'body': '''Most people don't need more info — they need this.

{{ first_name }}, the world doesn't need more webinars or whiteboards. You need a launchpad — something built for speed, clarity, and results.

✅ Funnel + storefront — already built
✅ AI-assisted content + copy
✅ Monetization + automation preloaded

Don't keep collecting resources. Launch with the one that works.

👉 Claim Your Access: {{ affiliate_link }}

– {{ sender_name }}

P.S. Check the Pricing tab when you visit the link. You'll see me in the Purpose Partner dropdown — let's launch together. Questions? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 4,
                'delay_days': 5,
                'send_time': '10:00',
                'subject': '{{ first_name }}, we keep it as simple as A-B-C.',
                'body': '''{{ first_name }}, we keep it as simple as A‑B‑C.

Inside Elevate, we use the ABC 123 Framework™ — designed to help you plug in and profit without the guesswork:

🔹 A = Automation — Let the system do the heavy lifting
🔹 B = Business — You bring the story, we bring the setup
🔹 C = Community — You'll never build alone again

You don't need to learn it all — you just need the right system to apply what matters.

👉 See It In Action: {{ affiliate_link }}

– {{ sender_name }}

P.S. Hit the Pricing tab on your link and select the plan that fits you best. You'll find me listed as your Purpose Partner. Let's get started. Need help? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 5,
                'delay_days': 7,
                'send_time': '10:00',
                'subject': '{{ first_name }}, no list? No experience? It still works.',
                'body': '''{{ first_name }}, no list? No experience? It still works.

If you've said any of this:

❌ "I'm not techy"
❌ "I don't have a following"
❌ "I've failed with programs before"

This system was built for you.

✅ Your funnel — built for you
✅ Your content — preloaded & customizable
✅ Your storefront — live on Day 1
✅ Support — daily coaching + community

You bring your story. We'll bring the structure.

👉 See How to Start: {{ affiliate_link }}

– {{ sender_name }}

P.S. Tap the Pricing tab when you open your link, and select me as your Purpose Partner. I'm ready to support you — let's get you launched. Questions? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 6,
                'delay_days': 9,
                'send_time': '10:00',
                'subject': '{{ first_name }}, here\'s what no one tells you about online income...',
                'body': '''{{ first_name }}, here's what no one tells you about online income…

Most people aren't failing because they're lazy — they're just building on a broken model.

They chase one-time sales. They grind for every dollar. And when they stop working… the money stops, too.

Elevate changes that.

✅ High-ticket + monthly recurring income
✅ Automation that runs even when you don't
✅ Support to keep you consistent

That's not hype — it's a better model. And it's ready for you.

👉 See the New Way: {{ affiliate_link }}

– {{ sender_name }}

P.S. Click your link and hit the Pricing tab. Choose what fits — and don't forget to select me as your Purpose Partner! I'll help you build real freedom. Questions? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 7,
                'delay_days': 11,
                'send_time': '10:00',
                'subject': '{{ first_name }}, want to see what\'s actually inside Elevate?',
                'body': '''{{ first_name }}, want to see what's actually inside Elevate?

Let's walk through it:

✅ Your own storefront + funnel, done-for-you
✅ Pre-loaded offers with up to $600 commissions
✅ Milo: your smart business copilot
✅ AI-powered content + scheduled social posts
✅ Daily coaching, support, and walkthroughs

No fluff. No funnels to build. It's already working — now it's your turn.

👉 Watch the Full Demo: {{ affiliate_link }}

– {{ sender_name }}

P.S. Tap the Pricing tab to choose your plan. And don't forget — I'll show up in the Purpose Partner dropdown when you join. Questions? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 8,
                'delay_days': 13,
                'send_time': '10:00',
                'subject': 'Copy. Paste. Post. Get Paid.',
                'body': '''Copy. Paste. Post. Get Paid.

Yes — it's really that simple inside Elevate.

✅ Scroll-stopping reels
✅ Plug-and-post captions
✅ Pre-scheduled content calendar
✅ AI prompts that write for you

{{ first_name }}, your content is done.
You just show up.

👉 Claim Your Content Stack: {{ affiliate_link }}

– {{ sender_name }}

P.S. Want in? Click the Pricing tab, choose your plan, and select me as your Purpose Partner. Questions? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 9,
                'delay_days': 15,
                'send_time': '10:00',
                'subject': '{{ first_name }}, high-ticket up front. Recurring forever.',
                'body': '''{{ first_name }}, high-ticket up front. Recurring forever.

Most affiliate programs are one-and-done. Elevate is built for now and later.

💰 $600 commissions on Tier 1 sales
💰 $100 on Tier 2 and Tier 3 overrides
🔁 $30 / $10 / $5 monthly recurring from software

This isn't "get rich quick."
It's get paid smart, consistently, and long-term.

👉 View Commission Breakdown: {{ affiliate_link }}

– {{ sender_name }}

P.S. Tap Pricing at the top, select the plan that fits you best, and don't forget to add me as your Purpose Partner! Let's build long-term wins. Need help? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 10,
                'delay_days': 17,
                'send_time': '10:00',
                'subject': '{{ first_name }}, maybe you were born to break the cycle.',
                'body': '''{{ first_name }}, maybe you were born to break the cycle.

What if you're the one who changes everything for your family?
The one who finally stops trading time for money… and builds something that lasts?

HTP Elevate isn't just a system. It's a shift.

✅ A business in a box — ready now
✅ A proven path with support built in
✅ A community of Purpose-Driven Entrepreneurs

{{ first_name }}, you weren't made to blend in.
You were made to lead.

👉 Start Leading Today: {{ affiliate_link }}

– {{ sender_name }}

P.S. Tap the Pricing tab and pick your plan — don't forget to choose me in the Purpose Partner dropdown. Let's break the cycle together. Email {{ personal_email }} if you need anything!''',
                'is_active': True
            },
            {
                'step_number': 11,
                'delay_days': 19,
                'send_time': '10:00',
                'subject': 'One System. One Subscription. One Powerful Shift.',
                'body': '''One System. One Subscription. One Powerful Shift.

{{ first_name }}, you don't need another course. You need everything in one place:

✅ Your business engine — automated
✅ Your content library — loaded
✅ Your income stream — recurring
✅ Your support system — live daily

One login. One system. Unlimited upside.

👉 Explore What's Inside: {{ affiliate_link }}

– {{ sender_name }}

P.S. Everything you need is already inside. Just hit the Pricing tab and select me as your Purpose Partner to get started. Need help? {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 12,
                'delay_days': 21,
                'send_time': '10:00',
                'subject': '{{ first_name }}, Elevate isn\'t just a system - it\'s a safety net.',
                'body': '''{{ first_name }}, Elevate isn't just a system — it's a safety net.

You weren't meant to do this alone.
Elevate gives you structure when life gets messy, a system that runs even when you don't, and a revenue engine that builds over time.

✅ Daily coaching + community
✅ Done-for-you setup
✅ Automation + AI tools
✅ Real support, not just login access

This is the bridge between where you are — and the life you're building.

👉 Build Your Foundation: {{ affiliate_link }}

– {{ sender_name }}

P.S. Tap the Pricing tab when you click the link. Make sure to choose me in the Purpose Partner dropdown! I'm here for your next step. {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 13,
                'delay_days': 23,
                'send_time': '10:00',
                'subject': '{{ first_name }}, the math behind 6-figures isn\'t what you think.',
                'body': '''{{ first_name }}, the math behind 6-figures isn't what you think.

Want to know why most people never cross 6 figures?
Because they're building income that doesn't scale.

Elevate gives you the math that works:

✅ $600 commissions
✅ Recurring income from software
✅ 2 Tier Passive income from your teams sales ($100 each time your customer, or their customer, makes a sale!)

It's not about working harder — it's about setting up the systems once… and letting momentum compound.

👉 See How the Numbers Work: {{ affiliate_link }}

– {{ sender_name }}

P.S. Click your link above and hit Pricing — then choose your plan + select me as your Purpose Partner. Let's grow this! {{ personal_email }}''',
                'is_active': True
            },
            {
                'step_number': 14,
                'delay_days': 25,
                'send_time': '10:00',
                'subject': '{{ first_name }}, this is where your momentum begins.',
                'body': '''{{ first_name }}, this is where your momentum begins.

You've seen the system.
You've read the proof.
You've felt the shift.

Now it's your move.

HTP Elevate is your shortcut to clarity, commissions, and consistency.
The only thing between you and real momentum… is action.

👉 Let's Go → Pick Your Plan: {{ affiliate_link }}

– {{ sender_name }}

P.S. Final step: click your link, hit the Pricing tab, and select your plan. I'll be listed in the Purpose Partner dropdown — I'd love to help you win. Email {{ personal_email }} with any questions.''',
                'is_active': True
            },
        ]

        created_emails = []

        for email_data in email_templates:
            self.stdout.write(f'Creating opt-in email {email_data["step_number"]}...')

            # Create or update email template
            email, created = OptinFollowupEmail.objects.get_or_create(
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
        self.stdout.write(f'Total opt-in email templates created/updated: {len(created_emails)}')

        # Display email schedule
        self.stdout.write('\nEmail Sequence Schedule:')
        for email in created_emails:
            status = "✓ Active" if email.is_active else "✗ Inactive"
            self.stdout.write(f'  {status} | Email {email.step_number:2d} | Day {email.delay_days:2d} @ {email.send_time} | {email.subject[:55]}...')

        self.stdout.write(self.style.SUCCESS('\n✓ Opt-in email sequence creation completed!'))
