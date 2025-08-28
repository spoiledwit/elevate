"""
Facebook Webhook Handler for Comment Automation
"""
import json
import hmac
import hashlib
import logging
from typing import Dict, Any

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from ..models import SocialMediaConnection, Comment, AutomationSettings, CommentReply, DirectMessage, AutomationRule
from ..services.integrations.meta_service import MetaService
from django.utils.dateparse import parse_datetime
from django.utils import timezone

logger = logging.getLogger(__name__)


def verify_webhook_signature(payload: str, signature: str) -> bool:
    """
    Verify Facebook webhook signature using HMAC-SHA256.
    
    Args:
        payload: Raw webhook payload
        signature: X-Hub-Signature-256 header value
        
    Returns:
        bool: True if signature is valid
    """
    try:
        # Remove 'sha256=' prefix from signature
        expected_signature = signature.replace('sha256=', '')
        
        # Generate HMAC-SHA256 hash
        secret = settings.FACEBOOK_APP_SECRET.encode('utf-8')
        hash_object = hmac.new(secret, payload.encode('utf-8'), hashlib.sha256)
        expected_hash = hash_object.hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(expected_hash, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {e}")
        return False


@method_decorator(csrf_exempt, name='dispatch')
class FacebookWebhookView(APIView):
    """
    Facebook webhook endpoint for receiving page events (comments, posts, etc.)
    """
    permission_classes = [AllowAny]  # Allow unauthenticated access for webhooks
    
    def get(self, request):
        """
        Handle webhook verification challenge from Facebook.
        """
        try:
            # Get the challenge parameters
            mode = request.GET.get('hub.mode')
            token = request.GET.get('hub.verify_token')
            challenge = request.GET.get('hub.challenge')
            
            logger.info("="*60)
            logger.info("FACEBOOK WEBHOOK VERIFICATION REQUEST")
            logger.info("="*60)
            logger.info(f"Mode: {mode}")
            logger.info(f"Verify Token: {token}")
            logger.info(f"Challenge: {challenge}")
            logger.info(f"Request Method: {request.method}")
            logger.info(f"Full URL: {request.build_absolute_uri()}")
            logger.info(f"Query Params: {request.GET}")
            
            # Check if this is a webhook verification request
            if mode == 'subscribe':
                # Verify the token (you can set this in Facebook app dashboard)
                verify_token = getattr(settings, 'FACEBOOK_WEBHOOK_VERIFY_TOKEN', 'elevate_webhook_token_2024')
                logger.info(f"Expected verify token: {verify_token}")
                
                if token == verify_token:
                    logger.info("✅ Facebook webhook verification successful!")
                    logger.info(f"Returning challenge: {challenge}")
                    return HttpResponse(challenge, content_type='text/plain')
                else:
                    logger.warning(f"❌ Facebook webhook verification failed: invalid token")
                    logger.warning(f"Expected: {verify_token}")
                    logger.warning(f"Received: {token}")
                    return HttpResponse('Forbidden', status=403)
            else:
                logger.warning(f"❌ Facebook webhook verification failed: invalid mode '{mode}'")
                logger.warning("Expected mode: 'subscribe'")
                return HttpResponse('Bad Request - Invalid Mode', status=400)
            
        except Exception as e:
            logger.error(f"❌ Exception during webhook verification: {e}")
            return HttpResponse('Internal Server Error', status=500)
    
    def post(self, request):
        """
        Handle webhook events from Facebook.
        """
        try:
            # Get raw payload for signature verification
            payload = request.body.decode('utf-8')
            signature = request.META.get('HTTP_X_HUB_SIGNATURE_256', '')
            
            logger.info("="*80)
            logger.info("FACEBOOK WEBHOOK EVENT RECEIVED")
            logger.info("="*80)
            logger.info(f"Signature: {signature}")
            logger.info(f"Payload length: {len(payload)}")
            
            # Verify webhook signature
            if not verify_webhook_signature(payload, signature):
                logger.warning("Facebook webhook signature verification failed")
                return JsonResponse({'error': 'Invalid signature'}, status=403)
            
            # Parse JSON payload
            try:
                webhook_data = json.loads(payload)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse webhook JSON: {e}")
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
            logger.info(f"Webhook data: {json.dumps(webhook_data, indent=2)}")
            
            # Process webhook entries
            entries = webhook_data.get('entry', [])
            logger.info(f"Processing {len(entries)} webhook entries")
            
            for entry in entries:
                page_id = entry.get('id')
                changes = entry.get('changes', [])
                messaging = entry.get('messaging', [])
                
                logger.info(f"Processing entry for page {page_id} with {len(changes)} changes and {len(messaging)} messages")
                
                # Handle page changes (comments, etc.)
                for change in changes:
                    field = change.get('field')
                    value = change.get('value', {})
                    
                    logger.info(f"Processing change: field={field}")
                    logger.info(f"Change value: {json.dumps(value, indent=2)}")
                    
                    # Handle comment-related events
                    if field == 'feed' and 'comment_id' in value:
                        self._handle_comment_event(page_id, value)
                    else:
                        logger.info(f"Unhandled webhook field: {field}")
                
                # Handle messaging events (Facebook Messenger)
                for message_event in messaging:
                    self._handle_messaging_event(page_id, message_event)
            
            # Always return 200 OK to acknowledge receipt
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            logger.error(f"Error processing Facebook webhook: {e}")
            # Still return 200 to prevent Facebook from retrying
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    def _handle_comment_event(self, page_id: str, event_data: Dict[str, Any]):
        """
        Handle comment-related webhook events.
        
        Args:
            page_id: Facebook page ID
            event_data: Comment event data from webhook
        """
        try:
            comment_id = event_data.get('comment_id')
            post_id = event_data.get('post_id')
            message = event_data.get('message', '')
            verb = event_data.get('verb', '')  # 'add', 'edit', 'remove'
            from_user = event_data.get('from', {})
            from_user_name = from_user.get('name', 'Unknown User')
            from_user_id = from_user.get('id', '')
            created_time = event_data.get('created_time')
            
            logger.info(f"Comment event: {verb} comment {comment_id} on post {post_id}")
            logger.info(f"Comment from: {from_user_name}")
            logger.info(f"Comment message: {message}")
            
            # Only handle new comments
            if verb != 'add':
                logger.info(f"Ignoring comment event with verb: {verb}")
                return
            
            # Skip comments from the page itself to prevent replying to own comments
            if from_user_id == page_id:
                logger.info(f"Skipping comment from page itself: {from_user_name} (page_id: {page_id})")
                return
            
            # Find the Facebook connection for this page
            try:
                connection = SocialMediaConnection.objects.get(
                    platform__name='facebook',
                    facebook_page_id=page_id,
                    is_active=True
                )
                logger.info(f"Found connection for page {page_id}: {connection.id}")
            except SocialMediaConnection.DoesNotExist:
                logger.warning(f"No active Facebook connection found for page {page_id}")
                return
            
            # Parse created time
            comment_created_time = timezone.now()
            if created_time:
                try:
                    comment_created_time = parse_datetime(created_time) or timezone.now()
                except:
                    pass
            
            # Save comment to database
            comment, created = Comment.objects.get_or_create(
                comment_id=comment_id,
                defaults={
                    'post_id': post_id,
                    'page_id': page_id,
                    'from_user_name': from_user_name,
                    'from_user_id': from_user_id,
                    'message': message,
                    'connection': connection,
                    'created_time': comment_created_time,
                    'status': 'new'
                }
            )
            
            if created:
                logger.info(f"Saved new comment {comment_id} to database")
                
                # Queue Celery task for automation processing
                from ..tasks import process_comment_automation
                
                # Get delay from settings if exists
                try:
                    settings = AutomationSettings.objects.get(connection=connection)
                    delay = settings.reply_delay_seconds
                except AutomationSettings.DoesNotExist:
                    delay = 5  # Default delay
                
                # Queue the task
                process_comment_automation.delay(comment.id, delay_seconds=delay)
                logger.info(f"Queued automation task for comment {comment_id} with {delay}s delay")
            else:
                logger.info(f"Comment {comment_id} already exists in database")
            
        except Exception as e:
            logger.error(f"Error handling comment event: {e}")
    
    def _handle_messaging_event(self, page_id: str, message_event: Dict[str, Any]):
        """
        Handle messaging webhook events (Facebook Messenger).
        
        Args:
            page_id: Facebook page ID
            message_event: Message event data from webhook
        """
        try:
            sender = message_event.get('sender', {})
            recipient = message_event.get('recipient', {})
            message = message_event.get('message', {})
            timestamp = message_event.get('timestamp')
            
            sender_id = sender.get('id', '')
            recipient_id = recipient.get('id', '')
            message_id = message.get('mid', '')
            message_text = message.get('text', '')
            attachments = message.get('attachments', [])
            is_echo = message.get('is_echo', False)
            
            logger.info(f"Messenger event: message {message_id}")
            logger.info(f"From: {sender_id}, To: {recipient_id}")
            logger.info(f"Text: {message_text}")
            logger.info(f"Is echo: {is_echo}")
            
            # Skip echo messages (sent by the page)
            if is_echo:
                logger.info(f"Skipping echo message: {message_id}")
                return
            
            # Skip if no message text and no attachments
            if not message_text and not attachments:
                logger.info(f"Skipping message with no text or attachments: {message_id}")
                return
            
            # Find the Facebook connection for this page
            try:
                connection = SocialMediaConnection.objects.get(
                    platform__name='facebook',
                    facebook_page_id=page_id,
                    is_active=True
                )
                logger.info(f"Found connection for page {page_id}: {connection.id}")
            except SocialMediaConnection.DoesNotExist:
                logger.warning(f"No active Facebook connection found for page {page_id}")
                return
            
            # Parse timestamp
            message_created_time = timezone.now()
            if timestamp:
                try:
                    message_created_time = timezone.datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)
                except:
                    pass
            
            # Get sender name (we might need to fetch this from Facebook API)
            sender_name = f"User {sender_id}"  # Default, could be enhanced to fetch real name
            
            # Create conversation ID (Facebook Messenger uses sender ID as conversation ID)
            conversation_id = sender_id
            
            # Save direct message to database
            dm, created = DirectMessage.objects.get_or_create(
                message_id=message_id,
                defaults={
                    'conversation_id': conversation_id,
                    'platform': 'facebook',
                    'sender_id': sender_id,
                    'sender_name': sender_name,
                    'message_text': message_text,
                    'message_attachments': attachments,
                    'connection': connection,
                    'created_time': message_created_time,
                    'status': 'new',
                    'is_echo': is_echo
                }
            )
            
            if created:
                logger.info(f"Saved new Facebook DM {message_id} to database")
                
                # Queue Celery task for DM automation processing
                from ..tasks import process_dm_automation
                
                # Get delay from settings if exists
                try:
                    settings = AutomationSettings.objects.get(connection=connection)
                    delay = settings.dm_reply_delay_seconds if settings.enable_dm_automation else None
                except AutomationSettings.DoesNotExist:
                    delay = None
                
                if delay is not None:
                    # Queue the task
                    process_dm_automation.delay(dm.id, delay_seconds=delay)
                    logger.info(f"Queued DM automation task for message {message_id} with {delay}s delay")
                else:
                    logger.info(f"DM automation disabled for connection {connection.id}")
            else:
                logger.info(f"Facebook DM {message_id} already exists in database")
            
        except Exception as e:
            logger.error(f"Error handling messaging event: {e}")
