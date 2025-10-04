import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta, datetime

from .models import SocialMediaConnection, SocialMediaPost, Comment, CommentAutomationRule, CommentAutomationSettings, CommentReply
from .services.factory import SocialMediaServiceFactory
from .services.integrations.meta_service import MetaService
from django.utils.dateparse import parse_datetime
import time

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


# COMMENT AUTOMATION TASKS

@shared_task
def process_comment_automation(comment_id, delay_seconds=0):
    """Process comment automation with optional delay"""
    logger.info(f"Processing comment automation for comment {comment_id}")
    
    if delay_seconds > 0:
        logger.info(f"Delaying reply by {delay_seconds} seconds")
        time.sleep(delay_seconds)
    
    try:
        # Get the comment
        comment = Comment.objects.get(id=comment_id)
        
        # Skip if comment is from the page itself (don't reply to our own comments)
        if comment.from_user_id and comment.page_id == comment.from_user_id:
            logger.info(f"Comment {comment_id} is from the page itself (user_id: {comment.from_user_id}), skipping automation")
            comment.status = 'ignored'
            comment.save()
            return {'success': True, 'message': 'Comment from page itself, ignored'}
        
        # Skip if already replied
        if comment.status == 'replied':
            logger.info(f"Comment {comment_id} already replied, skipping")
            return {'success': True, 'message': 'Already replied'}
        
        # Check if automation is enabled for this connection
        try:
            settings = CommentAutomationSettings.objects.get(connection=comment.connection)
            if not settings.is_enabled:
                logger.info(f"Automation disabled for connection {comment.connection.id}")
                comment.status = 'ignored'
                comment.save()
                return {'success': True, 'message': 'Automation disabled'}
        except CommentAutomationSettings.DoesNotExist:
            # No settings found, skip automation
            logger.info(f"No automation settings found for connection {comment.connection.id}")
            comment.status = 'ignored'
            comment.save()
            return {'success': True, 'message': 'No automation settings'}
        
        # Get matching rules
        rules = CommentAutomationRule.objects.filter(
            connection=comment.connection,
            is_active=True
        ).order_by('-priority', 'rule_name')
        
        matched_rule = None
        reply_text = None
        
        # Find matching rule
        for rule in rules:
            if _does_comment_match_rule(comment, rule):
                matched_rule = rule
                reply_text = rule.reply_template
                break
        
        # Use default reply if no rule matched
        if not matched_rule and settings.default_reply:
            reply_text = settings.default_reply
        
        # Send reply if we have text
        if reply_text:
            result = _send_comment_reply(comment, reply_text, matched_rule)
            
            if result.get('success'):
                comment.status = 'replied'
                comment.save()
                
                # Update rule statistics
                if matched_rule:
                    matched_rule.times_triggered += 1
                    matched_rule.save()
                
                logger.info(f"Successfully replied to comment {comment_id}")
                return {'success': True, 'reply_sent': True, 'rule': matched_rule.rule_name if matched_rule else 'default'}
            else:
                comment.status = 'error'
                comment.save()
                logger.error(f"Failed to send reply to comment {comment_id}: {result.get('error')}")
                return {'success': False, 'error': result.get('error')}
        else:
            # No matching rule and no default reply
            comment.status = 'ignored'
            comment.save()
            logger.info(f"No matching rule or default reply for comment {comment_id}")
            return {'success': True, 'message': 'No matching rule or default reply'}
        
    except Comment.DoesNotExist:
        logger.error(f"Comment {comment_id} not found")
        return {'success': False, 'error': 'Comment not found'}
    except Exception as e:
        logger.error(f"Error processing comment automation for {comment_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


def _does_comment_match_rule(comment, rule):
    """Check if comment matches a rule's conditions"""
    message = comment.message.lower()
    keywords = rule.keywords
    
    if not keywords:
        return False
    
    matches = []
    for keyword in keywords:
        keyword_check = keyword.lower()
        matches.append(keyword_check in message)
    
    # Return True if any keyword matches (OR logic)
    # For AND logic, we'd use: return all(matches)
    return any(matches)


def _send_comment_reply(comment, reply_text, rule=None):
    """Send reply to a comment"""
    try:
        # Use Meta service to send reply
        meta_service = MetaService(comment.connection)
        result = meta_service.reply_to_comment(comment.comment_id, reply_text, comment.connection)
        
        if result.get('success'):
            # Save reply record
            CommentReply.objects.create(
                comment=comment,
                rule=rule,
                reply_text=reply_text,
                facebook_reply_id=result.get('reply_id', ''),
                status='sent',
                sent_at=timezone.now()
            )
            
            return {'success': True, 'reply_id': result.get('reply_id')}
        else:
            # Save failed reply record
            CommentReply.objects.create(
                comment=comment,
                rule=rule,
                reply_text=reply_text,
                status='failed',
                error_message=result.get('error', 'Unknown error')
            )
            
            return {'success': False, 'error': result.get('error', 'Unknown error')}
    
    except Exception as e:
        logger.error(f"Error sending reply to comment {comment.comment_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


# =============================================================================
# DIRECT MESSAGE AUTOMATION TASKS
# =============================================================================

@shared_task
def process_dm_automation(dm_id, delay_seconds=0):
    """Process direct message automation with optional delay"""
    logger.info(f"Processing DM automation for message {dm_id}")
    
    if delay_seconds > 0:
        logger.info(f"Delaying DM reply by {delay_seconds} seconds")
        time.sleep(delay_seconds)
    
    try:
        from .models import DirectMessage, AutomationRule, AutomationSettings, DirectMessageReply
        
        dm = DirectMessage.objects.get(id=dm_id)
        logger.info(f"Processing DM {dm.message_id} from {dm.sender_name}")
        
        # Skip if DM is from the page itself (echo messages should already be filtered)
        if dm.is_echo:
            logger.info(f"DM {dm_id} is an echo message, skipping automation")
            dm.status = 'ignored'
            dm.save()
            return {'success': True, 'message': 'Echo message, ignored'}
        
        # Skip if already replied
        if dm.status == 'replied':
            logger.info(f"DM {dm_id} already replied to")
            return {'success': True, 'message': 'Already replied'}
        
        # Check if DM automation is enabled for this connection
        try:
            settings = AutomationSettings.objects.get(connection=dm.connection)
            if not settings.enable_dm_automation:
                logger.info(f"DM automation disabled for connection {dm.connection.id}")
                dm.status = 'ignored'
                dm.save()
                return {'success': True, 'message': 'DM automation disabled'}
        except AutomationSettings.DoesNotExist:
            # No settings found, skip automation
            logger.info(f"No automation settings found for connection {dm.connection.id}")
            dm.status = 'ignored'
            dm.save()
            return {'success': True, 'message': 'No automation settings'}
        
        # Get matching rules for DMs
        rules = AutomationRule.objects.filter(
            connection=dm.connection,
            is_active=True,
            message_type__in=['dm', 'both']
        ).order_by('-priority')
        
        logger.info(f"Found {rules.count()} active DM automation rules")
        
        matched_rule = None
        reply_text = None
        
        # Check each rule for keyword matches
        for rule in rules:
            if _does_dm_match_rule(dm, rule):
                logger.info(f"DM matches rule: {rule.rule_name}")
                matched_rule = rule
                reply_text = rule.reply_template
                break
        
        # If no rule matched, use default reply if available
        if not reply_text and settings.dm_default_reply:
            logger.info("No rules matched, using default DM reply")
            reply_text = settings.dm_default_reply
        
        if reply_text:
            # Send the reply
            result = _send_dm_reply(dm, reply_text, matched_rule)
            
            if result.get('success'):
                dm.status = 'replied'
                dm.save()
                
                # Update rule trigger count
                if matched_rule:
                    matched_rule.times_triggered += 1
                    matched_rule.save()
                
                logger.info(f"Successfully processed DM automation for {dm_id}")
                return {'success': True, 'message': 'Reply sent'}
            else:
                dm.status = 'error'
                dm.save()
                return result
        else:
            logger.info(f"No matching rules or default reply for DM {dm_id}")
            dm.status = 'ignored'
            dm.save()
            return {'success': True, 'message': 'No matching rules'}
            
    except DirectMessage.DoesNotExist:
        logger.error(f"DirectMessage {dm_id} not found")
        return {'success': False, 'error': 'Direct message not found'}
    except Exception as e:
        logger.error(f"Error processing DM automation for {dm_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


def _does_dm_match_rule(dm, rule):
    """Check if direct message matches a rule's conditions"""
    message = dm.message_text.lower() if dm.message_text else ""
    keywords = rule.keywords
    
    if not keywords or not message:
        return False
    
    matches = []
    for keyword in keywords:
        keyword_check = keyword.lower()
        matches.append(keyword_check in message)
    
    # Return True if any keyword matches (OR logic)
    return any(matches)


def _send_dm_reply(dm, reply_text, rule=None):
    """Send reply to a direct message"""
    try:
        # Use Meta service to send DM reply
        meta_service = MetaService(dm.connection)
        
        if dm.platform == 'facebook':
            result = meta_service.reply_to_facebook_dm(dm.conversation_id, reply_text, dm.connection)
        elif dm.platform == 'instagram':
            result = meta_service.reply_to_instagram_dm(dm.conversation_id, reply_text, dm.connection)
        else:
            return {'success': False, 'error': f'Unsupported platform: {dm.platform}'}
        
        if result.get('success'):
            # Save the reply to database
            DirectMessageReply.objects.create(
                direct_message=dm,
                rule=rule,
                reply_text=reply_text,
                platform_reply_id=result.get('reply_id', ''),
                status='sent'
            )
            
            logger.info(f"DM reply sent successfully for {dm.message_id}")
            return {'success': True}
        else:
            # Save failed reply to database
            DirectMessageReply.objects.create(
                direct_message=dm,
                rule=rule,
                reply_text=reply_text,
                status='failed',
                error_message=result.get('error', 'Unknown error')
            )
            
            return {'success': False, 'error': result.get('error', 'Unknown error')}
    
    except Exception as e:
        logger.error(f"Error sending DM reply to {dm.message_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def schedule_freebie_email_sequence(order_id):
    """
    Schedule all follow-up emails for a freebie order.
    Called automatically when freebie order is completed.
    """
    from .models import Order, FreebieFollowupEmail, ScheduledFollowupEmail
    from datetime import timedelta

    try:
        order = Order.objects.get(id=order_id)

        # Only schedule for freebie type
        if order.custom_link.type != 'freebie':
            logger.info(f"Skipping email sequence for non-freebie order {order.order_id}")
            return

        # Get all active email templates
        email_templates = FreebieFollowupEmail.objects.filter(is_active=True).order_by('step_number')

        scheduled_count = 0
        for template in email_templates:
            # Calculate scheduled datetime
            scheduled_datetime = order.created_at + timedelta(days=template.delay_days)
            scheduled_datetime = scheduled_datetime.replace(
                hour=template.send_time.hour,
                minute=template.send_time.minute,
                second=0,
                microsecond=0
            )

            # Create scheduled email
            ScheduledFollowupEmail.objects.create(
                order=order,
                email_template=template,
                scheduled_for=scheduled_datetime
            )
            scheduled_count += 1

        logger.info(f"Scheduled {scheduled_count} follow-up emails for order {order.order_id}")
        return {'success': True, 'scheduled_count': scheduled_count}

    except Exception as e:
        logger.error(f"Failed to schedule email sequence for order {order_id}: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def send_scheduled_followup_emails():
    """
    Send all follow-up emails that are scheduled to be sent now.
    Runs every 5 minutes via Celery Beat.
    """
    from .models import ScheduledFollowupEmail
    from .services.email_service import send_freebie_followup_email
    from datetime import timedelta

    now = timezone.now()

    # Get emails scheduled to send now (within last 10 minutes to handle delays)
    pending_emails = ScheduledFollowupEmail.objects.filter(
        sent=False,
        scheduled_for__lte=now,
        scheduled_for__gte=now - timedelta(minutes=10)
    ).select_related('order', 'email_template', 'order__custom_link', 'order__custom_link__user_profile')

    sent_count = 0
    failed_count = 0

    for scheduled_email in pending_emails:
        try:
            # Send the email
            success = send_freebie_followup_email(scheduled_email)

            if success:
                # Mark as sent
                scheduled_email.sent = True
                scheduled_email.sent_at = timezone.now()
                scheduled_email.save()
                sent_count += 1
                logger.info(f"Sent follow-up email {scheduled_email.email_template.step_number} for order {scheduled_email.order.order_id}")
            else:
                scheduled_email.error_message = "Email sending failed"
                scheduled_email.save()
                failed_count += 1
                logger.error(f"Failed to send follow-up email {scheduled_email.id}")

        except Exception as e:
            scheduled_email.error_message = str(e)
            scheduled_email.save()
            failed_count += 1
            logger.error(f"Error sending scheduled email {scheduled_email.id}: {e}")

    logger.info(f"Follow-up emails processed: {sent_count} sent, {failed_count} failed")


@shared_task
def schedule_optin_email_sequence(order_id):
    """
    Schedule all follow-up emails for an opt-in order.
    Called automatically when opt-in order is completed.
    """
    from .models import Order, OptinFollowupEmail, ScheduledOptinEmail
    from datetime import timedelta

    try:
        order = Order.objects.get(id=order_id)

        # Only schedule for opt_in type
        if order.custom_link.type != 'opt_in':
            logger.info(f"Skipping email sequence for non-opt-in order {order.order_id}")
            return

        # Get all active email templates
        email_templates = OptinFollowupEmail.objects.filter(is_active=True).order_by('step_number')

        scheduled_count = 0
        for template in email_templates:
            # Calculate scheduled datetime
            scheduled_datetime = order.created_at + timedelta(days=template.delay_days)
            scheduled_datetime = scheduled_datetime.replace(
                hour=template.send_time.hour,
                minute=template.send_time.minute,
                second=0,
                microsecond=0
            )

            # Create scheduled email
            ScheduledOptinEmail.objects.create(
                order=order,
                email_template=template,
                scheduled_for=scheduled_datetime
            )
            scheduled_count += 1

        logger.info(f"Scheduled {scheduled_count} opt-in follow-up emails for order {order.order_id}")
        return {'success': True, 'scheduled_count': scheduled_count}

    except Exception as e:
        logger.error(f"Failed to schedule opt-in email sequence for order {order_id}: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def send_scheduled_optin_emails():
    """
    Send all opt-in follow-up emails that are scheduled to be sent now.
    Runs every 5 minutes via Celery Beat.
    """
    from .models import ScheduledOptinEmail
    from .services.email_service import send_optin_followup_email
    from datetime import timedelta

    now = timezone.now()

    # Get emails scheduled to send now (within last 10 minutes to handle delays)
    pending_emails = ScheduledOptinEmail.objects.filter(
        sent=False,
        scheduled_for__lte=now,
        scheduled_for__gte=now - timedelta(minutes=10)
    ).select_related('order', 'email_template', 'order__custom_link', 'order__custom_link__user_profile')

    sent_count = 0
    failed_count = 0

    for scheduled_email in pending_emails:
        try:
            # Send the email
            success = send_optin_followup_email(scheduled_email)

            if success:
                # Mark as sent
                scheduled_email.sent = True
                scheduled_email.sent_at = timezone.now()
                scheduled_email.save()
                sent_count += 1
                logger.info(f"Sent opt-in follow-up email {scheduled_email.email_template.step_number} for order {scheduled_email.order.order_id}")
            else:
                scheduled_email.error_message = "Email sending failed"
                scheduled_email.save()
                failed_count += 1
                logger.error(f"Failed to send opt-in follow-up email {scheduled_email.id}")

        except Exception as e:
            scheduled_email.error_message = str(e)
            scheduled_email.save()
            failed_count += 1
            logger.error(f"Error sending scheduled opt-in email {scheduled_email.id}: {e}")

    logger.info(f"Opt-in follow-up emails processed: {sent_count} sent, {failed_count} failed")
    return {'sent': sent_count, 'failed': failed_count}
