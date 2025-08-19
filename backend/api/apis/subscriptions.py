"""
Subscription management views for Stripe integration
"""
import logging

from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Plan, Subscription
from ..serializers import (
    CheckoutSessionSerializer,
    CheckoutSessionResponseSerializer,
    PortalSessionResponseSerializer,
    SubscriptionSerializer,
)
from ..services import stripe_service
from ..services.webhook_handlers import verify_webhook_signature, handle_webhook_event

logger = logging.getLogger(__name__)


class CreateCheckoutSessionView(APIView):
    """
    Create a Stripe Checkout Session for subscription with trial.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=CheckoutSessionSerializer,
        responses={
            200: CheckoutSessionResponseSerializer,
            400: {"description": "Bad request"},
            404: {"description": "Plan not found"},
        },
        description="Create a Stripe checkout session for subscription with free trial"
    )
    def post(self, request):
        serializer = CheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan_id = serializer.validated_data["plan_id"]
        success_url = serializer.validated_data.get("success_url")
        cancel_url = serializer.validated_data.get("cancel_url")
        
        # Get plan
        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response(
                {"error": "Plan not found or inactive"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already has an active subscription
        try:
            existing_sub = Subscription.objects.get(user=request.user)
            if existing_sub.status in ["ACTIVE", "TRIALING", "PAST_DUE"]:
                return Response(
                    {"error": f"User already has an active subscription ({existing_sub.status}). Please cancel the current subscription before creating a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Subscription.DoesNotExist:
            # No existing subscription, proceed
            pass
        
        # Since we're not using trials anymore, skip this check
        # if plan.trial_period_days > 0 and request.user.trial_used:
        #     return Response(
        #         {"error": f"Your account has already used its free trial. Please select a plan without trial or contact support."},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
        
        try:
            # Create checkout session
            checkout_url = stripe_service.create_checkout_session(
                user=request.user,
                plan=plan,
                success_url=success_url,
                cancel_url=cancel_url
            )
            
            return Response(
                {"checkout_url": checkout_url},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            return Response(
                {"error": "Failed to create checkout session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreatePortalSessionView(APIView):
    """
    Create a Stripe Customer Portal session for billing management.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: PortalSessionResponseSerializer,
            400: {"description": "No Stripe customer found"},
        },
        description="Create a Stripe Customer Portal session for self-service billing management"
    )
    def post(self, request):
        try:
            # Create portal session
            portal_url = stripe_service.create_portal_session(
                user=request.user
            )
            
            return Response(
                {"portal_url": portal_url},
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating portal session: {e}")
            return Response(
                {"error": "Failed to create portal session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """
    Handle Stripe webhook events.
    """
    permission_classes = []  # No authentication for webhooks
    authentication_classes = []  # No authentication for webhooks
    
    @extend_schema(
        request=None,
        responses={
            200: {"description": "Webhook processed successfully"},
            400: {"description": "Invalid webhook"},
        },
        description="Stripe webhook endpoint for payment events"
    )
    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
        
        if not sig_header:
            return HttpResponse("No signature header", status=400)
        
        try:
            # Verify and construct event
            event = verify_webhook_signature(payload.decode("utf-8"), sig_header)
            
            # Handle the event
            handle_webhook_event(event)
            
            return HttpResponse(status=200)
            
        except ValueError:
            # Invalid payload
            return HttpResponse("Invalid payload", status=400)
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return HttpResponse(f"Webhook error: {e}", status=400)


class CurrentSubscriptionView(APIView):
    """
    Get current subscription status for the authenticated user's company.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: SubscriptionSerializer,
            404: {"description": "No subscription found"},
        },
        description="Get current subscription status including trial information"
    )
    def get(self, request):
        try:
            # Get user's subscription
            subscription = Subscription.objects.get(user=request.user)
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Subscription.DoesNotExist:
            return Response(
                {"message": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )


class CancelSubscriptionView(APIView):
    """
    Cancel the current subscription at period end.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: {"description": "Subscription scheduled for cancellation"},
            404: {"description": "No subscription found"},
        },
        description="Cancel subscription at the end of the current billing period"
    )
    def post(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
            
            # Check if already canceled
            if subscription.status == "CANCELED":
                return Response(
                    {"message": "Subscription is already canceled"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cancel subscription in Stripe
            canceled_sub = stripe_service.cancel_subscription(subscription, at_period_end=True)
            
            return Response(
                {
                    "message": "Subscription scheduled for cancellation at period end",
                    "canceled_at": canceled_sub.canceled_at,
                    "ends_at": canceled_sub.current_period_end
                },
                status=status.HTTP_200_OK
            )
            
        except Subscription.DoesNotExist:
            return Response(
                {"error": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            return Response(
                {"error": "Failed to cancel subscription"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )