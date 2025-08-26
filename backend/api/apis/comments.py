"""
Facebook Comment Management API endpoints
"""
import logging
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes

from ..models import SocialMediaConnection, Comment, CommentAutomationRule, CommentAutomationSettings, CommentReply
from ..serializers import (
    CommentSerializer, CommentListSerializer, 
    CommentAutomationRuleSerializer, CommentAutomationRuleCreateSerializer,
    CommentAutomationSettingsSerializer, CommentAutomationSettingsCreateSerializer,
    CommentReplySerializer, CommentReplyListSerializer
)
from ..services.integrations.meta_service import MetaService

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def subscribe_page_webhooks(request):
    """
    Subscribe a Facebook page to webhooks for comment automation.
    """
    try:
        page_id = request.data.get('page_id')
        
        if not page_id:
            return Response(
                {'error': 'page_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the Facebook connection for this page
        try:
            connection = SocialMediaConnection.objects.get(
                user=request.user,
                platform__name='facebook',
                facebook_page_id=page_id,
                is_active=True
            )
        except SocialMediaConnection.DoesNotExist:
            return Response(
                {'error': f'No active Facebook connection found for page {page_id}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Subscribe to webhooks
        meta_service = MetaService(connection)
        result = meta_service.subscribe_page_to_webhooks(page_id, connection)
        
        if result.get('success'):
            return Response({
                'success': True,
                'message': f'Page {page_id} subscribed to webhooks successfully',
                'result': result.get('result')
            })
        else:
            return Response(
                {'error': result.get('error', 'Unknown error')}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error subscribing page to webhooks: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_post_comments(request):
    """
    Get comments for a specific Facebook post.
    """
    try:
        post_id = request.query_params.get('post_id')
        page_id = request.query_params.get('page_id')
        
        if not post_id or not page_id:
            return Response(
                {'error': 'post_id and page_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the Facebook connection for this page
        try:
            connection = SocialMediaConnection.objects.get(
                user=request.user,
                platform__name='facebook',
                facebook_page_id=page_id,
                is_active=True
            )
        except SocialMediaConnection.DoesNotExist:
            return Response(
                {'error': f'No active Facebook connection found for page {page_id}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get comments
        meta_service = MetaService(connection)
        result = meta_service.get_post_comments(post_id, connection)
        
        if result.get('success'):
            return Response({
                'success': True,
                'comments': result.get('comments', []),
                'paging': result.get('paging', {})
            })
        else:
            return Response(
                {'error': result.get('error', 'Unknown error')}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error getting post comments: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reply_to_comment(request):
    """
    Reply to a Facebook comment manually.
    """
    try:
        comment_id = request.data.get('comment_id')
        message = request.data.get('message')
        page_id = request.data.get('page_id')
        
        if not comment_id or not message or not page_id:
            return Response(
                {'error': 'comment_id, message, and page_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the Facebook connection for this page
        try:
            connection = SocialMediaConnection.objects.get(
                user=request.user,
                platform__name='facebook',
                facebook_page_id=page_id,
                is_active=True
            )
        except SocialMediaConnection.DoesNotExist:
            return Response(
                {'error': f'No active Facebook connection found for page {page_id}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Reply to comment
        meta_service = MetaService(connection)
        result = meta_service.reply_to_comment(comment_id, message, connection)
        
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
        logger.error(f"Error replying to comment: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_facebook_pages(request):
    """
    List all Facebook pages connected by the user.
    """
    try:
        connections = SocialMediaConnection.objects.filter(
            user=request.user,
            platform__name='facebook',
            is_active=True
        ).values(
            'id', 'facebook_page_id', 'facebook_page_name', 
            'platform_username', 'platform_display_name'
        )
        
        pages = []
        for conn in connections:
            pages.append({
                'connection_id': conn['id'],
                'page_id': conn['facebook_page_id'],
                'page_name': conn['facebook_page_name'] or conn['platform_display_name'],
                'username': conn['platform_username']
            })
        
        return Response({
            'success': True,
            'pages': pages,
            'count': len(pages)
        })
        
    except Exception as e:
        logger.error(f"Error listing Facebook pages: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Comment Automation API Endpoints

class CommentListView(generics.ListAPIView):
    """
    List comments for authenticated user's Facebook pages.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentListSerializer
    
    def get_queryset(self):
        """Return comments for user's Facebook connections"""
        user = self.request.user
        queryset = Comment.objects.filter(
            connection__user=user,
            connection__platform__name='facebook',
            connection__is_active=True
        ).select_related('connection').order_by('-created_time')
        
        # Filter by connection/page if provided
        connection_id = self.request.query_params.get('connection_id')
        if connection_id:
            queryset = queryset.filter(connection_id=connection_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class CommentDetailView(generics.RetrieveAPIView):
    """
    Get details of a specific comment.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        """Return comments for user's Facebook connections"""
        return Comment.objects.filter(
            connection__user=self.request.user,
            connection__platform__name='facebook'
        ).select_related('connection')


class CommentAutomationRuleListCreateView(generics.ListCreateAPIView):
    """
    List automation rules or create a new rule for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentAutomationRuleCreateSerializer
        return CommentAutomationRuleSerializer
    
    def get_queryset(self):
        """Return rules for user's Facebook connections"""
        user = self.request.user
        queryset = CommentAutomationRule.objects.filter(
            user=user,
            connection__platform__name='facebook',
            connection__is_active=True
        ).select_related('connection').order_by('connection', '-priority', 'rule_name')
        
        # Filter by connection if provided
        connection_id = self.request.query_params.get('connection_id')
        if connection_id:
            queryset = queryset.filter(connection_id=connection_id)
        
        return queryset


class CommentAutomationRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a specific automation rule.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentAutomationRuleSerializer
    
    def get_queryset(self):
        """Return rules for the authenticated user"""
        return CommentAutomationRule.objects.filter(
            user=self.request.user
        ).select_related('connection')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_automation_rule(request, rule_id):
    """
    Toggle automation rule active/inactive status.
    """
    try:
        rule = get_object_or_404(
            CommentAutomationRule,
            id=rule_id,
            user=request.user
        )
        
        # Toggle the is_active status
        rule.is_active = not rule.is_active
        rule.save()
        
        return Response({
            'success': True,
            'rule_id': rule.id,
            'rule_name': rule.rule_name,
            'is_active': rule.is_active,
            'message': f'Rule {"activated" if rule.is_active else "deactivated"} successfully'
        })
        
    except Exception as e:
        logger.error(f"Error toggling rule {rule_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CommentAutomationSettingsListView(generics.ListAPIView):
    """
    List automation settings for user's Facebook connections.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentAutomationSettingsSerializer
    
    def get_queryset(self):
        """Return settings for user's Facebook connections"""
        return CommentAutomationSettings.objects.filter(
            user=self.request.user,
            connection__platform__name='facebook',
            connection__is_active=True
        ).select_related('connection')


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def automation_settings_by_connection(request, connection_id):
    """
    Get or create/update automation settings for a specific connection.
    """
    try:
        # Validate connection belongs to user
        connection = get_object_or_404(
            SocialMediaConnection,
            id=connection_id,
            user=request.user,
            platform__name='facebook',
            is_active=True
        )
        
        if request.method == 'GET':
            try:
                settings = CommentAutomationSettings.objects.get(
                    user=request.user,
                    connection=connection
                )
                serializer = CommentAutomationSettingsSerializer(settings)
                return Response({
                    'success': True,
                    'settings': serializer.data
                })
            except CommentAutomationSettings.DoesNotExist:
                return Response({
                    'success': True,
                    'settings': None,
                    'message': 'No settings found for this connection'
                })
        
        elif request.method == 'POST':
            # Add connection_id to the request data
            data = request.data.copy()
            data['connection_id'] = connection_id
            
            serializer = CommentAutomationSettingsCreateSerializer(
                data=data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                settings = serializer.save()
                response_serializer = CommentAutomationSettingsSerializer(settings)
                return Response({
                    'success': True,
                    'settings': response_serializer.data,
                    'message': 'Settings saved successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error handling settings for connection {connection_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CommentReplyListView(generics.ListAPIView):
    """
    List automated replies for user's comments.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentReplyListSerializer
    
    def get_queryset(self):
        """Return replies for user's comments"""
        user = self.request.user
        queryset = CommentReply.objects.filter(
            comment__connection__user=user,
            comment__connection__platform__name='facebook'
        ).select_related('comment', 'rule').order_by('-sent_at')
        
        # Filter by connection if provided
        connection_id = self.request.query_params.get('connection_id')
        if connection_id:
            queryset = queryset.filter(comment__connection_id=connection_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def comment_replies_for_comment(request, comment_id):
    """
    Get all replies for a specific comment.
    """
    try:
        # Validate comment belongs to user
        comment = get_object_or_404(
            Comment,
            id=comment_id,
            connection__user=request.user
        )
        
        replies = CommentReply.objects.filter(comment=comment).order_by('-sent_at')
        serializer = CommentReplySerializer(replies, many=True)
        
        return Response({
            'success': True,
            'comment_id': comment_id,
            'replies': serializer.data,
            'count': replies.count()
        })
        
    except Exception as e:
        logger.error(f"Error getting replies for comment {comment_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def automation_stats(request):
    """
    Get automation statistics for user's connections.
    """
    try:
        user = request.user
        
        # Get basic counts
        total_comments = Comment.objects.filter(
            connection__user=user,
            connection__platform__name='facebook'
        ).count()
        
        replied_comments = Comment.objects.filter(
            connection__user=user,
            connection__platform__name='facebook',
            status='replied'
        ).count()
        
        total_rules = CommentAutomationRule.objects.filter(
            user=user,
            connection__platform__name='facebook'
        ).count()
        
        active_rules = CommentAutomationRule.objects.filter(
            user=user,
            connection__platform__name='facebook',
            is_active=True
        ).count()
        
        total_replies = CommentReply.objects.filter(
            comment__connection__user=user,
            comment__connection__platform__name='facebook'
        ).count()
        
        successful_replies = CommentReply.objects.filter(
            comment__connection__user=user,
            comment__connection__platform__name='facebook',
            status='sent'
        ).count()
        
        # Calculate percentages
        reply_rate = (replied_comments / total_comments * 100) if total_comments > 0 else 0
        success_rate = (successful_replies / total_replies * 100) if total_replies > 0 else 0
        
        return Response({
            'success': True,
            'stats': {
                'total_comments': total_comments,
                'replied_comments': replied_comments,
                'reply_rate': round(reply_rate, 2),
                'total_rules': total_rules,
                'active_rules': active_rules,
                'total_replies': total_replies,
                'successful_replies': successful_replies,
                'success_rate': round(success_rate, 2)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting automation stats: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_automation_settings(request, settings_id):
    """
    Update automation settings by ID.
    """
    try:
        # Get settings that belongs to user
        settings = get_object_or_404(
            CommentAutomationSettings,
            id=settings_id,
            user=request.user
        )
        
        # Update settings with partial data
        serializer = CommentAutomationSettingsSerializer(
            settings, 
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            settings = serializer.save()
            return Response({
                'success': True,
                'settings': serializer.data,
                'message': 'Settings updated successfully'
            })
        else:
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error updating automation settings {settings_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_automation_settings(request, settings_id):
    """
    Delete automation settings by ID and unsubscribe from webhooks.
    """
    try:
        # Get settings that belongs to user
        settings = get_object_or_404(
            CommentAutomationSettings,
            id=settings_id,
            user=request.user
        )
        
        connection = settings.connection
        connection_name = connection.facebook_page_name or 'Unknown Page'
        
        # Unsubscribe from webhooks before deleting
        if connection.facebook_page_id:
            meta_service = MetaService(connection)
            webhook_result = meta_service.unsubscribe_page_from_webhooks(connection.facebook_page_id, connection)
            
            if not webhook_result.get('success'):
                logger.warning(f"Failed to unsubscribe page {connection.facebook_page_id} from webhooks: {webhook_result.get('error')}")
        
        settings.delete()
        
        return Response({
            'success': True,
            'message': f'Settings for {connection_name} deleted successfully and webhooks unsubscribed'
        })
    
    except Exception as e:
        logger.error(f"Error deleting automation settings {settings_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_automation_settings(request, settings_id):
    """
    Toggle automation settings enabled/disabled status and manage webhooks.
    """
    try:
        # Get settings that belongs to user
        settings = get_object_or_404(
            CommentAutomationSettings,
            id=settings_id,
            user=request.user
        )
        
        connection = settings.connection
        connection_name = connection.facebook_page_name or 'Unknown Page'
        old_status = settings.is_enabled
        
        # Toggle the is_enabled field
        settings.is_enabled = not settings.is_enabled
        settings.save(update_fields=['is_enabled'])
        
        # Handle webhook subscription/unsubscription
        if connection.facebook_page_id:
            meta_service = MetaService(connection)
            
            if settings.is_enabled and not old_status:
                # Enabling automation - subscribe to webhooks
                webhook_result = meta_service.subscribe_page_to_webhooks(connection.facebook_page_id, connection)
                if not webhook_result.get('success'):
                    logger.warning(f"Failed to subscribe page {connection.facebook_page_id} to webhooks: {webhook_result.get('error')}")
            
            elif not settings.is_enabled and old_status:
                # Disabling automation - unsubscribe from webhooks
                webhook_result = meta_service.unsubscribe_page_from_webhooks(connection.facebook_page_id, connection)
                if not webhook_result.get('success'):
                    logger.warning(f"Failed to unsubscribe page {connection.facebook_page_id} from webhooks: {webhook_result.get('error')}")
        
        serializer = CommentAutomationSettingsSerializer(settings)
        
        return Response({
            'success': True,
            'settings': serializer.data,
            'message': f'Automation {"enabled" if settings.is_enabled else "disabled"} for {connection_name}'
        })
    
    except Exception as e:
        logger.error(f"Error toggling automation settings {settings_id}: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )