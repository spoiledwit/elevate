"""
Email Service for sending subscription-related and product delivery emails using Resend
"""
import logging
import os
from typing import Optional, Dict, Any

import resend
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model

from ..models import Subscription, Order, CustomLink

User = get_user_model()
logger = logging.getLogger(__name__)

# Configure Resend with API key from Django settings
resend.api_key = getattr(settings, 'RESEND_API_KEY', '')


def send_email(
    template_name: str,
    subject: str,
    to_email: str,
    context: Dict[str, Any],
    from_email: Optional[str] = None
) -> bool:
    """
    Send an HTML email using a template via Resend.

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
            'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
            'support_email': 'contact@elevate.social',
        })

        # Render the HTML template
        html_content = render_to_string(f'emails/{template_name}.html', context)

        # Use Resend to send email
        from_email = from_email or 'contact@elevate.social'

        params = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        # Send email via Resend
        response = resend.Emails.send(params)

        if response.get('id'):
            logger.info(f"Email sent successfully via Resend: {template_name} to {to_email}, ID: {response['id']}")
            return True
        else:
            logger.error(f"Failed to send email via Resend: {template_name} to {to_email}, Response: {response}")
            return False

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


# Product Delivery Email Functions

def send_product_delivery_email(order: Order) -> bool:
    """
    Send product delivery email based on the product type.
    Routes to the appropriate email template based on additional_info.
    """
    logger.info(f"Starting product delivery email for order {order.order_id}")

    if not order.customer_email:
        logger.warning(f"No customer email found for order {order.order_id}")
        return False

    logger.info(f"Customer email: {order.customer_email}")

    custom_link = order.custom_link
    additional_info = custom_link.additional_info or {}
    logger.info(f"Additional info: {additional_info}")

    # Determine product type from additional_info structure and price
    if 'digital_file_url' in additional_info or 'download_instructions' in additional_info:
        # Check if this is a freebie (free product)
        is_free = not custom_link.checkout_price or custom_link.checkout_price <= 0
        if is_free:
            logger.info(f"Detected freebie product for order {order.order_id}")
            return send_freebie_email(order)
        else:
            logger.info(f"Detected digital product for order {order.order_id}")
            return send_digital_product_email(order)
    elif 'course_duration' in additional_info or 'course_modules' in additional_info:
        logger.info(f"Detected e-course for order {order.order_id}")
        return send_ecourse_email(order)
    elif 'destination_url' in additional_info:
        logger.info(f"Detected URL/media product for order {order.order_id}")
        return send_url_media_email(order)
    elif 'custom_fields' in additional_info:
        logger.info(f"Detected custom product for order {order.order_id}")
        return send_custom_product_email(order)
    else:
        logger.info(f"Using generic product template for order {order.order_id}")
        return send_generic_product_email(order)


def send_digital_product_email(order: Order) -> bool:
    """Send digital product delivery email with download link."""
    custom_link = order.custom_link
    additional_info = custom_link.additional_info or {}

    context = {
        'customer_name': order.customer_name,
        'order_id': order.order_id,
        'product_title': custom_link.title or custom_link.checkout_title or 'Digital Product',
        'product_subtitle': custom_link.subtitle,
        'product_price': custom_link.checkout_price,
        'purchase_date': order.created_at,
        'digital_file_url': additional_info.get('digital_file_url'),
        'download_instructions': additional_info.get('download_instructions'),
        'form_responses': order.get_formatted_responses(),
    }

    return send_email(
        template_name='digital_product_delivery',
        subject=f'Your download is ready: {context["product_title"]}',
        to_email=order.customer_email,
        context=context
    )


def send_freebie_email(order: Order) -> bool:
    """Send freebie product delivery email with free download link."""
    custom_link = order.custom_link
    additional_info = custom_link.additional_info or {}

    # Get seller's profile information
    seller_profile = custom_link.user_profile
    seller_user = seller_profile.user

    # Extract first name from customer name or order email
    first_name = order.customer_name.split()[0] if order.customer_name else ""

    context = {
        'customer_name': order.customer_name,
        'first_name': first_name,
        'order_id': order.order_id,
        'product_title': custom_link.title or custom_link.checkout_title or 'Free Resource',
        'product_subtitle': custom_link.subtitle,
        'purchase_date': order.created_at,
        'digital_file_url': additional_info.get('digital_file_url'),
        'download_instructions': additional_info.get('download_instructions'),
        'form_responses': order.get_formatted_responses(),
        'is_free': True,  # Flag to indicate this is a free product
        'sender_name': seller_profile.display_name or seller_user.get_full_name() or seller_user.username,
        'affiliate_link': seller_profile.affiliate_link or '',
    }

    return send_email(
        template_name='freebie_delivery',
        subject='Your 5-Minute Content Engine is ready 🚀',
        to_email=order.customer_email,
        context=context
    )


def send_ecourse_email(order: Order) -> bool:
    """Send e-course enrollment confirmation email."""
    custom_link = order.custom_link
    additional_info = custom_link.additional_info or {}

    context = {
        'customer_name': order.customer_name,
        'order_id': order.order_id,
        'product_title': custom_link.title or custom_link.checkout_title or 'Online Course',
        'product_subtitle': custom_link.subtitle,
        'product_price': custom_link.checkout_price,
        'purchase_date': order.created_at,
        'course_duration': additional_info.get('course_duration'),
        'course_modules': additional_info.get('course_modules', []),
        'form_responses': order.get_formatted_responses(),
    }

    return send_email(
        template_name='ecourse_delivery',
        subject=f'Welcome to your course: {context["product_title"]}',
        to_email=order.customer_email,
        context=context
    )


def send_url_media_email(order: Order) -> bool:
    """Send URL/media access email."""
    custom_link = order.custom_link
    additional_info = custom_link.additional_info or {}

    context = {
        'customer_name': order.customer_name,
        'order_id': order.order_id,
        'product_title': custom_link.title or custom_link.checkout_title or 'Media Content',
        'product_subtitle': custom_link.subtitle,
        'product_price': custom_link.checkout_price,
        'purchase_date': order.created_at,
        'destination_url': additional_info.get('destination_url'),
        'button_text': additional_info.get('button_text', 'Access Content'),
        'form_responses': order.get_formatted_responses(),
    }

    return send_email(
        template_name='url_media_delivery',
        subject=f'Your access is ready: {context["product_title"]}',
        to_email=order.customer_email,
        context=context
    )


def send_custom_product_email(order: Order) -> bool:
    """Send custom product order confirmation email."""
    custom_link = order.custom_link
    additional_info = custom_link.additional_info or {}

    context = {
        'customer_name': order.customer_name,
        'order_id': order.order_id,
        'product_title': custom_link.title or custom_link.checkout_title or 'Custom Product',
        'product_subtitle': custom_link.subtitle,
        'product_price': custom_link.checkout_price,
        'purchase_date': order.created_at,
        'custom_fields': additional_info.get('custom_fields', []),
        'form_responses': order.get_formatted_responses(),
    }

    return send_email(
        template_name='custom_product_delivery',
        subject=f'Order confirmed: {context["product_title"]}',
        to_email=order.customer_email,
        context=context
    )


def send_generic_product_email(order: Order) -> bool:
    """Send generic product order confirmation email."""
    custom_link = order.custom_link

    context = {
        'customer_name': order.customer_name,
        'order_id': order.order_id,
        'product_title': custom_link.title or custom_link.checkout_title or 'Product',
        'product_subtitle': custom_link.subtitle,
        'product_price': custom_link.checkout_price,
        'purchase_date': order.created_at,
        'form_responses': order.get_formatted_responses(),
    }

    return send_email(
        template_name='generic_product_delivery',
        subject=f'Order received: {context["product_title"]}',
        to_email=order.customer_email,
        context=context
    )