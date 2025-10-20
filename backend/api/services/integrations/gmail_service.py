"""
Gmail Service for Email Integration

Handles OAuth authentication, token management, and email operations
for Gmail accounts.
"""
import base64
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import json

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from django.utils import timezone
from cryptography.fernet import Fernet

from ...models import EmailAccount, EmailMessage, EmailAttachment, User

logger = logging.getLogger(__name__)


class GmailService:
    """
    Service for integrating with Gmail via Google OAuth 2.0.

    Supports:
    - OAuth 2.0 authentication
    - Fetching emails
    - Sending emails
    - Email management (mark as read, delete)
    - Token refresh
    """

    SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
    ]

    def __init__(self, email_account: EmailAccount = None):
        self.email_account = email_account
        self.client_id = getattr(settings, 'GOOGLE_EMAIL_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'GOOGLE_EMAIL_CLIENT_SECRET', '')
        self.redirect_uri = getattr(settings, 'GOOGLE_EMAIL_REDIRECT_URI', '')
        self.encryption_key = getattr(settings, 'EMAIL_ENCRYPTION_KEY', '').encode()

        if not all([self.client_id, self.client_secret]):
            logger.error("Gmail credentials not properly configured in settings")

        if not self.encryption_key:
            logger.error("EMAIL_ENCRYPTION_KEY not configured in settings")

    def _encrypt_token(self, token: str) -> str:
        """Encrypt OAuth token for storage."""
        fernet = Fernet(self.encryption_key)
        return fernet.encrypt(token.encode()).decode()

    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt OAuth token from storage."""
        fernet = Fernet(self.encryption_key)
        return fernet.decrypt(encrypted_token.encode()).decode()

    def get_auth_url(self, state: str = None) -> str:
        """
        Generate OAuth authorization URL for Gmail.

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            str: Authorization URL
        """
        from urllib.parse import urlencode

        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.SCOPES),
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent',
        }

        if state:
            params['state'] = state

        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    def exchange_code_for_token(self, auth_code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens.

        Args:
            auth_code: OAuth authorization code from Google

        Returns:
            Dict containing tokens and user info
        """
        import requests

        try:
            token_url = 'https://oauth2.googleapis.com/token'
            data = {
                'code': auth_code,
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'redirect_uri': self.redirect_uri,
                'grant_type': 'authorization_code',
            }

            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()

            # Get user email address
            creds = Credentials(
                token=token_data['access_token'],
                refresh_token=token_data.get('refresh_token'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.SCOPES
            )

            service = build('gmail', 'v1', credentials=creds)
            profile = service.users().getProfile(userId='me').execute()

            return {
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token'),
                'expires_in': token_data.get('expires_in', 3600),
                'email_address': profile['emailAddress'],
            }

        except Exception as e:
            logger.error(f"Failed to exchange code for token: {e}")
            raise

    def connect_account(self, user: User, auth_code: str) -> EmailAccount:
        """
        Connect user's Gmail account.

        Args:
            user: Django User instance
            auth_code: OAuth authorization code

        Returns:
            EmailAccount instance
        """
        try:
            token_data = self.exchange_code_for_token(auth_code)

            # Encrypt tokens
            encrypted_access = self._encrypt_token(token_data['access_token'])
            encrypted_refresh = self._encrypt_token(token_data['refresh_token'])

            # Calculate expiry
            expiry = timezone.now() + timedelta(seconds=token_data['expires_in'])

            # Create or update email account
            email_account, created = EmailAccount.objects.update_or_create(
                user=user,
                email_address=token_data['email_address'],
                defaults={
                    'access_token': encrypted_access,
                    'refresh_token': encrypted_refresh,
                    'token_expiry': expiry,
                    'is_active': True,
                }
            )

            logger.info(f"Gmail account connected: {token_data['email_address']}")
            return email_account

        except Exception as e:
            logger.error(f"Failed to connect Gmail account: {e}")
            raise

    def _get_credentials(self) -> Credentials:
        """Get Google credentials from email account."""
        if not self.email_account:
            raise ValueError("EmailAccount not set")

        access_token = self._decrypt_token(self.email_account.access_token)
        refresh_token = self._decrypt_token(self.email_account.refresh_token)

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.SCOPES
        )

        # Refresh if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())

            # Update stored tokens
            self.email_account.access_token = self._encrypt_token(creds.token)
            self.email_account.token_expiry = timezone.now() + timedelta(seconds=3600)
            self.email_account.save()

        return creds

    def fetch_messages(self, max_results: int = 50, query: str = None) -> List[EmailMessage]:
        """
        Fetch messages from Gmail and store in database.

        Args:
            max_results: Maximum number of messages to fetch
            query: Gmail search query (e.g., 'is:unread')

        Returns:
            List of EmailMessage instances
        """
        try:
            creds = self._get_credentials()
            service = build('gmail', 'v1', credentials=creds)

            email_messages = []

            # Fetch both INBOX and SENT messages
            if not query:
                # Fetch inbox messages
                inbox_params = {'userId': 'me', 'maxResults': max_results // 2, 'labelIds': ['INBOX']}
                inbox_results = service.users().messages().list(**inbox_params).execute()
                inbox_messages = inbox_results.get('messages', [])

                # Fetch sent messages
                sent_params = {'userId': 'me', 'maxResults': max_results // 2, 'labelIds': ['SENT']}
                sent_results = service.users().messages().list(**sent_params).execute()
                sent_messages = sent_results.get('messages', [])

                # Combine messages
                messages = inbox_messages + sent_messages
            else:
                # Use custom query
                params = {'userId': 'me', 'maxResults': max_results, 'q': query}
                results = service.users().messages().list(**params).execute()
                messages = results.get('messages', [])

            for msg in messages:
                # Get full message details
                message = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()

                # Parse message
                email_msg = self._parse_message(message)
                if email_msg:
                    email_messages.append(email_msg)

            self.email_account.last_synced = timezone.now()
            self.email_account.save()

            logger.info(f"Fetched {len(email_messages)} messages for {self.email_account.email_address}")
            return email_messages

        except HttpError as e:
            logger.error(f"Failed to fetch messages: {e}")
            raise

    def _parse_message(self, message: Dict) -> Optional[EmailMessage]:
        """Parse Gmail API message response to EmailMessage model."""
        try:
            headers = {h['name']: h['value'] for h in message['payload']['headers']}

            # Extract email data
            from_email = headers.get('From', '')
            # Parse "Name <email@example.com>" format
            if '<' in from_email:
                from_name = from_email.split('<')[0].strip()
                from_email = from_email.split('<')[1].split('>')[0].strip()
            else:
                from_name = ''

            to_emails = headers.get('To', '').split(',')
            cc_emails = headers.get('Cc', '').split(',') if headers.get('Cc') else []
            subject = headers.get('Subject', '')
            date_str = headers.get('Date', '')

            # Parse date
            from email.utils import parsedate_to_datetime
            received_at = parsedate_to_datetime(date_str) if date_str else timezone.now()

            # Get body
            body_text, body_html = self._extract_body(message['payload'])

            # Check for attachments
            has_attachments = any(
                part.get('filename') for part in message['payload'].get('parts', [])
            )

            # Get labels
            labels = message.get('labelIds', [])
            is_read = 'UNREAD' not in labels
            is_starred = 'STARRED' in labels

            # Create or update message
            email_message, created = EmailMessage.objects.update_or_create(
                account=self.email_account,
                message_id=message['id'],
                defaults={
                    'thread_id': message.get('threadId', ''),
                    'from_email': from_email,
                    'from_name': from_name,
                    'to_emails': [e.strip() for e in to_emails if e.strip()],
                    'cc_emails': [e.strip() for e in cc_emails if e.strip()],
                    'subject': subject,
                    'body_text': body_text,
                    'body_html': body_html,
                    'snippet': message.get('snippet', ''),
                    'received_at': received_at,
                    'is_read': is_read,
                    'is_starred': is_starred,
                    'has_attachments': has_attachments,
                    'labels': labels,
                }
            )

            return email_message

        except Exception as e:
            logger.error(f"Failed to parse message: {e}")
            return None

    def _extract_body(self, payload: Dict) -> tuple:
        """Extract text and HTML body from message payload."""
        body_text = ''
        body_html = ''

        if 'body' in payload and payload['body'].get('data'):
            data = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
            if payload.get('mimeType') == 'text/html':
                body_html = data
            else:
                body_text = data

        if 'parts' in payload:
            for part in payload['parts']:
                mime_type = part.get('mimeType')
                if mime_type == 'text/plain' and part['body'].get('data'):
                    body_text = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                elif mime_type == 'text/html' and part['body'].get('data'):
                    body_html = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                elif 'parts' in part:
                    # Recursive for nested parts
                    text, html = self._extract_body(part)
                    if not body_text:
                        body_text = text
                    if not body_html:
                        body_html = html

        return body_text, body_html

    def send_message(
        self,
        to_emails: List[str],
        subject: str,
        body_html: str,
        cc_emails: List[str] = None,
        bcc_emails: List[str] = None,
        attachments: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Send an email via Gmail.

        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body_html: HTML body content
            cc_emails: Optional CC recipients
            bcc_emails: Optional BCC recipients
            attachments: Optional list of attachment dicts with 'filename' and 'content'

        Returns:
            Dict with message ID and thread ID
        """
        try:
            creds = self._get_credentials()
            service = build('gmail', 'v1', credentials=creds)

            # Create message
            message = MIMEMultipart()
            message['To'] = ', '.join(to_emails)
            message['From'] = self.email_account.email_address
            message['Subject'] = subject

            if cc_emails:
                message['Cc'] = ', '.join(cc_emails)
            if bcc_emails:
                message['Bcc'] = ', '.join(bcc_emails)

            # Add HTML body
            message.attach(MIMEText(body_html, 'html'))

            # Add attachments if any
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename={attachment["filename"]}'
                    )
                    message.attach(part)

            # Encode message
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

            # Send
            result = service.users().messages().send(
                userId='me',
                body={'raw': raw}
            ).execute()

            logger.info(f"Email sent successfully: {result['id']}")
            return {
                'message_id': result['id'],
                'thread_id': result['threadId']
            }

        except HttpError as e:
            logger.error(f"Failed to send email: {e}")
            raise

    def mark_as_read(self, message_id: str) -> bool:
        """Mark a message as read."""
        try:
            creds = self._get_credentials()
            service = build('gmail', 'v1', credentials=creds)

            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()

            # Update local database
            EmailMessage.objects.filter(
                account=self.email_account,
                message_id=message_id
            ).update(is_read=True)

            return True

        except HttpError as e:
            logger.error(f"Failed to mark as read: {e}")
            return False

    def delete_message(self, message_id: str) -> bool:
        """Move message to trash."""
        try:
            creds = self._get_credentials()
            service = build('gmail', 'v1', credentials=creds)

            service.users().messages().trash(
                userId='me',
                id=message_id
            ).execute()

            # Delete from local database
            EmailMessage.objects.filter(
                account=self.email_account,
                message_id=message_id
            ).delete()

            return True

        except HttpError as e:
            logger.error(f"Failed to delete message: {e}")
            return False

    def disconnect_account(self) -> bool:
        """Disconnect Gmail account."""
        try:
            self.email_account.is_active = False
            self.email_account.save()
            logger.info(f"Gmail account disconnected: {self.email_account.email_address}")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect account: {e}")
            return False
