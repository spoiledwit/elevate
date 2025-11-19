from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..models import IframeMenuItem
from ..serializers import IframeMenuItemSerializer

@extend_schema(
    tags=['System'],
    summary="List active iframe menu items",
    description="Get a list of all active iframe menu items ordered by their display order, filtered by user permissions.",
    responses={200: IframeMenuItemSerializer(many=True)}
)
class IframeMenuItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing active iframe menu items.
    Returns only the menu items that the current user has permission to access.
    """
    serializer_class = IframeMenuItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter iframe menu items based on user permissions.
        Returns only the items the user has access to.
        """
        user = self.request.user

        # Get user permissions
        if hasattr(user, 'permissions'):
            # Get the menu items the user has access to
            accessible_items = user.permissions.accessible_iframe_menu_items.filter(is_active=True)
            return accessible_items.order_by('order')

        # If no permissions object, return empty queryset
        return IframeMenuItem.objects.none()
