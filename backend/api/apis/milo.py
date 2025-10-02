from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from ..models import MiloPrompt
from ..serializers import MiloPromptSerializer


class MiloPromptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for fetching Milo AI prompts.
    Read-only - prompts are managed through admin panel.
    """
    queryset = MiloPrompt.objects.all()
    serializer_class = MiloPromptSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the most recently updated prompt"""
        prompt = MiloPrompt.objects.order_by('-modified_at').first()
        if prompt:
            serializer = self.get_serializer(prompt)
            return Response(serializer.data)
        return Response({'system_prompt': ''})
