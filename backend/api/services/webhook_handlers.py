"""
Stripe Webhook Handlers for processing payment events
"""
import json
import logging
import datetime
from typing import Dict, Any

import stripe
from django.conf import settings
from django.utils import timezone

from ..models import (
    Plan, Subscription, StripeCustomer, 
    PaymentEvent, User
)
from .email_service import (
    send_welcome_email, send_trial_ending_email, 
    send_payment_succeeded_email, send_payment_failed_email,
    send_subscription_cancelled_email
)

logger = logging.getLogger(__name__)


def verify_webhook_signature(payload: str, sig_header: str) -> stripe.Event:
    """
    Verify the webhook signature and construct the event.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise


def handle_webhook_event(event: stripe.Event) -> Dict[str, Any]:
    """
    Main webhook handler that routes events to specific handlers.
    """
    logger.info(f"=== WEBHOOK EVENT RECEIVED ===")
    logger.info(f"Event ID: {event.id}")
    logger.info(f"Event Type: {event.type}")
    logger.info(f"Event Created: {event.created}")
    logger.info(f"Event Livemode: {event.livemode}")
    logger.info(f"Event Object: {type(event.data.object).__name__}")
    
    # Log the full event data object
    try:
        import json
        event_data = event.data.object
        logger.info(f"Event Data Object ID: {getattr(event_data, 'id', 'N/A')}")
        logger.info(f"Event Data Object Type: {getattr(event_data, 'object', 'N/A')}")
        
        # Log specific details based on object type
        if hasattr(event_data, 'status'):
            logger.info(f"Object Status: {event_data.status}")
        if hasattr(event_data, 'customer'):
            logger.info(f"Customer: {event_data.customer}")
        if hasattr(event_data, 'subscription'):
            logger.info(f"Subscription: {event_data.subscription}")
        if hasattr(event_data, 'metadata'):
            logger.info(f"Metadata: {dict(event_data.metadata)}")
            
        # For subscription objects, log trial info
        if event_data.object == 'subscription':
            logger.info(f"Subscription Details:")
            logger.info(f"  ID: {event_data.id}")
            logger.info(f"  Status: {event_data.status}")
            logger.info(f"  Customer: {event_data.customer}")
            logger.info(f"  Trial Start: {getattr(event_data, 'trial_start', None)}")
            logger.info(f"  Trial End: {getattr(event_data, 'trial_end', None)}")
            logger.info(f"  Current Period Start: {getattr(event_data, 'current_period_start', None)}")
            logger.info(f"  Current Period End: {getattr(event_data, 'current_period_end', None)}")
            logger.info(f"  Canceled At: {getattr(event_data, 'canceled_at', None)}")
            
    except Exception as e:
        logger.error(f"Error logging event details: {e}")
    
    # Check if we've already processed this event
    if PaymentEvent.objects.filter(stripe_event_id=event.id).exists():
        logger.info(f"Event {event.id} already processed, skipping")
        return {"status": "already_processed"}
    
    # Map event types to handler functions
    handlers = {
        "checkout.session.completed": handle_checkout_session_completed,
        "customer.subscription.created": handle_subscription_created,
        "customer.subscription.updated": handle_subscription_updated,
        "customer.subscription.deleted": handle_subscription_deleted,
        "customer.subscription.trial_will_end": handle_trial_will_end,
        "invoice.created": handle_invoice_created,
        "invoice.payment_succeeded": handle_invoice_payment_succeeded,
        "invoice.payment_failed": handle_invoice_payment_failed,
        "invoice.finalized": handle_invoice_finalized,
        "payment_method.attached": handle_payment_method_attached,
        "payment_method.detached": handle_payment_method_detached,
    }
    
    handler = handlers.get(event.type)
    if handler:
        try:
            result = handler(event)
            
            # Log the event
            _log_payment_event(event)
            
            logger.info(f"Successfully processed {event.type} event {event.id}")
            return result
        except Exception as e:
            logger.error(f"Error processing {event.type} event {event.id}: {e}")
            raise
    else:
        logger.info(f"Unhandled event type: {event.type}")
        return {"status": "unhandled"}


def _log_payment_event(event: stripe.Event):
    """
    Log the payment event to database.
    """
    try:
        # Extract user ID from metadata
        user_id = None
        if hasattr(event.data.object, "metadata"):
            user_id = event.data.object.metadata.get("user_id")
        
        # Try to find user
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # If no user from metadata, try from customer
        if not user and hasattr(event.data.object, "customer"):
            try:
                stripe_customer = StripeCustomer.objects.get(
                    stripe_customer_id=event.data.object.customer
                )
                user = stripe_customer.user
            except StripeCustomer.DoesNotExist:
                pass
        
        PaymentEvent.objects.create(
            user=user,
            event_type=event.type,
            stripe_event_id=event.id,
            payload=event.data
        )
    except Exception as e:
        logger.error(f"Error logging payment event: {e}")


def handle_checkout_session_completed(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle successful checkout session completion.
    User has completed signup (with or without trial).
    """
    session = event.data.object
    logger.info(f"Processing checkout.session.completed event: {event.id}")
    
    # Extract metadata
    username = session.metadata.get("username")
    plan_id = session.metadata.get("plan_id")
    user_id = session.metadata.get("user_id")
    
    try:
        user = User.objects.get(id=user_id)
        plan = Plan.objects.get(id=plan_id)
        
        # Get or create Stripe customer record
        if not hasattr(user, "stripe_customer"):
            StripeCustomer.objects.create(
                user=user,
                stripe_customer_id=session.customer
            )
        
        # Get the actual subscription from Stripe to check trial status
        stripe_sub = stripe.Subscription.retrieve(session.subscription)
        status = stripe_sub.status.upper()
        is_trialing = stripe_sub.status.lower() == "trialing"
        
        logger.info(f"Stripe subscription {stripe_sub.id}:")
        logger.info(f"  Status: {stripe_sub.status}")
        logger.info(f"  Trial start: {getattr(stripe_sub, 'trial_start', None)}")
        logger.info(f"  Trial end: {getattr(stripe_sub, 'trial_end', None)}")
        logger.info(f"  Current period start: {getattr(stripe_sub, 'current_period_start', None)}")
        logger.info(f"  Current period end: {getattr(stripe_sub, 'current_period_end', None)}")
        logger.info(f"  Is trialing: {is_trialing}")
        
        # Create or update subscription
        subscription, created = Subscription.objects.update_or_create(
            user=user,
            defaults={
                "plan": plan,
                "stripe_subscription_id": session.subscription,
                "status": status,
                "is_trialing": is_trialing,
                "trial_start": datetime.datetime.fromtimestamp(stripe_sub.trial_start, tz=datetime.timezone.utc) if getattr(stripe_sub, 'trial_start', None) else None,
                "trial_end": datetime.datetime.fromtimestamp(stripe_sub.trial_end, tz=datetime.timezone.utc) if getattr(stripe_sub, 'trial_end', None) else None,
                "current_period_start": (
                    datetime.datetime.fromtimestamp(stripe_sub.current_period_start, tz=datetime.timezone.utc) 
                    if getattr(stripe_sub, 'current_period_start', None) 
                    else (datetime.datetime.fromtimestamp(stripe_sub.trial_start, tz=datetime.timezone.utc) if getattr(stripe_sub, 'trial_start', None) else None)
                ),
                "current_period_end": (
                    datetime.datetime.fromtimestamp(stripe_sub.current_period_end, tz=datetime.timezone.utc) 
                    if getattr(stripe_sub, 'current_period_end', None) 
                    else (datetime.datetime.fromtimestamp(stripe_sub.trial_end, tz=datetime.timezone.utc) if getattr(stripe_sub, 'trial_end', None) else None)
                ),
            }
        )
        
        logger.info(f"{'Created' if created else 'Updated'} subscription for user {user.username}")
        
        # Send welcome email
        try:
            email_sent = send_welcome_email(subscription)
            logger.info(f"Welcome email {'sent' if email_sent else 'failed to send'} for subscription {subscription.id}")
        except Exception as e:
            logger.error(f"Error sending welcome email for subscription {subscription.id}: {e}")
        
        return {"status": "success", "subscription_id": subscription.id}
        
    except (User.DoesNotExist, Plan.DoesNotExist) as e:
        logger.error(f"Object not found in checkout.session.completed: {e}")
        return {"status": "error", "message": str(e)}


def handle_subscription_created(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle new subscription creation.
    """
    subscription = event.data.object
    logger.info(f"Processing subscription.created event: {event.id}")
    logger.info(f"Subscription object type: {type(subscription)}")
    logger.info(f"Subscription customer: {subscription.customer}")
    
    try:
        stripe_customer = StripeCustomer.objects.get(
            stripe_customer_id=subscription.customer
        )
        user = stripe_customer.user
        logger.info(f"Found user: {user.username}")
        
        # Find the plan - handle different Stripe object formats
        logger.info(f"Subscription items type: {type(subscription.items)}")
        logger.info(f"Subscription items: {subscription.items}")
        
        try:
            price_id = subscription.items.data[0].price.id
            logger.info(f"Got price_id via .data[0].price.id: {price_id}")
        except (AttributeError, TypeError) as e:
            logger.info(f"Failed to get price_id via .data access: {e}")
            # If the above fails, try accessing as dict
            try:
                price_id = subscription['items']['data'][0]['price']['id']
                logger.info(f"Got price_id via dict access: {price_id}")
            except Exception as e2:
                logger.error(f"Failed to get price_id via dict access too: {e2}")
                logger.info(f"Raw subscription object: {subscription}")
                raise
        
        plan = Plan.objects.filter(stripe_price_id=price_id).first()
        logger.info(f"Found plan: {plan.name if plan else 'None'}")
        
        # Create or update subscription
        status = subscription.status.upper()
        is_trialing = subscription.status.lower() == "trialing"
        
        sub, created = Subscription.objects.update_or_create(
            user=user,
            defaults={
                "stripe_subscription_id": subscription.id,
                "plan": plan,
                "status": status,
                "trial_start": datetime.datetime.fromtimestamp(subscription.trial_start, tz=datetime.timezone.utc) if getattr(subscription, 'trial_start', None) else None,
                "trial_end": datetime.datetime.fromtimestamp(subscription.trial_end, tz=datetime.timezone.utc) if getattr(subscription, 'trial_end', None) else None,
                "is_trialing": is_trialing,
                "current_period_start": (
                    datetime.datetime.fromtimestamp(subscription.current_period_start, tz=datetime.timezone.utc) 
                    if getattr(subscription, 'current_period_start', None) 
                    else (datetime.datetime.fromtimestamp(subscription.trial_start, tz=datetime.timezone.utc) if getattr(subscription, 'trial_start', None) else None)
                ),
                "current_period_end": (
                    datetime.datetime.fromtimestamp(subscription.current_period_end, tz=datetime.timezone.utc) 
                    if getattr(subscription, 'current_period_end', None) 
                    else (datetime.datetime.fromtimestamp(subscription.trial_end, tz=datetime.timezone.utc) if getattr(subscription, 'trial_end', None) else None)
                ),
            }
        )
        
        logger.info(f"{'Created' if created else 'Updated'} subscription {sub.id} from subscription.created event")
        return {"status": "success", "subscription_id": sub.id}
        
    except StripeCustomer.DoesNotExist:
        logger.error(f"StripeCustomer not found for {subscription.customer}")
        return {"status": "error", "message": "Customer not found"}


def handle_subscription_updated(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle subscription updates (status changes, plan changes, etc).
    """
    subscription = event.data.object
    
    try:
        sub = Subscription.objects.get(stripe_subscription_id=subscription.id)
        
        # Find the new plan if changed
        try:
            price_id = subscription.items.data[0].price.id
        except (AttributeError, TypeError):
            # If the above fails, try accessing as dict
            price_id = subscription['items']['data'][0]['price']['id']
        
        plan = Plan.objects.filter(stripe_price_id=price_id).first()
        
        # Update subscription
        sub.status = subscription.status.upper()
        sub.plan = plan
        sub.is_trialing = subscription.status.lower() == "trialing"
        sub.trial_end = datetime.datetime.fromtimestamp(subscription.trial_end, tz=datetime.timezone.utc) if getattr(subscription, 'trial_end', None) else None
        sub.current_period_start = (
            datetime.datetime.fromtimestamp(subscription.current_period_start, tz=datetime.timezone.utc) 
            if getattr(subscription, 'current_period_start', None) 
            else (datetime.datetime.fromtimestamp(subscription.trial_start, tz=datetime.timezone.utc) if getattr(subscription, 'trial_start', None) else None)
        )
        sub.current_period_end = (
            datetime.datetime.fromtimestamp(subscription.current_period_end, tz=datetime.timezone.utc) 
            if getattr(subscription, 'current_period_end', None) 
            else (datetime.datetime.fromtimestamp(subscription.trial_end, tz=datetime.timezone.utc) if getattr(subscription, 'trial_end', None) else None)
        )
        
        if getattr(subscription, 'canceled_at', None):
            sub.canceled_at = datetime.datetime.fromtimestamp(subscription.canceled_at, tz=datetime.timezone.utc)
        
        sub.save()
        
        logger.info(f"Updated subscription {sub.id} status to {sub.status}")
        return {"status": "success", "subscription_id": sub.id}
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found for {subscription.id}")
        return {"status": "error", "message": "Subscription not found"}


def handle_subscription_deleted(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle subscription cancellation/deletion.
    """
    subscription = event.data.object
    
    try:
        sub = Subscription.objects.get(stripe_subscription_id=subscription.id)
        sub.status = "CANCELED"
        sub.canceled_at = timezone.now()
        sub.save()
        
        logger.info(f"Canceled subscription {sub.id}")
        
        # Send cancellation email
        try:
            email_sent = send_subscription_cancelled_email(sub)
            logger.info(f"Cancellation email {'sent' if email_sent else 'failed to send'} for subscription {sub.id}")
        except Exception as e:
            logger.error(f"Error sending cancellation email for subscription {sub.id}: {e}")
        
        # TODO: Revoke LinkHub access if needed
        
        return {"status": "success", "subscription_id": sub.id}
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found for {subscription.id}")
        return {"status": "error", "message": "Subscription not found"}


def handle_trial_will_end(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle trial ending soon notification (sent 3 days before trial ends).
    """
    subscription = event.data.object
    
    try:
        sub = Subscription.objects.get(stripe_subscription_id=subscription.id)
        
        logger.info(f"Trial will end soon for subscription {sub.id}")
        
        # Send trial ending reminder email
        try:
            email_sent = send_trial_ending_email(sub)
            logger.info(f"Trial ending email {'sent' if email_sent else 'failed to send'} for subscription {sub.id}")
        except Exception as e:
            logger.error(f"Error sending trial ending email for subscription {sub.id}: {e}")
        
        return {"status": "success", "subscription_id": sub.id}
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found for {subscription.id}")
        return {"status": "error", "message": "Subscription not found"}


def handle_invoice_created(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle invoice creation.
    """
    invoice = event.data.object
    logger.info(f"Invoice {invoice.id} created for customer {invoice.customer}")
    return {"status": "success"}


def handle_invoice_payment_succeeded(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle successful payment (including after trial).
    """
    invoice = event.data.object
    
    try:
        # Find subscription
        sub = Subscription.objects.get(stripe_subscription_id=invoice.subscription)
        
        # Update subscription status
        sub.status = "ACTIVE"
        sub.is_trialing = False
        sub.save()
        
        logger.info(f"Payment succeeded for subscription {sub.id}")
        
        # Send payment confirmation email
        try:
            email_sent = send_payment_succeeded_email(sub)
            logger.info(f"Payment success email {'sent' if email_sent else 'failed to send'} for subscription {sub.id}")
        except Exception as e:
            logger.error(f"Error sending payment success email for subscription {sub.id}: {e}")
        
        # TODO: Grant/maintain LinkHub access
        
        return {"status": "success", "subscription_id": sub.id}
        
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for invoice {invoice.subscription}")
        return {"status": "warning", "message": "Subscription not found"}


def handle_invoice_payment_failed(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle failed payment.
    """
    invoice = event.data.object
    
    try:
        # Find subscription
        sub = Subscription.objects.get(stripe_subscription_id=invoice.subscription)
        
        # Update subscription status
        sub.status = "PAST_DUE"
        sub.save()
        
        logger.warning(f"Payment failed for subscription {sub.id}")
        
        # Send payment failure email
        try:
            email_sent = send_payment_failed_email(sub)
            logger.info(f"Payment failed email {'sent' if email_sent else 'failed to send'} for subscription {sub.id}")
        except Exception as e:
            logger.error(f"Error sending payment failed email for subscription {sub.id}: {e}")
        
        return {"status": "success", "subscription_id": sub.id}
        
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for invoice {invoice.subscription}")
        return {"status": "warning", "message": "Subscription not found"}


def handle_invoice_finalized(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle invoice finalization (ready for payment).
    """
    invoice = event.data.object
    logger.info(f"Invoice {invoice.id} finalized for customer {invoice.customer}")
    return {"status": "success"}


def handle_payment_method_attached(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle payment method attachment to customer.
    """
    payment_method = event.data.object
    logger.info(f"Payment method {payment_method.id} attached to customer {payment_method.customer}")
    return {"status": "success"}


def handle_payment_method_detached(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle payment method detachment from customer.
    """
    payment_method = event.data.object
    logger.info(f"Payment method {payment_method.id} detached from customer")
    return {"status": "success"}