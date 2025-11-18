"""
Credit system API endpoints for Milo AI calls
"""
import logging
from decimal import Decimal

import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import UserProfile, CreditTransaction, MiloCallLog, StripeCustomer
from ..serializers import (
    CreditPurchaseSerializer,
    CreditPurchaseResponseSerializer,
    CreditBalanceSerializer,
    CreditTransactionSerializer,
    MiloCallLogSerializer,
    DeductMiloCreditsSerializer,
    DeductMiloCreditsResponseSerializer,
    EndMiloCallSerializer,
    EndMiloCallResponseSerializer,
)

logger = logging.getLogger(__name__)

# Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY


class CreditBalanceView(APIView):
    """
    Get current user's credit balance and statistics.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: CreditBalanceSerializer,
            404: {"description": "User profile not found"},
        },
        description="Get current user's Milo credit balance and usage statistics"
    )
    def get(self, request):
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            serializer = CreditBalanceSerializer({
                'milo_credits': user_profile.milo_credits,
                'total_credits_purchased': user_profile.total_credits_purchased,
                'total_credits_used': user_profile.total_credits_used,
            })
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({
                'milo_credits': 0.00,
                'total_credits_purchased': 0.00,
                'total_credits_used': 0.00,
            })


class CreditTransactionListView(APIView):
    """
    Get user's credit transaction history.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: CreditTransactionSerializer(many=True),
        },
        description="Get current user's credit transaction history"
    )
    def get(self, request):
        transactions = CreditTransaction.objects.filter(
            user=request.user
        ).select_related('payment_transaction', 'milo_call_log').order_by('-created_at')

        serializer = CreditTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class MiloCallLogListView(APIView):
    """
    Get user's Milo call logs.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: MiloCallLogSerializer(many=True),
        },
        description="Get current user's Milo AI call history"
    )
    def get(self, request):
        call_logs = MiloCallLog.objects.filter(
            user=request.user
        ).order_by('-created_at')

        serializer = MiloCallLogSerializer(call_logs, many=True)
        return Response(serializer.data)


class PurchaseCreditsView(APIView):
    """
    Create a Stripe Checkout Session for purchasing Milo credits.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CreditPurchaseSerializer,
        responses={
            200: CreditPurchaseResponseSerializer,
            400: {"description": "Bad request"},
        },
        description="Create a Stripe checkout session for purchasing Milo credits. Price is $1.00 per credit."
    )
    def post(self, request):
        serializer = CreditPurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        success_url = serializer.validated_data.get("success_url")
        cancel_url = serializer.validated_data.get("cancel_url")

        try:
            # Calculate price (1.00 USD per credit)
            price_per_credit = Decimal('1.00')
            total_price = amount * price_per_credit
            # Convert to cents for Stripe
            amount_cents = int(total_price * 100)

            # Get or create Stripe customer
            stripe_customer = None
            customer_id = None

            try:
                stripe_customer = StripeCustomer.objects.get(user=request.user)
                customer_id = stripe_customer.stripe_customer_id

                # Verify the customer still exists in Stripe
                try:
                    stripe.Customer.retrieve(customer_id)
                except stripe.error.StripeError:
                    # Customer doesn't exist in Stripe, create a new one
                    logger.warning(f"Stripe customer {customer_id} not found in Stripe for user {request.user.username}, creating new customer")
                    customer = stripe.Customer.create(
                        email=request.user.email,
                        metadata={
                            "user_id": request.user.id,
                            "username": request.user.username
                        }
                    )
                    customer_id = customer.id
                    # Update the database record with new customer ID
                    stripe_customer.stripe_customer_id = customer_id
                    stripe_customer.save()

            except StripeCustomer.DoesNotExist:
                # Create new Stripe customer
                customer = stripe.Customer.create(
                    email=request.user.email,
                    metadata={
                        "user_id": request.user.id,
                        "username": request.user.username
                    }
                )
                customer_id = customer.id
                # Save to database
                StripeCustomer.objects.create(
                    user=request.user,
                    stripe_customer_id=customer_id
                )

            # Create Stripe checkout session for credit purchase
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'{float(amount)} Milo AI Credits',
                            'description': f'Purchase {float(amount)} credits for Milo AI voice calls (0.5 credits per minute)',
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url or f'{settings.FRONTEND_URL}/dashboard',
                cancel_url=cancel_url or f'{settings.FRONTEND_URL}/dashboard',
                metadata={
                    'user_id': request.user.id,
                    'username': request.user.username,
                    'type': 'credit_purchase',  # Important: identifies this as credit purchase
                    'credit_amount': str(amount),
                }
            )

            logger.info(f"Created credit purchase checkout session {checkout_session.id} for user {request.user.username}")

            return Response(
                {"checkout_url": checkout_session.url},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Error creating credit purchase checkout session: {e}")
            return Response(
                {"error": "Failed to create checkout session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeductMiloCreditsView(APIView):
    """
    Deduct credits for Milo AI voice call usage.
    Deducts 0.5 credits per minute with fraud prevention.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=DeductMiloCreditsSerializer,
        responses={
            200: DeductMiloCreditsResponseSerializer,
            400: {"description": "Bad request - insufficient credits or invalid request"},
        },
        description="Deduct credits for Milo AI voice calls. Rate: 0.5 credits per minute. Only charges for new minutes not already charged."
    )
    def post(self, request):
        serializer = DeductMiloCreditsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conversation_id = serializer.validated_data['conversation_id']
        minutes_elapsed = serializer.validated_data['minutes_elapsed']

        try:
            with transaction.atomic():
                # Get user profile with lock to prevent race conditions
                user_profile = UserProfile.objects.select_for_update().get(user=request.user)

                # Get or create call log
                call_log, created = MiloCallLog.objects.get_or_create(
                    user=request.user,
                    conversation_id=conversation_id,
                    ended_at__isnull=True,  # Only active calls
                    defaults={
                        'started_at': timezone.now(),
                    }
                )

                # Calculate credits for this minute
                credits_per_minute = Decimal('0.5')

                # Calculate how many minutes we've already charged for
                already_charged_minutes = int(Decimal(str(call_log.credits_used)) / credits_per_minute)

                # Only charge for new minutes
                new_minutes = minutes_elapsed - already_charged_minutes

                if new_minutes <= 0:
                    return Response(
                        {
                            "success": False,
                            "credits_deducted": 0.0,
                            "remaining_balance": float(user_profile.milo_credits),
                            "message": "Already charged for this minute"
                        },
                        status=status.HTTP_200_OK
                    )

                # Calculate credits to deduct
                credits_to_deduct = credits_per_minute * new_minutes

                # Check if user has enough credits
                if user_profile.milo_credits < credits_to_deduct:
                    return Response(
                        {
                            "error": "Insufficient credits",
                            "required": float(credits_to_deduct),
                            "available": float(user_profile.milo_credits)
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Deduct credits from user profile
                user_profile.milo_credits -= credits_to_deduct
                user_profile.total_credits_used += credits_to_deduct
                user_profile.save()

                # Update call log
                call_log.call_duration_seconds = minutes_elapsed * 60
                call_log.credits_used = float(call_log.credits_used) + float(credits_to_deduct)
                call_log.save()

                # Note: We don't create CreditTransaction here because milo_call_log is a OneToOneField
                # Transaction will be created when the call ends via EndMiloCallView

                logger.info(f"Deducted {credits_to_deduct} credits from user {request.user.username} for {new_minutes} minute(s)")

                return Response(
                    {
                        "success": True,
                        "credits_deducted": float(credits_to_deduct),
                        "remaining_balance": float(user_profile.milo_credits),
                        "message": f"Deducted {credits_to_deduct} credits for {new_minutes} minute(s)"
                    },
                    status=status.HTTP_200_OK
                )

        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deducting Milo credits: {e}")
            return Response(
                {"error": "Failed to deduct credits"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EndMiloCallView(APIView):
    """
    End a Milo AI voice call session.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=EndMiloCallSerializer,
        responses={
            200: EndMiloCallResponseSerializer,
            404: {"description": "Call log not found"}
        },
        description="End a Milo AI voice call session and finalize the call log."
    )
    def post(self, request):
        serializer = EndMiloCallSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conversation_id = serializer.validated_data['conversation_id']

        try:
            # Find the active call log
            call_log = MiloCallLog.objects.get(
                user=request.user,
                conversation_id=conversation_id,
                ended_at__isnull=True
            )

            # Mark call as ended
            call_log.ended_at = timezone.now()
            call_log.save()

            # Create a single transaction record for the entire call
            if call_log.credits_used > 0:
                user_profile = UserProfile.objects.get(user=request.user)
                CreditTransaction.objects.create(
                    user=request.user,
                    transaction_type='usage',
                    amount=-Decimal(str(call_log.credits_used)),
                    balance_after=user_profile.milo_credits,
                    description=f"Milo AI voice call - {call_log.call_duration_seconds}s total duration",
                    milo_call_log=call_log
                )

            logger.info(f"Ended Milo call for user {request.user.username}: {call_log.call_duration_seconds}s, {call_log.credits_used} credits")

            return Response(
                {
                    "success": True,
                    "total_duration_seconds": call_log.call_duration_seconds,
                    "total_credits_used": float(call_log.credits_used)
                },
                status=status.HTTP_200_OK
            )

        except MiloCallLog.DoesNotExist:
            return Response(
                {"error": "Active call log not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error ending Milo call: {e}")
            return Response(
                {"error": "Failed to end call"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )