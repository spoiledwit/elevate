"""
Stripe Connect Service for handling all Connect-related operations
"""
import logging
import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, Tuple

import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from ..models import (
    User, UserProfile, CustomLink, Order, 
    StripeConnectAccount, PaymentTransaction, ConnectWebhookEvent
)

logger = logging.getLogger(__name__)


def init_stripe():
    """Initialize Stripe with API key"""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


class StripeConnectService:
    """Service class for handling Stripe Connect operations"""

    def create_express_account(self, user: User, email: Optional[str] = None, country: Optional[str] = None) -> StripeConnectAccount:
        """
        Create a new Stripe Express account for a user.

        Args:
            user: The user creating the Connect account
            email: Email for the Connect account (defaults to user's email)
            country: ISO 3166-1 alpha-2 country code (e.g., 'US', 'CA', 'GB')
                    Defaults to 'US' if not provided
        """
        init_stripe()

        try:
            # Use provided country or default to US
            account_country = country or 'US'

            # Create Stripe Express account
            account = stripe.Account.create(
                type='express',
                country=account_country,
                email=email or user.email,
                capabilities={
                    'card_payments': {'requested': True},
                    'transfers': {'requested': True},
                },
                business_type='individual',  # Default to individual, can be updated later
                metadata={
                    'user_id': str(user.id),
                    'username': user.username,
                    'platform': 'elevate_social'
                }
            )

            # Save to database
            connect_account = StripeConnectAccount.objects.create(
                user=user,
                stripe_account_id=account.id,
                email=email or user.email or '',
                country=account.country or 'US',
                default_currency=account.default_currency or 'usd',
                charges_enabled=account.charges_enabled,
                payouts_enabled=account.payouts_enabled,
                details_submitted=account.details_submitted,
                platform_fee_percentage=Decimal('4.00')  # Default 4% platform fee
            )

            logger.info(f"Created Stripe Connect account {account.id} for user {user.id}")
            return connect_account

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating Connect account for user {user.id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating Connect account for user {user.id}: {e}")
            raise

    def create_account_link(
        self, 
        account_id: str, 
        refresh_url: str, 
        return_url: str,
        type: str = "account_onboarding"
    ) -> str:
        """
        Create an account link for onboarding or account updates.
        Returns the account link URL.
        """
        init_stripe()

        try:
            account_link = stripe.AccountLink.create(
                account=account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type=type,
            )

            logger.info(f"Created account link for account {account_id}")
            return account_link.url

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating account link for {account_id}: {e}")
            raise

    def get_account_status(self, account_id: str) -> Dict[str, Any]:
        """
        Get the current status of a Stripe Connect account.
        """
        init_stripe()

        try:
            account = stripe.Account.retrieve(account_id)
            
            # Update local record
            try:
                connect_account = StripeConnectAccount.objects.get(stripe_account_id=account_id)
                connect_account.charges_enabled = account.charges_enabled
                connect_account.payouts_enabled = account.payouts_enabled
                connect_account.details_submitted = account.details_submitted
                connect_account.country = account.country
                connect_account.default_currency = account.default_currency
                
                # Update requirements
                if hasattr(account, 'requirements'):
                    connect_account.requirements_due = {
                        'currently_due': account.requirements.currently_due,
                        'eventually_due': account.requirements.eventually_due,
                        'past_due': account.requirements.past_due,
                        'pending_verification': account.requirements.pending_verification,
                    } if account.requirements else None
                    
                    connect_account.requirements_errors = account.requirements.errors if account.requirements else None

                # Mark onboarding as completed if account is fully active
                if account.charges_enabled and account.payouts_enabled and not connect_account.onboarding_completed_at:
                    connect_account.onboarding_completed_at = timezone.now()

                connect_account.save()

            except StripeConnectAccount.DoesNotExist:
                logger.warning(f"Connect account {account_id} not found in database")

            return {
                'account_id': account.id,
                'charges_enabled': account.charges_enabled,
                'payouts_enabled': account.payouts_enabled,
                'details_submitted': account.details_submitted,
                'country': account.country,
                'default_currency': account.default_currency,
                'business_profile': account.business_profile,
                'requirements': account.requirements,
                'is_active': account.charges_enabled and account.payouts_enabled
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting account status for {account_id}: {e}")
            raise

    def create_login_link(self, account_id: str) -> str:
        """
        Create a login link to the Express Dashboard.
        """
        init_stripe()

        try:
            login_link = stripe.Account.create_login_link(account_id)
            logger.info(f"Created login link for account {account_id}")
            return login_link.url

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating login link for {account_id}: {e}")
            raise

    def create_checkout_session_for_product(
        self,
        custom_link: CustomLink,
        connect_account: StripeConnectAccount,
        success_url: str,
        cancel_url: str,
        order_id: str,  # Pass the existing order ID instead of creating one
        customer_email: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Tuple[str, str]:  # Returns (checkout_url, session_id)
        """
        Create a Stripe Checkout Session for a product purchase with Connect.
        Uses destination charges to automatically transfer funds to the seller.
        """
        init_stripe()

        # Validate that the seller can receive payments
        if not connect_account.charges_enabled:
            raise ValueError("Seller's payment account is not ready to accept charges")

        # Get price in cents
        if not custom_link.checkout_price:
            raise ValueError("Product must have a price set")

        price_cents = int(custom_link.checkout_price * 100)

        # Calculate platform fee
        platform_fee_cents = connect_account.calculate_platform_fee(price_cents)
        seller_amount_cents = price_cents - platform_fee_cents

        try:
            session_metadata = {
                'order_id': order_id,  # Use the passed order ID
                'user_id': str(custom_link.user_profile.user.id),
                'custom_link_id': str(custom_link.id),
                'connect_account_id': connect_account.stripe_account_id,
                'platform_fee': str(platform_fee_cents),
                'seller_amount': str(seller_amount_cents),
                **(metadata or {})
            }

            # Create checkout session with destination charges
            session = stripe.checkout.Session.create(
                payment_method_types=[
                    'card',
                    'affirm',           # US & Canada: Pay in installments
                    'klarna',           # Multiple regions: Flexible installments
                    'afterpay_clearpay' # US, Canada, UK, AU, NZ: 4 installments
                ],
                line_items=[{
                    'price_data': {
                        'currency': connect_account.default_currency,
                        'product_data': {
                            'name': custom_link.title or custom_link.checkout_title or 'Digital Product',
                            'description': custom_link.subtitle or '',
                            'images': [custom_link.checkout_image.url] if custom_link.checkout_image else [],
                        },
                        'unit_amount': price_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                payment_intent_data={
                    'application_fee_amount': platform_fee_cents,
                    'transfer_data': {
                        'destination': connect_account.stripe_account_id,
                    },
                    'metadata': session_metadata,
                },
                metadata=session_metadata,
            )

            # Get the existing order and create payment transaction record
            order = Order.objects.get(order_id=order_id)
            PaymentTransaction.objects.create(
                order=order,
                seller_account=connect_account,
                stripe_checkout_session_id=session.id,
                payment_intent_id=session.payment_intent,
                total_amount=price_cents,
                platform_fee=platform_fee_cents,
                seller_amount=seller_amount_cents,
                currency=connect_account.default_currency,
                customer_email=customer_email or '',
                status='pending',
                metadata=session_metadata
            )

            logger.info(f"Created checkout session {session.id} for order {order.id}")
            return session.url, session.id

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            raise

    def create_embedded_checkout_session_for_product(
        self,
        custom_link: CustomLink,
        connect_account: StripeConnectAccount,
        order_id: str,
        return_url: Optional[str] = None,
        customer_email: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Tuple[str, str]:  # Returns (client_secret, session_id)
        """
        Create a Stripe Embedded Checkout Session for a product purchase with Connect.
        Uses destination charges to automatically transfer funds to the seller.
        This version uses ui_mode='embedded' for inline checkout rendering.
        """
        init_stripe()

        # Validate that the seller can receive payments
        if not connect_account.charges_enabled:
            raise ValueError("Seller's payment account is not ready to accept charges")

        # Get price in cents
        if not custom_link.checkout_price:
            raise ValueError("Product must have a price set")

        price_cents = int(custom_link.checkout_price * 100)

        # Calculate platform fee
        platform_fee_cents = connect_account.calculate_platform_fee(price_cents)
        seller_amount_cents = price_cents - platform_fee_cents

        try:
            session_metadata = {
                'order_id': order_id,
                'user_id': str(custom_link.user_profile.user.id),
                'custom_link_id': str(custom_link.id),
                'connect_account_id': connect_account.stripe_account_id,
                'platform_fee': str(platform_fee_cents),
                'seller_amount': str(seller_amount_cents),
                **(metadata or {})
            }

            # Create embedded checkout session with destination charges
            # Build session params
            session_params = {
                'ui_mode': 'embedded',  # KEY DIFFERENCE: This enables embedded checkout
                'redirect_on_completion': 'never',  # Required for embedded mode without return_url
                'payment_method_types': [
                    'card',
                    'affirm',           # US & Canada: Pay in installments
                    'klarna',           # Multiple regions: Flexible installments
                    'afterpay_clearpay' # US, Canada, UK, AU, NZ: 4 installments
                ],
                'line_items': [{
                    'price_data': {
                        'currency': connect_account.default_currency,
                        'product_data': {
                            'name': custom_link.title or custom_link.checkout_title or 'Digital Product',
                            'description': custom_link.subtitle or '',
                            'images': [custom_link.checkout_image.url] if custom_link.checkout_image else [],
                        },
                        'unit_amount': price_cents,
                    },
                    'quantity': 1,
                }],
                'mode': 'payment',
                'payment_intent_data': {
                    'application_fee_amount': platform_fee_cents,
                    'transfer_data': {
                        'destination': connect_account.stripe_account_id,
                    },
                    'metadata': session_metadata,
                },
                'metadata': session_metadata,
            }

            # Add return_url if provided (optional when redirect_on_completion is 'never')
            if return_url:
                session_params['return_url'] = return_url
                session_params['redirect_on_completion'] = 'always'  # Use redirect if return_url is provided

            # Add customer email if provided
            if customer_email:
                session_params['customer_email'] = customer_email

            session = stripe.checkout.Session.create(**session_params)

            # Get the existing order and create payment transaction record
            order = Order.objects.get(order_id=order_id)
            PaymentTransaction.objects.create(
                order=order,
                seller_account=connect_account,
                stripe_checkout_session_id=session.id,
                payment_intent_id=session.payment_intent,
                total_amount=price_cents,
                platform_fee=platform_fee_cents,
                seller_amount=seller_amount_cents,
                currency=connect_account.default_currency,
                customer_email=customer_email or '',
                status='pending',
                metadata=session_metadata
            )

            logger.info(f"Created embedded checkout session {session.id} for order {order.id}")
            return session.client_secret, session.id

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating embedded checkout session: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating embedded checkout session: {e}")
            raise

    def create_payment_intent_for_product(
        self,
        custom_link: 'CustomLink',
        connect_account: StripeConnectAccount,
        order_id: str,
        customer_email: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        """
        Create a Stripe PaymentIntent for a product purchase with Connect.
        This is used for inline payment element instead of embedded checkout.
        Returns (client_secret, payment_intent_id)
        """
        init_stripe()

        # Validate that the seller can receive payments
        if not connect_account.charges_enabled:
            raise ValueError("Seller's payment account is not ready to accept charges")

        # Get price in cents - use discounted price if available
        if not custom_link.checkout_price:
            raise ValueError("Product must have a price set")

        # Use discounted price if available and less than regular price
        effective_price = custom_link.checkout_price
        if (custom_link.checkout_discounted_price and
            custom_link.checkout_discounted_price > 0 and
            custom_link.checkout_discounted_price < custom_link.checkout_price):
            effective_price = custom_link.checkout_discounted_price

        price_cents = int(effective_price * 100)

        # Calculate platform fee
        platform_fee_cents = connect_account.calculate_platform_fee(price_cents)
        seller_amount_cents = price_cents - platform_fee_cents

        try:
            payment_metadata = {
                'order_id': order_id,
                'user_id': str(custom_link.user_profile.user.id),
                'custom_link_id': str(custom_link.id),
                'connect_account_id': connect_account.stripe_account_id,
                'platform_fee': str(platform_fee_cents),
                'seller_amount': str(seller_amount_cents),
                **(metadata or {})
            }

            # Create PaymentIntent with destination charges
            # Enable automatic payment methods to support card, wallets, BNPL, etc.
            payment_intent = stripe.PaymentIntent.create(
                amount=price_cents,
                currency=connect_account.default_currency,
                automatic_payment_methods={
                    'enabled': True,
                    'allow_redirects': 'always'
                },
                application_fee_amount=platform_fee_cents,
                transfer_data={
                    'destination': connect_account.stripe_account_id,
                },
                metadata=payment_metadata,
                receipt_email=customer_email,
            )

            # Get the existing order and create payment transaction record
            order = Order.objects.get(order_id=order_id)
            PaymentTransaction.objects.create(
                order=order,
                seller_account=connect_account,
                payment_intent_id=payment_intent.id,
                total_amount=price_cents,
                platform_fee=platform_fee_cents,
                seller_amount=seller_amount_cents,
                currency=connect_account.default_currency,
                customer_email=customer_email or '',
                status='pending',
                metadata=payment_metadata
            )

            logger.info(f"Created PaymentIntent {payment_intent.id} for order {order.id}")
            return payment_intent.client_secret, payment_intent.id

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            raise

    def handle_successful_payment(self, payment_intent_id: str) -> Optional[PaymentTransaction]:
        """
        Handle a successful payment by updating the transaction and order status.
        """
        init_stripe()

        try:
            # Get payment intent from Stripe
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Find our transaction record
            try:
                transaction = PaymentTransaction.objects.get(payment_intent_id=payment_intent_id)
            except PaymentTransaction.DoesNotExist:
                logger.error(f"PaymentTransaction not found for payment_intent {payment_intent_id}")
                return None

            # Update transaction status
            from django.db import transaction as db_transaction
            with db_transaction.atomic():
                transaction.status = 'succeeded'
                transaction.charge_id = payment_intent.latest_charge
                transaction.paid_at = timezone.now()

                # Update metadata with any additional info from payment intent
                if payment_intent.metadata:
                    transaction.metadata.update(payment_intent.metadata)

                transaction.save()

                # Update order status
                transaction.order.status = 'completed'
                transaction.order.save()

                # Increment click count for the custom link
                transaction.order.custom_link.click_count += 1
                transaction.order.custom_link.save(update_fields=['click_count'])

                logger.info(f"Successfully processed payment for transaction {transaction.id}")

            return transaction

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error handling successful payment {payment_intent_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error handling successful payment {payment_intent_id}: {e}")
            raise

    def handle_transfer_created(self, transfer_id: str) -> Optional[PaymentTransaction]:
        """
        Handle when a transfer is created to a connected account.
        """
        init_stripe()

        try:
            # Get transfer from Stripe
            transfer = stripe.Transfer.retrieve(transfer_id)
            
            # Find transaction by destination account and amount
            try:
                transaction = PaymentTransaction.objects.get(
                    seller_account__stripe_account_id=transfer.destination,
                    seller_amount=transfer.amount,
                    transfer_id=''  # Not yet recorded
                )
            except PaymentTransaction.DoesNotExist:
                logger.error(f"PaymentTransaction not found for transfer {transfer_id}")
                return None

            # Update transaction with transfer info
            transaction.transfer_id = transfer_id
            transaction.transfer_status = 'created'
            transaction.transferred_at = timezone.now()
            transaction.save()

            logger.info(f"Recorded transfer {transfer_id} for transaction {transaction.id}")
            return transaction

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error handling transfer {transfer_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error handling transfer {transfer_id}: {e}")
            raise

    def get_account_balance(self, account_id: str) -> Dict[str, Any]:
        """
        Get the balance for a connected account.
        """
        init_stripe()

        try:
            balance = stripe.Balance.retrieve(stripe_account=account_id)
            
            return {
                'available': balance.available,
                'pending': balance.pending,
                'connect_reserved': getattr(balance, 'connect_reserved', []),
                'livemode': balance.livemode
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting balance for account {account_id}: {e}")
            raise

    def refund_payment(
        self, 
        payment_intent_id: str, 
        amount_cents: Optional[int] = None,
        reason: str = 'requested_by_customer'
    ) -> Dict[str, Any]:
        """
        Process a refund for a payment. Handles both full and partial refunds.
        """
        init_stripe()

        try:
            # Get the transaction
            transaction = PaymentTransaction.objects.get(payment_intent_id=payment_intent_id)
            
            # Get the original charge
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if not payment_intent.latest_charge:
                raise ValueError("No charge found for this payment intent")

            # Determine refund amount
            refund_amount = amount_cents or transaction.total_amount
            
            # Create the refund
            refund = stripe.Refund.create(
                charge=payment_intent.latest_charge,
                amount=refund_amount,
                reason=reason,
                refund_application_fee=True,  # Also refund the application fee
                reverse_transfer=True,  # Reverse the transfer to connected account
            )

            # Update transaction record
            with transaction.atomic():
                transaction.refunded_amount += refund_amount
                
                # Calculate refunded platform fee
                refund_ratio = refund_amount / transaction.total_amount
                platform_fee_refunded = int(transaction.platform_fee * refund_ratio)
                transaction.platform_fee_refunded += platform_fee_refunded

                # Update status
                if transaction.refunded_amount >= transaction.total_amount:
                    transaction.status = 'refunded'
                else:
                    transaction.status = 'partially_refunded'

                transaction.save()

                # Update order status
                if transaction.status == 'refunded':
                    transaction.order.status = 'cancelled'
                    transaction.order.save()

            logger.info(f"Processed refund {refund.id} for transaction {transaction.id}")
            
            return {
                'refund_id': refund.id,
                'amount_refunded': refund_amount,
                'status': refund.status,
                'transaction_status': transaction.status
            }

        except PaymentTransaction.DoesNotExist:
            logger.error(f"PaymentTransaction not found for payment_intent {payment_intent_id}")
            raise
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error processing refund for {payment_intent_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error processing refund for {payment_intent_id}: {e}")
            raise


# Create a global service instance
stripe_connect_service = StripeConnectService()