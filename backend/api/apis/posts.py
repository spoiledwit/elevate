from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from ..models import SocialMediaPost, SocialMediaConnection
from ..serializers import (
    SocialMediaPostSerializer,
    SocialMediaPostListSerializer,
    BulkPostCreateSerializer,
    PostStatusUpdateSerializer
)


class PostListCreateView(generics.ListCreateAPIView):
    """
    List all posts for the authenticated user or create a new post
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SocialMediaPostListSerializer
        return SocialMediaPostSerializer
    
    def get_queryset(self):
        """Return posts for the authenticated user"""
        user = self.request.user
        queryset = SocialMediaPost.objects.filter(user=user).select_related(
            'connection', 'connection__platform'
        ).order_by('-created_at')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by platform if provided
        platform_filter = self.request.query_params.get('platform')
        if platform_filter:
            queryset = queryset.filter(connection__platform__name=platform_filter)
        
        return queryset


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific post
    """
    serializer_class = SocialMediaPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return posts for the authenticated user"""
        return SocialMediaPost.objects.filter(user=self.request.user).select_related(
            'connection', 'connection__platform'
        )
    
    def perform_update(self, serializer):
        """Override update to handle status changes"""
        instance = serializer.instance
        
        # Don't allow updating sent posts
        if instance.status == 'sent':
            return Response(
                {'error': 'Cannot update a sent post'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_create_posts(request):
    """
    Create posts for multiple connections at once
    """
    serializer = BulkPostCreateSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = serializer.validated_data
        connection_ids = validated_data['connection_ids']
        user = request.user
        
        # Verify all connections belong to the user
        connections = SocialMediaConnection.objects.filter(
            id__in=connection_ids,
            user=user,
            is_active=True
        ).select_related('platform')
        
        if len(connections) != len(connection_ids):
            return Response(
                {'error': 'One or more invalid connection IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        posts = []
        try:
            with transaction.atomic():
                for connection in connections:
                    post = SocialMediaPost.objects.create(
                        user=user,
                        connection=connection,
                        text=validated_data['text'],
                        media_urls=validated_data.get('media_urls', []),
                        status=validated_data.get('status', 'draft'),
                        scheduled_at=validated_data.get('scheduled_at')
                    )
                    posts.append(post)
            
            # Return serialized posts
            serialized_posts = SocialMediaPostListSerializer(posts, many=True)
            return Response({
                'success': True,
                'posts': serialized_posts.data,
                'message': f'Successfully created {len(posts)} posts'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create posts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_post_status(request, post_id):
    """
    Update the status of a specific post
    """
    post = get_object_or_404(
        SocialMediaPost, 
        id=post_id, 
        user=request.user
    )
    
    serializer = PostStatusUpdateSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = serializer.validated_data
        new_status = validated_data['status']
        
        # Check if status change is allowed
        if post.status == 'sent':
            return Response(
                {'error': 'Cannot change status of a sent post'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status == 'sent' and post.status != 'sending':
            return Response(
                {'error': 'Cannot directly set status to sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the post
        post.status = new_status
        if 'scheduled_at' in validated_data:
            post.scheduled_at = validated_data['scheduled_at']
        post.save()
        
        serialized_post = SocialMediaPostSerializer(post)
        return Response({
            'success': True,
            'post': serialized_post.data,
            'message': f'Post status updated to {new_status}'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def duplicate_post(request, post_id):
    """
    Duplicate an existing post
    """
    original_post = get_object_or_404(
        SocialMediaPost,
        id=post_id,
        user=request.user
    )
    
    # Create a duplicate
    duplicate = SocialMediaPost.objects.create(
        user=request.user,
        connection=original_post.connection,
        text=original_post.text,
        media_urls=original_post.media_urls,
        status='draft',  # Always create duplicates as drafts
        scheduled_at=None  # Remove scheduling from duplicates
    )
    
    serialized_post = SocialMediaPostSerializer(duplicate)
    return Response({
        'success': True,
        'post': serialized_post.data,
        'message': 'Post duplicated successfully'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_post_stats(request):
    """
    Get statistics about user's posts
    """
    user = request.user
    posts = SocialMediaPost.objects.filter(user=user)
    
    stats = {
        'total_posts': posts.count(),
        'draft_posts': posts.filter(status='draft').count(),
        'scheduled_posts': posts.filter(status='scheduled').count(),
        'sent_posts': posts.filter(status='sent').count(),
        'failed_posts': posts.filter(status='failed').count(),
        'posts_by_platform': {},
        'recent_activity': []
    }
    
    # Posts by platform
    for post in posts.select_related('connection__platform'):
        platform_name = post.connection.platform.display_name
        if platform_name not in stats['posts_by_platform']:
            stats['posts_by_platform'][platform_name] = 0
        stats['posts_by_platform'][platform_name] += 1
    
    # Recent activity (last 10 posts)
    recent_posts = posts.select_related('connection__platform').order_by('-created_at')[:10]
    for post in recent_posts:
        stats['recent_activity'].append({
            'id': post.id,
            'text': post.text[:50] + '...' if len(post.text) > 50 else post.text,
            'platform': post.connection.platform.display_name,
            'status': post.status,
            'created_at': post.created_at
        })
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_scheduled_posts(request):
    """
    Get all scheduled posts for the next 30 days
    """
    user = request.user
    from datetime import timedelta
    
    end_date = timezone.now() + timedelta(days=30)
    
    scheduled_posts = SocialMediaPost.objects.filter(
        user=user,
        status='scheduled',
        scheduled_at__lte=end_date,
        scheduled_at__gte=timezone.now()
    ).select_related('connection__platform').order_by('scheduled_at')
    
    serialized_posts = SocialMediaPostListSerializer(scheduled_posts, many=True)
    
    return Response({
        'scheduled_posts': serialized_posts.data,
        'count': scheduled_posts.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def publish_now(request, post_id):
    """
    Immediately publish a draft or scheduled post
    """
    post = get_object_or_404(
        SocialMediaPost,
        id=post_id,
        user=request.user
    )
    
    if post.status not in ['draft', 'scheduled']:
        return Response(
            {'error': 'Only draft or scheduled posts can be published'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update status to sending (actual publishing would be handled by background task)
    post.status = 'sending'
    post.scheduled_at = None  # Clear scheduling
    post.save()
    
    # TODO: Trigger background task for actual publishing
    # This would typically call the appropriate platform API
    
    serialized_post = SocialMediaPostSerializer(post)
    return Response({
        'success': True,
        'post': serialized_post.data,
        'message': 'Post queued for publishing'
    })