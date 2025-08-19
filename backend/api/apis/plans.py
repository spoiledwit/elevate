from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from ..models import Plan
from ..serializers import PlanSerializer


class PlanViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Public API for listing subscription plans.
    No authentication required - used for pricing page.
    """
    queryset = Plan.objects.filter(is_active=True).order_by('sort_order', 'price')
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="List all active subscription plans",
        description="Returns all active subscription plans with their features for public display on pricing page.",
        responses={200: PlanSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)