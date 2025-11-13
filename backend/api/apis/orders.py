"""
Orders API endpoints for managing product orders
"""
from decimal import Decimal
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Sum, Case, When, DecimalField, F
from django.utils import timezone
from datetime import timedelta

from ..models import Order, CustomLink
from ..serializers import OrderSerializer


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing orders.
    Users can only see orders from their own products (CustomLinks).
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Get all orders for products owned by the current user.
        Orders are filtered by the user who owns the CustomLink.
        """
        user = self.request.user

        # Get all CustomLinks owned by this user
        user_custom_links = CustomLink.objects.filter(
            user_profile__user=user
        )

        # Filter orders by those CustomLinks
        queryset = Order.objects.filter(
            custom_link__in=user_custom_links
        ).select_related(
            'custom_link',
            'custom_link__user_profile',
            'custom_link__user_profile__user'
        ).order_by('-created_at')

        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by product/custom_link if provided
        product_id = self.request.query_params.get('product_id', None)
        if product_id:
            queryset = queryset.filter(custom_link_id=product_id)

        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get order statistics for the current user's products.
        Returns counts by status, revenue, and recent orders.
        """
        user = request.user

        # Get orders for user's products with optimized query
        orders = Order.objects.filter(
            custom_link__user_profile__user=user
        ).select_related('custom_link')

        # Calculate statistics
        total_orders = orders.count()
        pending_orders = orders.filter(status='pending').count()
        completed_orders = orders.filter(status='completed').count()
        cancelled_orders = orders.filter(status='cancelled').count()

        # Revenue calculation using database aggregation (optimized)
        # Use discounted price if available, otherwise regular price
        revenue_result = orders.filter(status='completed').aggregate(
            total=Sum(
                Case(
                    When(
                        custom_link__checkout_discounted_price__isnull=False,
                        then=F('custom_link__checkout_discounted_price')
                    ),
                    default=F('custom_link__checkout_price'),
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                )
            )
        )
        total_revenue = revenue_result['total'] or Decimal('0.00')

        # Orders by product
        orders_by_product = orders.values(
            'custom_link__id',
            'custom_link__title'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        # Recent orders (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_orders_count = orders.filter(
            created_at__gte=thirty_days_ago
        ).count()

        return Response({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders,
            'total_revenue': float(total_revenue),
            'recent_orders_30d': recent_orders_count,
            'orders_by_product': list(orders_by_product),
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update order status.
        Only the owner of the product can update the order status.
        """
        order = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['pending', 'completed', 'cancelled']:
            return Response(
                {'error': 'Invalid status. Must be one of: pending, completed, cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user owns the product
        if order.custom_link.user_profile.user != request.user:
            return Response(
                {'error': 'You do not have permission to update this order'},
                status=status.HTTP_403_FORBIDDEN
            )

        order.status = new_status
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_email_preference(self, request, pk=None):
        """
        Update email automation preference for a single order.
        Allows affiliates to opt-out specific leads from automated email sequences.
        """
        order = self.get_object()

        # Check if user owns the product
        if order.custom_link.user_profile.user != request.user:
            return Response(
                {'error': 'You do not have permission to update this order'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the enabled flag from request
        enabled = request.data.get('email_automation_enabled')
        if enabled is None:
            return Response(
                {'error': 'email_automation_enabled field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update the preference
        order.email_automation_enabled = bool(enabled)
        order.save(update_fields=['email_automation_enabled', 'updated_at'])

        # Count pending emails (for informational purposes)
        pending_count = (
            order.followup_emails.filter(sent=False).count() +
            order.optin_followup_emails.filter(sent=False).count()
        )

        serializer = self.get_serializer(order)
        return Response({
            **serializer.data,
            'pending_emails': pending_count,
            'message': f'Email automation {"enabled" if enabled else "disabled"}. {pending_count} scheduled emails will {"resume" if enabled else "be paused"}.'
        })

    @action(detail=False, methods=['post'])
    def bulk_update_email_preference(self, request):
        """
        Bulk update email automation preference for multiple orders.
        Allows affiliates to enable/disable automation for multiple leads at once.
        """
        user = request.user
        order_ids = request.data.get('order_ids', [])
        enabled = request.data.get('email_automation_enabled')

        if not order_ids:
            return Response(
                {'error': 'order_ids field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if enabled is None:
            return Response(
                {'error': 'email_automation_enabled field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get orders owned by the user
        orders = Order.objects.filter(
            id__in=order_ids,
            custom_link__user_profile__user=user
        )

        if not orders.exists():
            return Response(
                {'error': 'No valid orders found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update all orders
        updated_count = orders.update(
            email_automation_enabled=bool(enabled),
            updated_at=timezone.now()
        )

        # Count total pending emails across all orders (for informational purposes)
        total_pending = 0
        for order in orders:
            total_pending += (
                order.followup_emails.filter(sent=False).count() +
                order.optin_followup_emails.filter(sent=False).count()
            )

        return Response({
            'success': True,
            'updated_count': updated_count,
            'pending_emails': total_pending,
            'message': f'Email automation {"enabled" if enabled else "disabled"} for {updated_count} order(s). {total_pending} scheduled emails will {"resume" if enabled else "be paused"}.'
        })