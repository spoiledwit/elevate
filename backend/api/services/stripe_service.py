"""
Stripe Service for handling all Stripe-related operations
"""
import logging
import datetime
from decimal import Decimal
from typing import Optional, Dict, Any

import stripe
from django.conf import settings
from django.db import transaction

from ..models import Plan, StripeCustomer, Subscription, User

logger = logging.getLogger(__name__)


def init_stripe():
    """Initialize Stripe with API key"""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def sync_plan_to_stripe(plan: Plan) -> Dict[str, str]:
    """
    Sync a Plan to Stripe as a Product and Price.
    Returns dict with stripe_product_id and stripe_price_id.
    """
    init_stripe()
    
    try:
        # Create or update product
        if plan.stripe_product_id:
            # Update existing product
            product = stripe.Product.modify(
                plan.stripe_product_id,
                name=plan.name,
                description=plan.description or "",
                metadata={"plan_id": str(plan.id), "slug": plan.slug},
                active=plan.is_active
            )
            logger.info(f"Updated Stripe product {product.id} for plan {plan.id}")
        else:
            # Create new product
            product = stripe.Product.create(
                name=plan.name,
                description=plan.description or "",
                metadata={"plan_id": str(plan.id), "slug": plan.slug}
            )
            logger.info(f"Created Stripe product {product.id} for plan {plan.id}")
            
        # Create price (prices are immutable, so always create new)
        # Archive old price if exists
        if plan.stripe_price_id:
            try:
                stripe.Price.modify(plan.stripe_price_id, active=False)
            except Exception as e:
                logger.warning(f"Could not archive old price: {e}")
        
        # Determine recurring interval
        interval = "month" if plan.billing_period == "MONTHLY" else "year"
        
        # Create new price
        price = stripe.Price.create(
            product=product.id,
            unit_amount=int(plan.price * 100),  # Convert to cents
            currency="usd",
            recurring={"interval": interval},
            metadata={"plan_id": str(plan.id)}
        )
        logger.info(f"Created Stripe price {price.id} for plan {plan.id}")
        
        # Update plan with Stripe IDs
        plan.stripe_product_id = product.id
        plan.stripe_price_id = price.id
        plan.save(update_fields=["stripe_product_id", "stripe_price_id"])
        
        return {
            "stripe_product_id": product.id,
            "stripe_price_id": price.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error syncing plan {plan.id}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error syncing plan {plan.id} to Stripe: {e}")
        raise


def get_or_create_customer(user: User) -> StripeCustomer:
    """
    Get or create a Stripe customer for a user.
    """
    init_stripe()
    
    # Check if customer already exists
    try:
        stripe_customer = StripeCustomer.objects.get(user=user)
        logger.info(f"Found existing Stripe customer {stripe_customer.stripe_customer_id}")
        return stripe_customer
    except StripeCustomer.DoesNotExist:
        pass
    
    # Create new Stripe customer
    try:
        customer = stripe.Customer.create(
            email=user.email or user.username,
            name=user.username,
            metadata={
                "user_id": str(user.id),
                "username": user.username
            }
        )
        
        # Save to database
        stripe_customer = StripeCustomer.objects.create(
            user=user,
            stripe_customer_id=customer.id
        )

        logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
        return stripe_customer
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating customer for user {user.id}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error creating Stripe customer for user {user.id}: {e}")
        raise


def create_checkout_session(
    user: User,
    plan: Plan,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None
) -> str:
    """
    Create a Stripe Checkout Session for subscription with trial.
    Returns the checkout session URL.
    """
    init_stripe()
    
    # Ensure plan is synced to Stripe
    if not plan.stripe_price_id:
        sync_plan_to_stripe(plan)
    
    # Get or create customer
    stripe_customer = get_or_create_customer(user)

    # Set URLs
    base_url = settings.FRONTEND_URL
    success_url = success_url or f"{base_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = cancel_url or f"{base_url}/subscription/cancel"
    
    try:
        # Prepare subscription data
        subscription_data = {
            "metadata": {
                "username": str(user.username),
                "plan_id": str(plan.id),
                "user_id": str(user.id)
            }
        }
        
        # Only add trial period if it's greater than 0 (Stripe minimum is 1 day)
        if plan.trial_period_days and plan.trial_period_days > 0:
            subscription_data["trial_period_days"] = plan.trial_period_days
            subscription_data["trial_settings"] = {
                "end_behavior": {
                    "missing_payment_method": "cancel"
                }
            }
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=stripe_customer.stripe_customer_id,
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{
                "price": plan.stripe_price_id,
                "quantity": 1,
            }],
            subscription_data=subscription_data,
            payment_method_collection="always",  # Always collect payment method
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "username": str(user.username),
                "plan_id": str(plan.id),
                "user_id": str(user.id)
            },
            # Enable automatic tax calculation (optional)
            # automatic_tax={"enabled": True},
        )
        
        logger.info(f"Created checkout session {session.id} for user {user.id}")
        return session.url
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {e}")
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise


def create_portal_session(user: User) -> str:
    """
    Create a Stripe Customer Portal session.
    Returns the portal session URL.
    """
    init_stripe()
    
    try:
        # Get Stripe customer
        stripe_customer = StripeCustomer.objects.get(user=user)

        # Create portal session with Elevate Social branding
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer.stripe_customer_id,
            configuration="bpc_1RvkdKE3V7A3gKYDXacbHj1Z",  # Elevate Social portal config
            return_url=f"{settings.FRONTEND_URL}/subscription",
        )

        logger.info(f"Created portal session for user {user.id}")
        return session.url
        
    except StripeCustomer.DoesNotExist:
        logger.error(f"No Stripe customer found for user {user.id}")
        raise ValueError("No Stripe customer found for this user")
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating portal session: {e}")
        raise
    except Exception as e:
        logger.error(f"Error creating portal session: {e}")
        raise


def cancel_subscription(subscription: Subscription, at_period_end: bool = True) -> Subscription:
    """
    Cancel a subscription.
    
    Args:
        subscription: The Subscription model instance
        at_period_end: If True, cancel at the end of the current period.
                      If False, cancel immediately.
    """
    init_stripe()
    
    try:
        # Cancel in Stripe
        if at_period_end:
            # Cancel at period end (user keeps access until then)
            stripe_sub = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )
            logger.info(f"Scheduled subscription {subscription.id} for cancellation at period end")
        else:
            # Cancel immediately
            stripe_sub = stripe.Subscription.delete(
                subscription.stripe_subscription_id
            )
            logger.info(f"Immediately canceled subscription {subscription.id}")
        
        # Update local subscription
        if not at_period_end:
            subscription.status = "CANCELED"
        subscription.canceled_at = datetime.datetime.fromtimestamp(stripe_sub.canceled_at, tz=datetime.timezone.utc) if stripe_sub.canceled_at else None
        subscription.save()
        
        return subscription
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error canceling subscription {subscription.id}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error canceling subscription {subscription.id}: {e}")
        raise


def get_subscription_status(user: User) -> Dict[str, Any]:
    """
    Get the current subscription status for a user.
    """
    init_stripe()
    
    try:
        subscription = Subscription.objects.get(user=user)
        
        # Get latest status from Stripe
        stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
        
        # Update local status if different
        if subscription.status != stripe_sub.status.upper():
            subscription.status = stripe_sub.status.upper()
            subscription.save()
        
        return {
            "status": subscription.status,
            "plan": subscription.plan.name if subscription.plan else None,
            "trial_end": subscription.trial_end,
            "is_trialing": subscription.is_trialing,
            "current_period_end": subscription.current_period_end,
            "canceled_at": subscription.canceled_at
        }
        
    except Subscription.DoesNotExist:
        return {
            "status": "NO_SUBSCRIPTION",
            "plan": None
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error getting subscription status: {e}")
        return {
            "status": "ERROR",
            "error": str(e)
        }


class StripeService:
    """Main Stripe service class containing all Stripe operations."""
    
    def sync_plan_to_stripe(self, plan: Plan) -> Dict[str, str]:
        """Sync a Plan to Stripe as a Product and Price."""
        return sync_plan_to_stripe(plan)
    
    def get_or_create_customer(self, user: User) -> StripeCustomer:
        """Get or create a Stripe customer for a user."""
        return get_or_create_customer(user)
    
    def create_checkout_session(
        self,
        user: User,
        plan: Plan,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None
    ) -> str:
        """Create a Stripe Checkout Session for subscription with trial."""
        return create_checkout_session(user, plan, success_url, cancel_url)
    
    def create_portal_session(self, user: User) -> str:
        """Create a Stripe Customer Portal session."""
        return create_portal_session(user)
    
    def cancel_subscription(self, subscription: Subscription, at_period_end: bool = True) -> Subscription:
        """Cancel a subscription."""
        return cancel_subscription(subscription, at_period_end)
    
    def get_subscription_status(self, user: User) -> Dict[str, Any]:
        """Get the current subscription status for a user."""
        return get_subscription_status(user)


# Create a global service instance
stripe_service = StripeService()