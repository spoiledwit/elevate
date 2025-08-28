"""
Facebook/Instagram Direct Message Management API endpoints
"""
import logging
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes

from ..models import SocialMediaConnection, DirectMessage, AutomationRule, AutomationSettings, DirectMessageReply
from ..serializers import (
    DirectMessageSerializer, DirectMessageListSerializer,
    AutomationRuleSerializer, AutomationRuleCreateSerializer,
    AutomationSettingsSerializer, AutomationSettingsCreateSerializer,
    DirectMessageReplySerializer, DirectMessageReplyListSerializer
)
from ..services.integrations.meta_service import MetaService

logger = logging.getLogger(__name__)


# =============================================================================
# DIRECT MESSAGE API ENDPOINTS
# =============================================================================

class DirectMessageListView(generics.ListAPIView):
    """
    List direct messages for authenticated user's Facebook/Instagram connections.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectMessageListSerializer
    
    def get_queryset(self):
        """Return DMs for user's connections"""
        user = self.request.user
        queryset = DirectMessage.objects.filter(
            connection__user=user,
            connection__is_active=True
        ).select_related('connection').order_by('-created_time')
        
        # Filter by connection/page if provided
        connection_id = self.request.query_params.get('connection_id')
        if connection_id:
            queryset = queryset.filter(connection_id=connection_id)
        
        # Filter by platform if provided
        platform = self.request.query_params.get('platform')
        if platform in ['facebook', 'instagram']:
            queryset = queryset.filter(platform=platform)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class DirectMessageDetailView(generics.RetrieveAPIView):
    """
    Get details of a specific direct message.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectMessageSerializer
    
    def get_queryset(self):
        """Return DMs for user's connections"""
        return DirectMessage.objects.filter(
            connection__user=self.request.user
        ).select_related('connection')


@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'message_id': {'type': 'string', 'description': 'Platform message ID to reply to'},
                'message': {'type': 'string', 'description': 'Reply message text'},
                'connection_id': {'type': 'integer', 'description': 'Connection ID'}
            },
            'required': ['message_id', 'message', 'connection_id']
        }
    },
    responses={
        200: {
            'type': 'object',
            'properties': {
                'success': {'type': 'boolean'},
                'message': {'type': 'string'},
                'reply_id': {'type': 'string', 'description': 'Platform reply ID'}
            }
        },
        400: {
            'type': 'object',
            'properties': {
                'error': {'type': 'string'}
            }
        }
    }
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reply_to_direct_message(request):
    """
    Reply to a Facebook/Instagram direct message manually.
    """
    try:
        message_id = request.data.get('message_id')
        message_text = request.data.get('message')
        connection_id = request.data.get('connection_id')
        
        if not message_id or not message_text or not connection_id:
            return Response(
                {'error': 'message_id, message, and connection_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the connection
        try:
            connection = SocialMediaConnection.objects.get(
                id=connection_id,
                user=request.user,
                is_active=True
            )
        except SocialMediaConnection.DoesNotExist:
            return Response(
                {'error': f'No active connection found with ID {connection_id}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find the direct message
        try:
            dm = DirectMessage.objects.get(
                message_id=message_id,
                connection=connection
            )
        except DirectMessage.DoesNotExist:
            return Response(
                {'error': f'Direct message not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Reply based on platform
        meta_service = MetaService(connection)
        if dm.platform == 'facebook':
            result = meta_service.reply_to_facebook_dm(dm.conversation_id, message_text, connection)
        elif dm.platform == 'instagram':
            result = meta_service.reply_to_instagram_dm(dm.conversation_id, message_text, connection)
        else:
            return Response(
                {'error': f'Unsupported platform: {dm.platform}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if result.get('success'):
            return Response({
                'success': True,
                'message': 'Reply sent successfully',
                'reply_id': result.get('reply_id'),
                'reply_message': result.get('message')
            })
        else:
            return Response(
                {'error': result.get('error', 'Unknown error')}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error replying to direct message: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =============================================================================
# DM AUTOMATION RULE ENDPOINTS
# =============================================================================

class DMAutomationRuleListCreateView(generics.ListCreateAPIView):
    """
    List DM automation rules or create a new rule for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AutomationRuleCreateSerializer
        return AutomationRuleSerializer
    
    def get_queryset(self):
        """Return DM rules for user's connections"""
        user = self.request.user
        queryset = AutomationRule.objects.filter(
            user=user,
            connection__is_active=True,
            message_type__in=['dm', 'both']
        ).select_related('connection').order_by('connection', '-priority', 'rule_name')
        
        # Filter by connection if provided
        connection_id = self.request.query_params.get('connection_id')
        if connection_id:
            queryset = queryset.filter(connection_id=connection_id)
        
        return queryset


# =============================================================================
# DM REPLY ENDPOINTS
# =============================================================================

class DirectMessageReplyListView(generics.ListAPIView):
    """
    List automated DM replies for user's messages.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectMessageReplyListSerializer
    
    def get_queryset(self):
        """Return DM replies for user's messages"""
        user = self.request.user
        queryset = DirectMessageReply.objects.filter(
            direct_message__connection__user=user
        ).select_related('direct_message', 'rule').order_by('-sent_at')
        
        # Filter by connection if provided
        connection_id = self.request.query_params.get('connection_id')
        if connection_id:
            queryset = queryset.filter(direct_message__connection_id=connection_id)
        
        # Filter by platform if provided
        platform = self.request.query_params.get('platform')
        if platform in ['facebook', 'instagram']:
            queryset = queryset.filter(direct_message__platform=platform)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dm_replies_for_message(request, message_id):
    """
    Get all replies for a specific direct message.
    """
    try:
        # Validate message belongs to user
        dm = get_object_or_404(
            DirectMessage,
            id=message_id,
            connection__user=request.user
        )
        
        replies = DirectMessageReply.objects.filter(direct_message=dm).order_by('-sent_at')
        serializer = DirectMessageReplySerializer(replies, many=True)
        
        return Response({
            'success': True,
            'message_id': message_id,
            'replies': serializer.data,
            'count': replies.count()
        })
        
    except Exception as e:
        logger.error(f"Error getting replies for DM {message_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =============================================================================
# DM AUTOMATION STATS
# =============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dm_automation_stats(request):
    """
    Get DM automation statistics for user's connections.
    """
    try:
        user = request.user
        
        # Get basic counts
        total_dms = DirectMessage.objects.filter(
            connection__user=user
        ).count()
        
        replied_dms = DirectMessage.objects.filter(
            connection__user=user,
            status='replied'
        ).count()
        
        total_dm_rules = AutomationRule.objects.filter(
            user=user,
            message_type__in=['dm', 'both']
        ).count()
        
        active_dm_rules = AutomationRule.objects.filter(
            user=user,
            message_type__in=['dm', 'both'],
            is_active=True
        ).count()
        
        total_dm_replies = DirectMessageReply.objects.filter(
            direct_message__connection__user=user
        ).count()
        
        successful_dm_replies = DirectMessageReply.objects.filter(
            direct_message__connection__user=user,
            status='sent'
        ).count()
        
        # Platform breakdown
        facebook_dms = DirectMessage.objects.filter(
            connection__user=user,
            platform='facebook'
        ).count()
        
        instagram_dms = DirectMessage.objects.filter(
            connection__user=user,
            platform='instagram'
        ).count()
        
        # Calculate percentages
        reply_rate = (replied_dms / total_dms * 100) if total_dms > 0 else 0
        success_rate = (successful_dm_replies / total_dm_replies * 100) if total_dm_replies > 0 else 0
        
        return Response({
            'success': True,
            'stats': {
                'total_dms': total_dms,
                'replied_dms': replied_dms,
                'reply_rate': round(reply_rate, 2),
                'total_rules': total_dm_rules,
                'active_rules': active_dm_rules,
                'total_replies': total_dm_replies,
                'successful_replies': successful_dm_replies,
                'success_rate': round(success_rate, 2),
                'platform_breakdown': {
                    'facebook': facebook_dms,
                    'instagram': instagram_dms
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting DM automation stats: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )