"""
Email Integration API Views

Handles Gmail OAuth connections and email management operations.
"""
import logging
from django.utils import timezone
from django.shortcuts import redirect
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from ..models import EmailAccount, EmailMessage, EmailDraft
from ..serializers import (
    EmailAccountSerializer,
    EmailMessageSerializer,
    EmailMessageListSerializer,
    EmailDraftSerializer,
    GmailAuthUrlSerializer,
    GmailConnectSerializer,
    GmailAccountResponseSerializer,
    EmailSendSerializer,
    EmailSendResponseSerializer,
    EmailSyncSerializer,
    EmailSyncResponseSerializer,
    EmailMarkReadSerializer,
)
from ..services.integrations import GmailService

logger = logging.getLogger(__name__)


class EmailPagination(PageNumberPagination):
    """Pagination for email lists"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class GmailAuthUrlView(APIView):
    """
    Get Gmail OAuth authorization URL for connecting accounts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Gmail OAuth URL",
        description="Generate OAuth authorization URL for Gmail account connection",
        responses={200: GmailAuthUrlSerializer}
    )
    def get(self, request):
        try:
            service = GmailService()
            state = str(request.user.id)  # Use user ID as state for verification
            auth_url = service.get_auth_url(state=state)

            return Response({
                'auth_url': auth_url
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Failed to generate Gmail auth URL: {e}")
            return Response({
                'error': 'Failed to generate authorization URL'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GmailCallbackView(APIView):
    """
    Handle Gmail OAuth callback and connect account.

    Note: This view doesn't require authentication because the user is redirected here
    from Google OAuth. We use the state parameter to identify the user.
    """
    permission_classes = []  # No authentication required for OAuth callback

    @extend_schema(
        summary="Gmail OAuth Callback",
        description="Handle OAuth callback and connect Gmail account",
        parameters=[
            OpenApiParameter('code', OpenApiTypes.STR, OpenApiParameter.QUERY, required=True),
            OpenApiParameter('state', OpenApiTypes.STR, OpenApiParameter.QUERY),
        ],
        responses={200: GmailAccountResponseSerializer}
    )
    def get(self, request):
        from django.contrib.auth import get_user_model

        code = request.GET.get('code')
        state = request.GET.get('state')

        if not code:
            return Response({
                'error': 'Authorization code not provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not state:
            return Response({
                'error': 'State parameter not provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get user from state parameter
        User = get_user_model()
        try:
            user = User.objects.get(id=int(state))
        except (User.DoesNotExist, ValueError):
            return Response({
                'error': 'Invalid state parameter'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = GmailService()
            email_account = service.connect_account(user, code)

            # Redirect to frontend inbox page with success
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return redirect(f"{frontend_url}/inbox?connected=success")

        except Exception as e:
            logger.error(f"Failed to connect Gmail account: {e}")
            # Redirect to frontend with error
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return redirect(f"{frontend_url}/inbox?connected=error&message={str(e)}")


class EmailAccountListView(APIView):
    """
    List user's connected email accounts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Email Accounts",
        description="Get list of user's connected Gmail accounts",
        responses={200: EmailAccountSerializer(many=True)}
    )
    def get(self, request):
        accounts = EmailAccount.objects.filter(user=request.user).order_by('-created_at')
        serializer = EmailAccountSerializer(accounts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmailAccountDisconnectView(APIView):
    """
    Disconnect a Gmail account.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Disconnect Email Account",
        description="Disconnect a Gmail account",
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    def delete(self, request, account_id):
        try:
            account = EmailAccount.objects.get(id=account_id, user=request.user)
            service = GmailService(email_account=account)
            service.disconnect_account()

            return Response({
                'message': 'Email account disconnected successfully'
            }, status=status.HTTP_200_OK)

        except EmailAccount.DoesNotExist:
            return Response({
                'error': 'Email account not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to disconnect email account: {e}")
            return Response({
                'error': 'Failed to disconnect email account'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailMessageListView(APIView):
    """
    List email messages from connected accounts.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = EmailPagination

    @extend_schema(
        summary="List Email Messages",
        description="Get list of email messages from connected accounts",
        responses={200: EmailMessageListSerializer(many=True)}
    )
    def get(self, request):
        # Get user's email accounts
        accounts = EmailAccount.objects.filter(user=request.user, is_active=True)

        # Get all messages
        messages = EmailMessage.objects.filter(account__in=accounts)
        # Order by received date
        messages = messages.select_related('account').order_by('-received_at')

        # Paginate
        paginator = EmailPagination()
        page = paginator.paginate_queryset(messages, request)

        serializer = EmailMessageListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class EmailMessageDetailView(APIView):
    """
    Get email message detail.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Email Message Detail",
        description="Get detailed information about an email message",
        responses={200: EmailMessageSerializer}
    )
    def get(self, request, message_id):
        try:
            message = EmailMessage.objects.select_related('account').prefetch_related('attachments').get(
                id=message_id,
                account__user=request.user
            )
            serializer = EmailMessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except EmailMessage.DoesNotExist:
            return Response({
                'error': 'Email message not found'
            }, status=status.HTTP_404_NOT_FOUND)


class EmailSendView(APIView):
    """
    Send an email.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Send Email",
        description="Send an email via Gmail",
        request=EmailSendSerializer,
        responses={200: EmailSendResponseSerializer}
    )
    def post(self, request):
        serializer = EmailSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            account = EmailAccount.objects.get(
                id=serializer.validated_data['account_id'],
                user=request.user,
                is_active=True
            )

            service = GmailService(email_account=account)
            result = service.send_message(
                to_emails=serializer.validated_data['to_emails'],
                subject=serializer.validated_data['subject'],
                body_html=serializer.validated_data['body_html'],
                cc_emails=serializer.validated_data.get('cc_emails', []),
                bcc_emails=serializer.validated_data.get('bcc_emails', []),
                attachments=serializer.validated_data.get('attachments', [])
            )

            return Response({
                'message_id': result['message_id'],
                'thread_id': result['thread_id'],
                'success': True,
                'message': 'Email sent successfully'
            }, status=status.HTTP_200_OK)

        except EmailAccount.DoesNotExist:
            return Response({
                'error': 'Email account not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return Response({
                'error': 'Failed to send email',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailSyncView(APIView):
    """
    Sync emails from Gmail.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Sync Emails",
        description="Sync emails from Gmail account",
        request=EmailSyncSerializer,
        responses={200: EmailSyncResponseSerializer}
    )
    def post(self, request):
        serializer = EmailSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            account = EmailAccount.objects.get(
                id=serializer.validated_data['account_id'],
                user=request.user,
                is_active=True
            )

            service = GmailService(email_account=account)
            max_results = serializer.validated_data.get('max_results', 50)

            messages = service.fetch_messages(max_results=max_results)

            return Response({
                'synced_count': len(messages),
                'account_email': account.email_address,
                'last_synced': account.last_synced,
                'message': f'Successfully synced {len(messages)} emails'
            }, status=status.HTTP_200_OK)

        except EmailAccount.DoesNotExist:
            return Response({
                'error': 'Email account not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to sync emails: {e}")
            return Response({
                'error': 'Failed to sync emails',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailMarkReadView(APIView):
    """
    Mark email as read/unread.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Mark Email as Read/Unread",
        description="Update read status of an email",
        request=EmailMarkReadSerializer,
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    def patch(self, request, message_id):
        serializer = EmailMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            message = EmailMessage.objects.select_related('account').get(
                id=message_id,
                account__user=request.user
            )

            if serializer.validated_data['is_read']:
                service = GmailService(email_account=message.account)
                service.mark_as_read(message.message_id)
            else:
                # Update local database
                message.is_read = False
                message.save()

            return Response({
                'message': 'Email status updated successfully'
            }, status=status.HTTP_200_OK)

        except EmailMessage.DoesNotExist:
            return Response({
                'error': 'Email message not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to update email status: {e}")
            return Response({
                'error': 'Failed to update email status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailDeleteView(APIView):
    """
    Delete an email.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Delete Email",
        description="Move email to trash",
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    def delete(self, request, message_id):
        try:
            message = EmailMessage.objects.select_related('account').get(
                id=message_id,
                account__user=request.user
            )

            service = GmailService(email_account=message.account)
            service.delete_message(message.message_id)

            return Response({
                'message': 'Email deleted successfully'
            }, status=status.HTTP_200_OK)

        except EmailMessage.DoesNotExist:
            return Response({
                'error': 'Email message not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to delete email: {e}")
            return Response({
                'error': 'Failed to delete email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailDraftListView(APIView):
    """
    List and create email drafts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Email Drafts",
        description="Get list of email drafts",
        responses={200: EmailDraftSerializer(many=True)}
    )
    def get(self, request):
        accounts = EmailAccount.objects.filter(user=request.user, is_active=True)
        drafts = EmailDraft.objects.filter(account__in=accounts).select_related('account').order_by('-modified_at')

        serializer = EmailDraftSerializer(drafts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create Email Draft",
        description="Create a new email draft",
        request=EmailDraftSerializer,
        responses={201: EmailDraftSerializer}
    )
    def post(self, request):
        serializer = EmailDraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify account belongs to user
        account = EmailAccount.objects.get(
            id=serializer.validated_data['account'].id,
            user=request.user
        )

        draft = serializer.save()
        return Response(EmailDraftSerializer(draft).data, status=status.HTTP_201_CREATED)


class EmailDraftDetailView(APIView):
    """
    Update and delete email drafts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Update Email Draft",
        description="Update an existing email draft",
        request=EmailDraftSerializer,
        responses={200: EmailDraftSerializer}
    )
    def patch(self, request, draft_id):
        try:
            draft = EmailDraft.objects.select_related('account').get(
                id=draft_id,
                account__user=request.user
            )

            serializer = EmailDraftSerializer(draft, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        except EmailDraft.DoesNotExist:
            return Response({
                'error': 'Email draft not found'
            }, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(
        summary="Delete Email Draft",
        description="Delete an email draft",
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}}
    )
    def delete(self, request, draft_id):
        try:
            draft = EmailDraft.objects.get(
                id=draft_id,
                account__user=request.user
            )
            draft.delete()

            return Response({
                'message': 'Email draft deleted successfully'
            }, status=status.HTTP_200_OK)

        except EmailDraft.DoesNotExist:
            return Response({
                'error': 'Email draft not found'
            }, status=status.HTTP_404_NOT_FOUND)
