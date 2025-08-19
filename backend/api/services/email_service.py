"""
Email Service for sending subscription-related emails
"""
import logging
from typing import Optional, Dict, Any

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model

from ..models import Subscription

User = get_user_model()
logger = logging.getLogger(__name__)


def send_email(
    template_name: str,
    subject: str,
    to_email: str,
    context: Dict[str, Any],
    from_email: Optional[str] = None
) -> bool:
    """
    Send an HTML email using a template.
    
    Args:
        template_name: Name of the template file (without .html extension)
        subject: Email subject line
        to_email: Recipient email address
        context: Template context variables
        from_email: Sender email (defaults to DEFAULT_FROM_EMAIL)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Add common context variables
        context.update({
            'frontend_url': settings.FRONTEND_URL,
            'support_email': settings.DEFAULT_FROM_EMAIL,
        })
        
        # Render the HTML template
        html_content = render_to_string(f'emails/{template_name}.html', context)
        
        # Create email message
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        email = EmailMultiAlternatives(
            subject=subject,
            body='',  # Plain text version (empty for now)
            from_email=from_email,
            to=[to_email]
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        logger.info(f"Email sent successfully: {template_name} to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email {template_name} to {to_email}: {e}")
        return False


def send_welcome_email(subscription: Subscription) -> bool:
    """Send welcome email when subscription is created."""
    user = subscription.user
    
    if not user.email:
        logger.warning(f"No email found for user {user.username}")
        return False
    
    context = {
        'user': user,
        'subscription': subscription,
        'plan_name': subscription.plan.name if subscription.plan else 'LinkHub Pro',
        'username': user.username,
    }
    
    return send_email(
        template_name='welcome',
        subject=f'Welcome to Elevate Social - Your {context["plan_name"]} subscription is active!',
        to_email=user.email,
        context=context
    )


def send_trial_ending_email(subscription: Subscription) -> bool:
    """Send trial ending reminder email (3 days before trial ends)."""
    user = subscription.user
    
    if not user.email:
        logger.warning(f"No email found for user {user.username}")
        return False
    
    context = {
        'user': user,
        'subscription': subscription,
        'plan_name': subscription.plan.name if subscription.plan else 'LinkHub Pro',
        'username': user.username,
        'trial_end_date': subscription.trial_end,
    }
    
    return send_email(
        template_name='trial_ending',
        subject='Your Elevate Social trial is ending soon - Action required',
        to_email=user.email,
        context=context
    )


def send_payment_succeeded_email(subscription: Subscription) -> bool:
    """Send payment confirmation email."""
    user = subscription.user
    
    if not user.email:
        logger.warning(f"No email found for user {user.username}")
        return False
    
    context = {
        'user': user,
        'subscription': subscription,
        'plan_name': subscription.plan.name if subscription.plan else 'LinkHub Pro',
        'username': user.username,
        'next_billing_date': subscription.current_period_end,
    }
    
    return send_email(
        template_name='payment_succeeded',
        subject=f'Payment confirmed - Elevate Social {context["plan_name"]} plan',
        to_email=user.email,
        context=context
    )


def send_payment_failed_email(subscription: Subscription) -> bool:
    """Send payment failure notification email."""
    user = subscription.user
    
    if not user.email:
        logger.warning(f"No email found for user {user.username}")
        return False
    
    context = {
        'user': user,
        'subscription': subscription,
        'plan_name': subscription.plan.name if subscription.plan else 'LinkHub Pro',
        'username': user.username,
    }
    
    return send_email(
        template_name='payment_failed',
        subject='Payment failed - Update your Elevate Social payment method',
        to_email=user.email,
        context=context
    )


def send_subscription_cancelled_email(subscription: Subscription) -> bool:
    """Send subscription cancellation confirmation email."""
    user = subscription.user
    
    if not user.email:
        logger.warning(f"No email found for user {user.username}")
        return False
    
    context = {
        'user': user,
        'subscription': subscription,
        'plan_name': subscription.plan.name if subscription.plan else 'LinkHub Pro',
        'username': user.username,
    }
    
    return send_email(
        template_name='subscription_cancelled',
        subject='Elevate Social subscription cancelled - We\'re sorry to see you go',
        to_email=user.email,
        context=context
    )