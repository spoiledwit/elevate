import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from .models import SocialMediaConnection, SocialMediaPost
from .services.factory import SocialMediaServiceFactory

logger = logging.getLogger(__name__)


@shared_task
def refresh_expired_tokens():
    """Refresh expired access tokens for all connections"""
    logger.info("Starting token refresh task")
    
    # Get connections that need refresh
    connections = SocialMediaConnection.objects.filter(
        is_active=True,
        is_verified=True,
        expires_at__lte=timezone.now() + timedelta(hours=1)  # Refresh if expires within 1 hour
    )
    
    refreshed_count = 0
    failed_count = 0
    
    for connection in connections:
        try:
            service = SocialMediaServiceFactory.get_service(connection.platform.name, connection)
            success = service.refresh_token(connection)
            
            if success:
                refreshed_count += 1
                logger.info(f"Token refreshed for {connection.user.username} - {connection.platform.name}")
            else:
                failed_count += 1
                logger.error(f"Failed to refresh token for {connection.user.username} - {connection.platform.name}")
                
        except Exception as e:
            failed_count += 1
            logger.error(f"Error refreshing token for {connection.user.username} - {connection.platform.name}: {str(e)}")
    
    logger.info(f"Token refresh completed: {refreshed_count} refreshed, {failed_count} failed")
    return {
        'refreshed_count': refreshed_count,
        'failed_count': failed_count,
        'total_processed': len(connections)
    }


@shared_task
def process_scheduled_posts():
    """Process scheduled posts that are due to be sent"""
    logger.info("Starting scheduled posts processing")
    
    # Get posts that are scheduled and due
    posts = SocialMediaPost.objects.filter(
        status='scheduled',
        scheduled_at__lte=timezone.now()
    )
    
    processed_count = 0
    success_count = 0
    failed_count = 0
    
    for post in posts:
        try:
            # Mark as sending
            post.status = 'sending'
            post.save()
            
            # Get service and post
            service = SocialMediaServiceFactory.get_service(
                post.connection.platform.name, 
                post.connection
            )
            
            # Get first media URL if any
            media_url = post.media_urls[0] if post.media_urls else None
            result = service.publish_post(post.connection, post.text, media_url)
            
            if result.get('success'):
                post.status = 'sent'
                post.sent_at = timezone.now()
                post.platform_post_id = result.get('post_id', '')
                post.platform_post_url = result.get('post_url', '')
                post.error_message = ''
                success_count += 1
                logger.info(f"Post sent successfully: {post.id}")
            else:
                post.status = 'failed'
                post.error_message = result.get('error', 'Unknown error')
                failed_count += 1
                logger.error(f"Post failed: {post.id} - {result.get('error')}")
            
            post.save()
            processed_count += 1
            
        except Exception as e:
            post.status = 'failed'
            post.error_message = str(e)
            post.save()
            failed_count += 1
            logger.error(f"Error processing post {post.id}: {str(e)}")
    
    logger.info(f"Scheduled posts processing completed: {processed_count} processed, {success_count} successful, {failed_count} failed")
    return {
        'processed_count': processed_count,
        'success_count': success_count,
        'failed_count': failed_count
    }


@shared_task
def retry_failed_posts():
    """Retry failed posts with exponential backoff"""
    logger.info("Starting failed posts retry task")
    
    # Get failed posts that haven't exceeded max retries
    posts = SocialMediaPost.objects.filter(
        status='failed',
        retry_count__lt=3  # Max 3 retries
    )
    
    retried_count = 0
    success_count = 0
    
    for post in posts:
        try:
            # Increment retry count
            post.retry_count += 1
            post.status = 'sending'
            post.save()
            
            # Get service and retry post
            service = SocialMediaServiceFactory.get_service(
                post.connection.platform.name, 
                post.connection
            )
            
            # Get first media URL if any
            media_url = post.media_urls[0] if post.media_urls else None
            result = service.publish_post(post.connection, post.text, media_url)
            
            if result.get('success'):
                post.status = 'sent'
                post.sent_at = timezone.now()
                post.platform_post_id = result.get('post_id', '')
                post.platform_post_url = result.get('post_url', '')
                post.error_message = ''
                success_count += 1
                logger.info(f"Retry successful for post: {post.id}")
            else:
                post.status = 'failed'
                post.error_message = result.get('error', 'Unknown error')
                logger.error(f"Retry failed for post: {post.id} - {result.get('error')}")
            
            post.save()
            retried_count += 1
            
        except Exception as e:
            post.status = 'failed'
            post.error_message = str(e)
            post.save()
            logger.error(f"Error retrying post {post.id}: {str(e)}")
    
    logger.info(f"Failed posts retry completed: {retried_count} retried, {success_count} successful")
    return {
        'retried_count': retried_count,
        'success_count': success_count
    }


@shared_task
def publish_scheduled_post(post_id):
    """Publish a single scheduled post immediately"""
    logger.info(f"Publishing post {post_id} immediately")
    
    try:
        # Get the post
        post = SocialMediaPost.objects.get(id=post_id)
        
        # Skip if not in sending status
        if post.status != 'sending':
            logger.warning(f"Post {post_id} is not in sending status, skipping")
            return {'success': False, 'error': f'Post is in {post.status} status'}
        
        # Get service and publish
        service = SocialMediaServiceFactory.get_service(
            post.connection.platform.name, 
            post.connection
        )
        
        # Get first media URL if any
        media_url = post.media_urls[0] if post.media_urls else None
        result = service.publish_post(post.connection, post.text, media_url)
        
        if result.get('success'):
            post.status = 'sent'
            post.sent_at = timezone.now()
            post.platform_post_id = result.get('post_id', '')
            post.platform_post_url = result.get('post_url', '')
            post.error_message = ''
            logger.info(f"Post {post_id} published successfully")
        else:
            post.status = 'failed'
            post.error_message = result.get('error', 'Unknown error')
            logger.error(f"Post {post_id} failed: {result.get('error')}")
        
        post.save()
        
        return {
            'success': result.get('success', False),
            'post_id': post_id,
            'status': post.status,
            'error': result.get('error') if not result.get('success') else None
        }
        
    except SocialMediaPost.DoesNotExist:
        logger.error(f"Post {post_id} not found")
        return {'success': False, 'error': 'Post not found'}
    except Exception as e:
        logger.error(f"Error publishing post {post_id}: {str(e)}")
        try:
            post = SocialMediaPost.objects.get(id=post_id)
            post.status = 'failed'
            post.error_message = str(e)
            post.save()
        except:
            pass
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_old_posts():
    """Clean up old posts (older than 30 days)"""
    logger.info("Starting old posts cleanup task")
    
    cutoff_date = timezone.now() - timedelta(days=30)
    old_posts = SocialMediaPost.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['sent', 'failed', 'cancelled']
    )
    
    deleted_count = old_posts.count()
    old_posts.delete()
    
    logger.info(f"Old posts cleanup completed: {deleted_count} posts deleted")
    return {
        'deleted_count': deleted_count
    }
