"""
Stripe Connect API endpoints for marketplace functionality
"""
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse
import stripe

from ..models import StripeConnectAccount, PaymentTransaction, CustomLink, ConnectWebhookEvent
from ..serializers import (
    StripeConnectAccountSerializer,
    CreateConnectAccountSerializer,
    AccountLinkSerializer,
    AccountLinkResponseSerializer,
    LoginLinkResponseSerializer,
    ConnectAccountStatusSerializer,
    CreateCheckoutSessionSerializer,
    CheckoutSessionResponseSerializer,
    PaymentTransactionSerializer,
    BalanceSerializer,
    RefundRequestSerializer,
    RefundResponseSerializer,
    ConnectEarningsSerializer,
    ConnectWebhookEventSerializer
)
from ..services.stripe_connect_service import stripe_connect_service
from ..services.webhook_handlers import (
    verify_connect_webhook_signature,
    handle_connect_webhook_event
)

logger = logging.getLogger(__name__)


class StripeConnectAccountView(APIView):
    """
    View for managing Stripe Connect accounts
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Connect account status",
        responses={
            200: StripeConnectAccountSerializer,
            404: OpenApiResponse(description="Connect account not found")
        }
    )
    def get(self, request):
        """Get the user's Stripe Connect account status"""
        try:
            connect_account = request.user.connect_account
            serializer = StripeConnectAccountSerializer(connect_account)
            return Response(serializer.data)
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        summary="Create Connect account",
        request=CreateConnectAccountSerializer,
        responses={
            201: StripeConnectAccountSerializer,
            400: OpenApiResponse(description="Account already exists or validation error")
        }
    )
    def post(self, request):
        """Create a new Stripe Connect account for the user"""
        # Check if user already has a Connect account
        if hasattr(request.user, 'connect_account'):
            return Response(
                {"detail": "Connect account already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreateConnectAccountSerializer(data=request.data)
        if serializer.is_valid():
            try:
                connect_account = stripe_connect_service.create_express_account(
                    user=request.user,
                    email=serializer.validated_data.get('email')
                )
                response_serializer = StripeConnectAccountSerializer(connect_account)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error creating Connect account for user {request.user.id}: {e}")
                return Response(
                    {"detail": "Failed to create Connect account"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnectAccountLinkView(APIView):
    """
    View for creating Connect account links for onboarding
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Create account link for onboarding",
        request=AccountLinkSerializer,
        responses={
            200: AccountLinkResponseSerializer,
            404: OpenApiResponse(description="Connect account not found"),
            400: OpenApiResponse(description="Validation error")
        }
    )
    def post(self, request):
        """Create an account link for Connect onboarding"""
        try:
            connect_account = request.user.connect_account
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found. Please create one first."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AccountLinkSerializer(data=request.data)
        if serializer.is_valid():
            try:
                account_link_url = stripe_connect_service.create_account_link(
                    account_id=connect_account.stripe_account_id,
                    refresh_url=serializer.validated_data['refresh_url'],
                    return_url=serializer.validated_data['return_url'],
                    type=serializer.validated_data.get('type', 'account_onboarding')
                )
                return Response({"url": account_link_url})
            except Exception as e:
                logger.error(f"Error creating account link for {connect_account.stripe_account_id}: {e}")
                return Response(
                    {"detail": "Failed to create account link"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnectLoginLinkView(APIView):
    """
    View for creating login links to Express Dashboard
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Create Express Dashboard login link",
        responses={
            200: LoginLinkResponseSerializer,
            404: OpenApiResponse(description="Connect account not found"),
            400: OpenApiResponse(description="Account not ready for dashboard access")
        }
    )
    def post(self, request):
        """Create a login link to the Express Dashboard"""
        try:
            connect_account = request.user.connect_account
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not connect_account.details_submitted:
            return Response(
                {"detail": "Account setup must be completed before accessing dashboard"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            login_url = stripe_connect_service.create_login_link(connect_account.stripe_account_id)
            return Response({"url": login_url})
        except Exception as e:
            logger.error(f"Error creating login link for {connect_account.stripe_account_id}: {e}")
            return Response(
                {"detail": "Failed to create login link"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConnectAccountStatusView(APIView):
    """
    View for refreshing Connect account status from Stripe
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Refresh account status from Stripe",
        responses={
            200: ConnectAccountStatusSerializer,
            404: OpenApiResponse(description="Connect account not found")
        }
    )
    def get(self, request):
        """Refresh and get the latest account status from Stripe"""
        try:
            connect_account = request.user.connect_account
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            account_status = stripe_connect_service.get_account_status(connect_account.stripe_account_id)
            return Response(account_status)
        except Exception as e:
            logger.error(f"Error getting account status for {connect_account.stripe_account_id}: {e}")
            return Response(
                {"detail": "Failed to get account status"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConnectCheckoutView(APIView):
    """
    View for creating checkout sessions for product purchases
    """
    permission_classes = [AllowAny]  # Public endpoint for customer purchases

    @extend_schema(
        summary="Create checkout session for product purchase",
        request=CreateCheckoutSessionSerializer,
        responses={
            200: CheckoutSessionResponseSerializer,
            404: OpenApiResponse(description="Product not found"),
            400: OpenApiResponse(description="Validation error or seller setup incomplete")
        }
    )
    def post(self, request):
        """Create a Stripe Checkout session for a product purchase"""
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Get the custom link
                custom_link = CustomLink.objects.get(
                    id=serializer.validated_data['custom_link_id'],
                    is_active=True
                )
                
                # Get the seller's Connect account
                connect_account = custom_link.user_profile.user.connect_account
                
                # Create checkout session
                checkout_url, session_id = stripe_connect_service.create_checkout_session_for_product(
                    custom_link=custom_link,
                    connect_account=connect_account,
                    success_url=serializer.validated_data['success_url'],
                    cancel_url=serializer.validated_data['cancel_url'],
                    customer_email=serializer.validated_data.get('customer_email'),
                    metadata=serializer.validated_data.get('metadata', {})
                )
                
                return Response({
                    "checkout_url": checkout_url,
                    "session_id": session_id
                })
                
            except CustomLink.DoesNotExist:
                return Response(
                    {"detail": "Product not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                logger.error(f"Error creating checkout session: {e}")
                return Response(
                    {"detail": "Failed to create checkout session"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnectTransactionsView(APIView):
    """
    View for listing payment transactions for a seller
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List payment transactions",
        responses={
            200: PaymentTransactionSerializer(many=True),
            404: OpenApiResponse(description="Connect account not found")
        }
    )
    def get(self, request):
        """Get payment transactions for the authenticated seller"""
        try:
            connect_account = request.user.connect_account
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        transactions = PaymentTransaction.objects.filter(
            seller_account=connect_account
        ).order_by('-created_at')

        # Add pagination if needed
        page_size = request.GET.get('page_size', 20)
        try:
            page_size = min(int(page_size), 100)  # Max 100 per page
        except (ValueError, TypeError):
            page_size = 20

        transactions = transactions[:page_size]

        serializer = PaymentTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class ConnectBalanceView(APIView):
    """
    View for getting Connect account balance
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get account balance",
        responses={
            200: BalanceSerializer,
            404: OpenApiResponse(description="Connect account not found")
        }
    )
    def get(self, request):
        """Get the Connect account balance"""
        try:
            connect_account = request.user.connect_account
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not connect_account.is_active:
            return Response(
                {"detail": "Account is not active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            balance = stripe_connect_service.get_account_balance(connect_account.stripe_account_id)
            return Response(balance)
        except Exception as e:
            logger.error(f"Error getting balance for {connect_account.stripe_account_id}: {e}")
            return Response(
                {"detail": "Failed to get account balance"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConnectRefundView(APIView):
    """
    View for processing refunds
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Process a refund",
        request=RefundRequestSerializer,
        responses={
            200: RefundResponseSerializer,
            404: OpenApiResponse(description="Transaction not found"),
            400: OpenApiResponse(description="Validation error")
        }
    )
    def post(self, request):
        """Process a refund for a payment"""
        serializer = RefundRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Verify the transaction belongs to the authenticated user
                transaction = PaymentTransaction.objects.get(
                    payment_intent_id=serializer.validated_data['payment_intent_id'],
                    seller_account__user=request.user
                )
                
                # Process the refund
                refund_result = stripe_connect_service.refund_payment(
                    payment_intent_id=serializer.validated_data['payment_intent_id'],
                    amount_cents=serializer.validated_data.get('amount_cents'),
                    reason=serializer.validated_data.get('reason', 'requested_by_customer')
                )
                
                return Response(refund_result)
                
            except PaymentTransaction.DoesNotExist:
                return Response(
                    {"detail": "Transaction not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                logger.error(f"Error processing refund: {e}")
                return Response(
                    {"detail": "Failed to process refund"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnectEarningsView(APIView):
    """
    View for getting earnings summary
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get earnings summary",
        responses={
            200: ConnectEarningsSerializer,
            404: OpenApiResponse(description="Connect account not found")
        }
    )
    def get(self, request):
        """Get earnings summary for the seller"""
        try:
            connect_account = request.user.connect_account
        except StripeConnectAccount.DoesNotExist:
            return Response(
                {"detail": "Connect account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Calculate earnings from transactions
        from django.db.models import Sum, Count
        from decimal import Decimal

        transactions = PaymentTransaction.objects.filter(seller_account=connect_account)
        
        # Aggregate data
        aggregates = transactions.aggregate(
            total_sales_cents=Sum('total_amount'),
            total_platform_fee_cents=Sum('platform_fee'),
            successful_count=Count('id', filter=transactions.filter(status='succeeded').query),
            failed_count=Count('id', filter=transactions.filter(status='failed').query),
            total_count=Count('id')
        )

        # Convert cents to dollars
        total_sales = Decimal(aggregates['total_sales_cents'] or 0) / 100
        total_earnings = Decimal(aggregates['total_platform_fee_cents'] or 0) / 100
        
        # Calculate pending payouts (successful transactions not yet transferred)
        pending_transactions = transactions.filter(status='succeeded', transfer_id='')
        pending_payout_cents = pending_transactions.aggregate(
            pending=Sum('seller_amount')
        )['pending'] or 0
        pending_payouts = Decimal(pending_payout_cents) / 100

        earnings_data = {
            'total_sales': total_sales,
            'total_earnings': total_earnings,
            'pending_payouts': pending_payouts,
            'transaction_count': aggregates['total_count'] or 0,
            'successful_transactions': aggregates['successful_count'] or 0,
            'failed_transactions': aggregates['failed_count'] or 0,
        }

        serializer = ConnectEarningsSerializer(earnings_data)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class ConnectWebhookView(APIView):
    """
    View for handling Stripe Connect webhooks
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Handle incoming Stripe Connect webhook events"""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        if not sig_header:
            logger.warning("Connect webhook received without signature header")
            return HttpResponse(status=400)

        try:
            # Verify webhook signature
            event = verify_connect_webhook_signature(payload.decode('utf-8'), sig_header)
            
            # Process the event
            result = handle_connect_webhook_event(event)
            
            return HttpResponse(status=200)
            
        except ValueError as e:
            logger.error(f"Connect webhook payload error: {e}")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Connect webhook signature verification failed: {e}")
            return HttpResponse(status=400)
        except Exception as e:
            logger.error(f"Connect webhook processing error: {e}")
            return HttpResponse(status=500)


class ConnectWebhookEventsView(APIView):
    """
    View for listing Connect webhook events (for debugging)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Connect webhook events",
        responses={
            200: ConnectWebhookEventSerializer(many=True)
        }
    )
    def get(self, request):
        """Get recent Connect webhook events for debugging"""
        # Only allow access for staff users or users with Connect accounts
        if not (request.user.is_staff or hasattr(request.user, 'connect_account')):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        events = ConnectWebhookEvent.objects.all().order_by('-created_at')[:50]
        
        # Filter to user's events if not staff
        if not request.user.is_staff:
            events = events.filter(connect_account__user=request.user)

        serializer = ConnectWebhookEventSerializer(events, many=True)
        return Response(serializer.data)


# Helper API views for frontend integration

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connect_onboarding_status(request):
    """
    Simple endpoint to check if user needs to complete onboarding
    """
    try:
        connect_account = request.user.connect_account
        return Response({
            'has_connect_account': True,
            'is_active': connect_account.is_active,
            'charges_enabled': connect_account.charges_enabled,
            'payouts_enabled': connect_account.payouts_enabled,
            'details_submitted': connect_account.details_submitted,
            'status': connect_account.get_status(),
            'requirements_due': connect_account.requirements_due,
            'requirements_errors': connect_account.requirements_errors,
        })
    except StripeConnectAccount.DoesNotExist:
        return Response({
            'has_connect_account': False,
            'is_active': False,
            'charges_enabled': False,
            'payouts_enabled': False,
            'details_submitted': False,
            'status': 'Not Created',
            'requirements_due': None,
            'requirements_errors': None,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connect_dashboard_info(request):
    """
    Get dashboard information for Connect account
    """
    try:
        connect_account = request.user.connect_account
        
        # Get recent transactions
        recent_transactions = PaymentTransaction.objects.filter(
            seller_account=connect_account
        ).order_by('-created_at')[:5]
        
        transaction_serializer = PaymentTransactionSerializer(recent_transactions, many=True)
        
        return Response({
            'account': StripeConnectAccountSerializer(connect_account).data,
            'recent_transactions': transaction_serializer.data,
        })
        
    except StripeConnectAccount.DoesNotExist:
        return Response(
            {"detail": "Connect account not found"},
            status=status.HTTP_404_NOT_FOUND
        )