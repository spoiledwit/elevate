"""
Stripe Webhook Handlers for processing payment events
"""
import json
import logging
import datetime
from decimal import Decimal
from typing import Dict, Any

import stripe
from django.conf import settings
from django.utils import timezone

from ..models import (
    Plan, Subscription, StripeCustomer,
    PaymentEvent, User, UserProfile,
    CreditTransaction, PaymentTransaction
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


def handle_credit_purchase(session: stripe.checkout.Session) -> Dict[str, Any]:
    """
    Handle credit purchase from checkout session.
    """
    user_id = session.metadata.get("user_id")
    credit_amount = session.metadata.get("credit_amount")

    if not user_id or not credit_amount:
        logger.error(f"Missing user_id or credit_amount in session metadata")
        return {"status": "error", "message": "Missing required metadata"}

    try:
        from django.db import transaction as db_transaction

        with db_transaction.atomic():
            # Get user and profile
            user = User.objects.get(id=user_id)
            user_profile = UserProfile.objects.select_for_update().get(user=user)

            # Convert credit amount to Decimal
            credits = Decimal(str(credit_amount))

            # Calculate price (should match frontend: $1.00 per credit)
            price_per_credit = Decimal('1.00')
            total_paid = credits * price_per_credit

            # Update user profile credits
            old_balance = user_profile.milo_credits
            user_profile.milo_credits += credits
            user_profile.total_credits_purchased += credits
            user_profile.save()

            # Create credit transaction record
            payment_intent_id = session.payment_intent if hasattr(session, 'payment_intent') else 'N/A'
            credit_transaction = CreditTransaction.objects.create(
                user=user,
                transaction_type='purchase',
                amount=credits,
                balance_after=user_profile.milo_credits,
                description=f"Credit purchase via Stripe - {credits} credits (${total_paid}) | Session: {session.id} | Payment Intent: {payment_intent_id}"
            )

            logger.info(f"Credit purchase successful for user {user.username}:")
            logger.info(f"  Credits purchased: {credits}")
            logger.info(f"  Amount paid: ${total_paid}")
            logger.info(f"  Old balance: {old_balance}")
            logger.info(f"  New balance: {user_profile.milo_credits}")
            logger.info(f"  Transaction ID: {credit_transaction.id}")

            return {
                "status": "success",
                "user_id": user.id,
                "credits_added": float(credits),
                "new_balance": float(user_profile.milo_credits),
                "transaction_id": credit_transaction.id
            }

    except User.DoesNotExist:
        logger.error(f"User not found for credit purchase: user_id={user_id}")
        return {"status": "error", "message": "User not found"}
    except UserProfile.DoesNotExist:
        logger.error(f"UserProfile not found for user_id={user_id}")
        return {"status": "error", "message": "User profile not found"}
    except Exception as e:
        logger.error(f"Error processing credit purchase: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


def handle_checkout_session_completed(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle successful checkout session completion.
    Routes to either subscription or credit purchase handler based on metadata.
    """
    session = event.data.object
    logger.info(f"Processing checkout.session.completed event: {event.id}")

    # Check if this is a credit purchase
    session_type = session.metadata.get("type")
    if session_type == "credit_purchase":
        logger.info(f"Detected credit purchase session")
        return handle_credit_purchase(session)

    # Otherwise, handle as subscription
    logger.info(f"Detected subscription session")

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


# ============================================================================
# STRIPE CONNECT WEBHOOK HANDLERS
# ============================================================================

def verify_connect_webhook_signature(payload: str, sig_header: str) -> stripe.Event:
    """
    Verify the Connect webhook signature and construct the event.
    Uses a separate webhook secret for Connect events.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_CONNECT_WEBHOOK_SECRET
        )
        return event
    except ValueError as e:
        logger.error(f"Invalid Connect webhook payload: {e}")
        raise
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid Connect webhook signature: {e}")
        raise


def handle_connect_webhook_event(event: stripe.Event) -> Dict[str, Any]:
    """
    Main Connect webhook handler that routes events to specific handlers.
    """
    logger.info(f"=== CONNECT WEBHOOK EVENT RECEIVED ===")
    logger.info(f"Event ID: {event.id}")
    logger.info(f"Event Type: {event.type}")
    logger.info(f"Event Created: {event.created}")
    logger.info(f"Event Livemode: {event.livemode}")

    # Import here to avoid circular imports
    from ..models import ConnectWebhookEvent

    # Check if we've already processed this event
    if ConnectWebhookEvent.objects.filter(stripe_event_id=event.id).exists():
        logger.info(f"Connect event {event.id} already processed, skipping")
        return {"status": "already_processed"}

    # Map event types to handler functions
    connect_handlers = {
        "account.updated": handle_account_updated,
        "account.application.authorized": handle_account_authorized,
        "checkout.session.completed": handle_connect_checkout_session_completed,
        "payment_intent.succeeded": handle_connect_payment_succeeded,
        "payment_intent.payment_failed": handle_connect_payment_failed,
        "transfer.created": handle_transfer_created,
        "transfer.updated": handle_transfer_updated,
        "payout.created": handle_payout_created,
        "payout.updated": handle_payout_updated,
        "charge.dispute.created": handle_charge_dispute_created,
    }

    handler = connect_handlers.get(event.type)
    if handler:
        try:
            result = handler(event)
            
            # Log the event
            _log_connect_event(event, processed=True)
            
            logger.info(f"Successfully processed Connect {event.type} event {event.id}")
            return result
        except Exception as e:
            # Log the event with error
            _log_connect_event(event, processed=False, error_message=str(e))
            logger.error(f"Error processing Connect {event.type} event {event.id}: {e}")
            raise
    else:
        # Log unhandled event
        _log_connect_event(event, processed=False, error_message=f"Unhandled event type: {event.type}")
        logger.info(f"Unhandled Connect event type: {event.type}")
        return {"status": "unhandled"}


def _log_connect_event(event: stripe.Event, processed: bool = True, error_message: str = ""):
    """
    Log the Connect webhook event to database.
    """
    try:
        from ..models import ConnectWebhookEvent, StripeConnectAccount, PaymentTransaction

        # Extract account ID if present
        account_id = ""
        connect_account = None
        payment_transaction = None

        # Try to get account ID from event data
        event_data = event.data.object
        if hasattr(event_data, 'account'):
            account_id = event_data.account
        elif hasattr(event_data, 'destination'):
            account_id = event_data.destination
        elif hasattr(event_data, 'metadata') and event_data.metadata.get('connect_account_id'):
            account_id = event_data.metadata.get('connect_account_id')

        # Try to find related models
        if account_id:
            try:
                connect_account = StripeConnectAccount.objects.get(stripe_account_id=account_id)
            except StripeConnectAccount.DoesNotExist:
                pass

        # Try to find related payment transaction
        if hasattr(event_data, 'payment_intent'):
            try:
                payment_transaction = PaymentTransaction.objects.get(payment_intent_id=event_data.payment_intent)
            except PaymentTransaction.DoesNotExist:
                pass
        elif hasattr(event_data, 'metadata') and event_data.metadata.get('order_id'):
            try:
                payment_transaction = PaymentTransaction.objects.get(order_id=event_data.metadata.get('order_id'))
            except PaymentTransaction.DoesNotExist:
                pass

        # Create webhook event record
        ConnectWebhookEvent.objects.create(
            stripe_event_id=event.id,
            event_type=event.type,
            account_id=account_id,
            connect_account=connect_account,
            payment_transaction=payment_transaction,
            data=event.data.object,
            processed=processed,
            error_message=error_message,
            processed_at=timezone.now() if processed else None
        )

    except Exception as e:
        logger.error(f"Error logging Connect webhook event {event.id}: {e}")


def handle_account_updated(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle account.updated events - when a connected account's status changes.
    """
    from .stripe_connect_service import stripe_connect_service
    
    account = event.data.object
    logger.info(f"Account {account.id} updated")

    try:
        # Update account status in our database
        account_status = stripe_connect_service.get_account_status(account.id)
        
        logger.info(f"Updated account {account.id} - charges_enabled: {account_status['charges_enabled']}, payouts_enabled: {account_status['payouts_enabled']}")
        return {"status": "success", "account_status": account_status}
    except Exception as e:
        logger.error(f"Error updating account {account.id}: {e}")
        return {"status": "error", "error": str(e)}


def handle_account_authorized(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle account.application.authorized - when a user authorizes the platform.
    """
    account = event.data.object
    logger.info(f"Account {account.id} authorized the application")
    return {"status": "success"}


def handle_connect_checkout_session_completed(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle completed checkout sessions for Connect payments.
    """
    from ..models import PaymentTransaction
    from django.utils import timezone
    
    session = event.data.object
    logger.info(f"Connect checkout session {session.id} completed")
    logger.info(f"Payment intent: {session.payment_intent}")

    try:
        # Find the payment transaction
        transaction = PaymentTransaction.objects.get(stripe_checkout_session_id=session.id)
        
        # Update transaction with payment intent ID and customer details
        if session.payment_intent:
            transaction.payment_intent_id = session.payment_intent
        
        if session.customer_details and session.customer_details.email:
            transaction.customer_email = session.customer_details.email
            transaction.order.customer_email = session.customer_details.email
            transaction.order.save()
        
        # Update transaction status to succeeded since checkout completed
        transaction.status = 'succeeded'
        transaction.paid_at = timezone.now()
        transaction.save()
        
        # Update order status to completed
        transaction.order.status = 'completed'
        transaction.order.save()
        
        logger.info(f"Updated transaction {transaction.id} to succeeded status")
        logger.info(f"Updated order {transaction.order.order_id} to completed status")
        
        return {"status": "success", "transaction_id": transaction.id}

    except PaymentTransaction.DoesNotExist:
        logger.error(f"PaymentTransaction not found for checkout session {session.id}")
        return {"status": "error", "error": "Transaction not found"}


def handle_connect_payment_succeeded(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle successful payments for Connect transactions.
    """
    from .stripe_connect_service import stripe_connect_service
    
    payment_intent = event.data.object
    logger.info(f"Connect payment {payment_intent.id} succeeded")

    try:
        transaction = stripe_connect_service.handle_successful_payment(payment_intent.id)
        if transaction:
            return {"status": "success", "transaction_id": transaction.id}
        else:
            return {"status": "error", "error": "Transaction not found"}
    except Exception as e:
        logger.error(f"Error handling successful Connect payment {payment_intent.id}: {e}")
        return {"status": "error", "error": str(e)}


def handle_connect_payment_failed(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle failed payments for Connect transactions.
    """
    from ..models import PaymentTransaction
    
    payment_intent = event.data.object
    logger.info(f"Connect payment {payment_intent.id} failed")

    try:
        transaction = PaymentTransaction.objects.get(payment_intent_id=payment_intent.id)
        transaction.status = 'failed'
        transaction.save()

        # Update order status
        transaction.order.status = 'cancelled'
        transaction.order.save()

        logger.info(f"Marked transaction {transaction.id} as failed")
        return {"status": "success", "transaction_id": transaction.id}

    except PaymentTransaction.DoesNotExist:
        logger.error(f"PaymentTransaction not found for payment intent {payment_intent.id}")
        return {"status": "error", "error": "Transaction not found"}


def handle_transfer_created(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle transfer.created events - when funds are transferred to connected accounts.
    """
    from .stripe_connect_service import stripe_connect_service
    
    transfer = event.data.object
    logger.info(f"Transfer {transfer.id} created to {transfer.destination}")

    try:
        transaction = stripe_connect_service.handle_transfer_created(transfer.id)
        if transaction:
            return {"status": "success", "transaction_id": transaction.id}
        else:
            return {"status": "warning", "error": "Transaction not found"}
    except Exception as e:
        logger.error(f"Error handling transfer {transfer.id}: {e}")
        return {"status": "error", "error": str(e)}


def handle_transfer_updated(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle transfer.updated events.
    """
    transfer = event.data.object
    logger.info(f"Transfer {transfer.id} updated - status: {transfer.status}")
    
    # Could update transfer status in PaymentTransaction here if needed
    return {"status": "success"}


def handle_payout_created(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle payout.created events - when Stripe initiates a payout to connected account.
    """
    payout = event.data.object
    logger.info(f"Payout {payout.id} created for account {getattr(payout, 'account', 'unknown')}")
    return {"status": "success"}


def handle_payout_updated(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle payout.updated events.
    """
    payout = event.data.object
    logger.info(f"Payout {payout.id} updated - status: {payout.status}")
    return {"status": "success"}


def handle_charge_dispute_created(event: stripe.Event) -> Dict[str, Any]:
    """
    Handle charge.dispute.created events.
    """
    dispute = event.data.object
    logger.info(f"Dispute {dispute.id} created for charge {dispute.charge}")
    
    # Could notify platform admin and/or seller about the dispute
    return {"status": "success"}