from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..models import IframeMenuItem
from ..serializers import IframeMenuItemSerializer

@extend_schema(
    tags=['System'],
    summary="List active iframe menu items",
    description="Get a list of all active iframe menu items ordered by their display order.",
    responses={200: IframeMenuItemSerializer(many=True)}
)
class IframeMenuItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing active iframe menu items.
    """
    queryset = IframeMenuItem.objects.filter(is_active=True).order_by('order')
    serializer_class = IframeMenuItemSerializer
    permission_classes = [IsAuthenticated]
