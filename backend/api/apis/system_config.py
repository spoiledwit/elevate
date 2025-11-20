from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from ..models import SystemConfig
from ..serializers import SystemConfigSerializer


class SystemConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for fetching and updating system configuration.
    Only one instance exists (singleton pattern).
    """
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current system configuration"""
        config = SystemConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

    def get_queryset(self):
        """Return only the singleton instance"""
        return SystemConfig.objects.all()
