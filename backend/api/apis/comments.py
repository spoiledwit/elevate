"""
Facebook Comment Management API endpoints
"""
import logging
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes

from ..models import SocialMediaConnection
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