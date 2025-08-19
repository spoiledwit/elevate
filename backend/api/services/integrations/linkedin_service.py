"""
LinkedIn Service for LinkedIn API Integration

Handles OAuth authentication, token management, and content publishing
for LinkedIn personal profiles using LinkedIn Posts API v2.
"""
import requests
import logging
from typing import Dict, Any, Optional
from urllib.parse import urlencode
from django.conf import settings
from django.utils import timezone

from ...models import SocialMediaConnection, SocialMediaPlatform, User
from .base import BaseIntegrationService, IntegrationError

logger = logging.getLogger(__name__)


class LinkedInService(BaseIntegrationService):
    """
    Service for integrating with LinkedIn API v2.
    
    Supports:
    - OAuth 2.0 authentication for personal profiles
    - Personal profile posting using Posts API
    - Token refresh and management
    """
    
    def __init__(self):
        super().__init__()
        self.client_id = getattr(settings, 'LINKEDIN_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'LINKEDIN_CLIENT_SECRET', '')
        self.redirect_uri = getattr(settings, 'LINKEDIN_REDIRECT_URI', '')
        self.api_base = "https://api.linkedin.com/v2"
        
        if not all([self.client_id, self.client_secret]):
            self.log_error("LinkedIn credentials not properly configured in settings")
    
    def get_auth_url(self, state: str = None) -> str:
        """
        Generate OAuth authorization URL for LinkedIn API.
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            str: Authorization URL
        """
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'r_liteprofile r_emailaddress w_member_social w_organization_social rw_organization_admin',
        }
        
        if state:
            params['state'] = state
            
        return f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    
    def connect_account(self, user: User, auth_code: str, **kwargs) -> Dict[str, Any]:
        """
        Connect user's LinkedIn account.
        
        Args:
            user: Django User instance
            auth_code: OAuth authorization code from LinkedIn
            
        Returns:
            Dict containing connection information
        """
        try:
            logger.debug(f"Starting LinkedIn connection for user {user.username} with auth_code: {auth_code[:10]}...")
            
            # Step 1: Exchange code for access token
            access_token_data = self._exchange_code_for_token(auth_code)
            logger.debug(f"Got access token data: {access_token_data}")
            
            # Step 2: Get organization/company pages first to extract user ID
            company_pages, user_linkedin_id = self._get_company_pages(access_token_data['access_token'])
            logger.debug(f"Got company pages: {company_pages}")
            logger.debug(f"Extracted user LinkedIn ID: {user_linkedin_id}")
            
            # Step 3: Get user information (with fallback user ID from orgs)
            user_info = self._get_user_info(access_token_data['access_token'])
            if not user_info.get('id') and user_linkedin_id:
                user_info['id'] = user_linkedin_id
            logger.debug(f"Final user info: {user_info}")
            
            # Step 4: Create connections (personal profile + company pages)
            connections_created = 0
            accounts = []
            
            # Create personal profile connection
            personal_connection = self._create_linkedin_connection(user, user_info, access_token_data, 'personal')
            logger.debug(f"Created personal LinkedIn connection: {personal_connection}")
            connections_created += 1
            accounts.append({
                'platform': 'linkedin',
                'type': 'personal',
                'user_id': user_info.get('id', ''),
                'name': f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip(),
                'email': user_info.get('email', '')
            })
            
            # Create company page connections
            for page in company_pages:
                try:
                    company_connection = self._create_linkedin_connection(user, page, access_token_data, 'company')
                    logger.debug(f"Created company LinkedIn connection: {company_connection}")
                    connections_created += 1
                    accounts.append({
                        'platform': 'linkedin',
                        'type': 'company',
                        'user_id': page.get('id', ''),
                        'name': page.get('localizedName', ''),
                        'description': page.get('localizedDescription', '')
                    })
                except Exception as e:
                    logger.error(f"Failed to create company connection: {e}")
            
            self.log_info(
                f"Successfully connected LinkedIn accounts for user {user.username}",
                user_id=user.id,
                linkedin_user_id=user_info.get('id', ''),
                connections_created=connections_created
            )
            
            return {
                'success': True,
                'connections_created': connections_created,
                'accounts': accounts
            }
            
        except Exception as e:
            self.log_error(f"Failed to connect LinkedIn account for user {user.username}", e, user_id=user.id)
            raise IntegrationError(f"LinkedIn connection failed: {str(e)}", platform='linkedin')
    
    def publish_post(self, connection: SocialMediaConnection, content: str, **kwargs) -> Dict[str, Any]:
        """
        Create a post on LinkedIn personal profile.
        
        Args:
            connection: SocialMediaConnection instance
            content: Post text content
            **kwargs: Additional post options (media_url, link_url, etc.)
            
        Returns:
            Dict containing post information
        """
        try:
            if not content or len(content.strip()) == 0:
                raise IntegrationError("LinkedIn posts require text content", platform='linkedin')
            
            if len(content) > 3000:
                raise IntegrationError("LinkedIn posts cannot exceed 3000 characters", platform='linkedin')
            
            return self._create_post(connection, content, **kwargs)
            
        except Exception as e:
            self.log_error(
                f"Failed to create LinkedIn post for connection {connection.id}",
                e,
                connection_id=connection.id,
                platform='linkedin'
            )
            raise IntegrationError(f"LinkedIn post creation failed: {str(e)}", platform='linkedin')
    
    def refresh_token(self, connection: SocialMediaConnection) -> bool:
        """
        LinkedIn access tokens are long-lived and don't need refresh.
        This method is kept for interface compatibility.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True (LinkedIn tokens are long-lived)
        """
        # LinkedIn access tokens are typically valid for 60 days
        # and don't have a refresh mechanism like other platforms
        self.log_info(f"LinkedIn tokens are long-lived, no refresh needed for connection {connection.id}")
        return True
    
    def disconnect_account(self, connection: SocialMediaConnection) -> bool:
        """
        Disconnect LinkedIn account.
        
        Args:
            connection: SocialMediaConnection instance
            
        Returns:
            bool: True if disconnection successful
        """
        try:
            # LinkedIn doesn't require explicit token revocation
            # Just mark as inactive
            connection.is_active = False
            connection.save()
            
            self.log_info(f"Successfully disconnected LinkedIn connection {connection.id}")
            return True
            
        except Exception as e:
            self.log_error(f"Failed to disconnect LinkedIn connection {connection.id}", e)
            return False
    
    def _exchange_code_for_token(self, auth_code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        url = "https://www.linkedin.com/oauth/v2/accessToken"
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = {
            'grant_type': 'authorization_code',
            'code': auth_code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
        
        return response.json()
    
    def _get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get LinkedIn user information using comprehensive permissions."""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Get basic profile info with r_liteprofile scope - try minimal fields first
        try:
            profile_url = "https://api.linkedin.com/v2/people/~:(id)"
            profile_response = requests.get(profile_url, headers=headers)
            logger.info(f"LinkedIn profile API status: {profile_response.status_code}")
            logger.info(f"LinkedIn profile API response: {profile_response.text}")
            
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                logger.info(f"LinkedIn profile data: {profile_data}")
                
                # Try to get name separately if ID worked
                try:
                    name_url = "https://api.linkedin.com/v2/people/~:(localizedFirstName,localizedLastName)"
                    name_response = requests.get(name_url, headers=headers)
                    logger.info(f"LinkedIn name API status: {name_response.status_code}")
                    logger.info(f"LinkedIn name API response: {name_response.text}")
                    
                    if name_response.status_code == 200:
                        name_data = name_response.json()
                        profile_data.update(name_data)
                        logger.info(f"Updated LinkedIn profile data: {profile_data}")
                except Exception as name_e:
                    logger.error(f"Failed to get LinkedIn name: {name_e}")
            else:
                profile_data = {}
        except Exception as e:
            logger.error(f"Failed to get LinkedIn profile: {e}")
            profile_data = {}
        
        # Get email with r_emailaddress scope
        try:
            email_url = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
            email_response = requests.get(email_url, headers=headers)
            logger.info(f"LinkedIn email API status: {email_response.status_code}")
            logger.info(f"LinkedIn email API response: {email_response.text}")
            
            if email_response.status_code == 200:
                email_data = email_response.json()
                logger.info(f"LinkedIn email data: {email_data}")
                email = email_data.get('elements', [{}])[0].get('handle~', {}).get('emailAddress', '')
            else:
                email = ''
        except Exception as e:
            logger.error(f"Failed to get LinkedIn email: {e}")
            email = ''
        
        # Extract profile picture URL
        profile_picture = ''
        if 'profilePicture' in profile_data:
            display_image = profile_data['profilePicture'].get('displayImage~', {})
            elements = display_image.get('elements', [])
            if elements:
                # Get the largest image
                largest_image = max(elements, key=lambda x: x.get('data', {}).get('com.linkedin.digitalmedia.mediaartifact.StillImage', {}).get('displaySize', {}).get('width', 0))
                profile_picture = largest_image.get('identifiers', [{}])[0].get('identifier', '')
        
        # Build user info
        user_info = {
            'id': profile_data.get('id', ''),
            'firstName': profile_data.get('localizedFirstName', ''),
            'lastName': profile_data.get('localizedLastName', ''),
            'email': email,
            'profilePicture': profile_picture
        }
        
        logger.info(f"Final LinkedIn user info: {user_info}")
        return user_info
    
    def _get_company_pages(self, access_token: str) -> tuple[list, str]:
        """Get LinkedIn company pages user has admin access to and extract user ID."""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        user_linkedin_id = ''
        
        try:
            # Get organizations where user is an admin - simplified to avoid permission errors
            orgs_url = "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR"
            orgs_response = requests.get(orgs_url, headers=headers)
            logger.info(f"LinkedIn orgs API status: {orgs_response.status_code}")
            logger.info(f"LinkedIn orgs API response: {orgs_response.text}")
            
            if orgs_response.status_code == 200:
                orgs_data = orgs_response.json()
                logger.info(f"LinkedIn orgs data: {orgs_data}")
                
                company_pages = []
                
                for element in orgs_data.get('elements', []):
                    # Extract user ID from roleAssignee (first time we see it)
                    if not user_linkedin_id:
                        role_assignee = element.get('roleAssignee', '')
                        if role_assignee:
                            user_linkedin_id = role_assignee.replace('urn:li:person:', '')
                            logger.info(f"Extracted user LinkedIn ID from orgs: {user_linkedin_id}")
                    
                    # Only process APPROVED organizations
                    if element.get('state') != 'APPROVED':
                        continue
                        
                    # Extract organization ID from URN
                    org_urn = element.get('organization', '')
                    if org_urn:
                        org_id = org_urn.replace('urn:li:organization:', '')
                        
                        # Try to get basic org info
                        try:
                            org_url = f"https://api.linkedin.com/v2/organizations/{org_id}:(id,localizedName)"
                            org_response = requests.get(org_url, headers=headers)
                            
                            if org_response.status_code == 200:
                                org_data = org_response.json()
                                company_pages.append({
                                    'id': org_data.get('id', org_id),
                                    'localizedName': org_data.get('localizedName', f'Company {org_id}'),
                                    'localizedDescription': '',  # Skip description to avoid permission issues
                                    'logoUrl': ''  # Skip logo to avoid permission issues
                                })
                            else:
                                # Fallback with just ID
                                company_pages.append({
                                    'id': org_id,
                                    'localizedName': f'Company {org_id}',
                                    'localizedDescription': '',
                                    'logoUrl': ''
                                })
                        except Exception as org_e:
                            logger.error(f"Failed to get org details for {org_id}: {org_e}")
                            # Fallback with just ID
                            company_pages.append({
                                'id': org_id,
                                'localizedName': f'Company {org_id}',
                                'localizedDescription': '',
                                'logoUrl': ''
                            })
                
                return company_pages, user_linkedin_id
            else:
                return [], user_linkedin_id
        except Exception as e:
            logger.error(f"Failed to get LinkedIn company pages: {e}")
            return [], user_linkedin_id
    
    def _create_linkedin_connection(self, user: User, account_info: Dict[str, Any], 
                                  token_data: Dict[str, Any], account_type: str = 'personal') -> SocialMediaConnection:
        """Create LinkedIn connection."""
        # Get or create LinkedIn platform
        platform, _ = SocialMediaPlatform.objects.get_or_create(
            name='linkedin',
            defaults={
                'display_name': 'LinkedIn',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'auth_url': 'https://www.linkedin.com/oauth/v2/authorization',
                'token_url': 'https://www.linkedin.com/oauth/v2/accessToken',
                'scope': 'r_liteprofile r_emailaddress w_member_social w_organization_social rw_organization_admin',
                'is_active': True
            }
        )
        
        # Extract account info based on type
        if account_type == 'personal':
            account_id = account_info.get('id', '')
            display_name = f"{account_info.get('firstName', '')} {account_info.get('lastName', '')}".strip()
            username = display_name
            profile_url = f"https://www.linkedin.com/in/{account_id}"
            # Use platform_username to store account type
            platform_username = f"personal:{username}"
        else:  # company
            account_id = account_info.get('id', '')
            display_name = account_info.get('localizedName', '')
            username = display_name
            profile_url = f"https://www.linkedin.com/company/{account_id}"
            # Use platform_username to store account type
            platform_username = f"company:{username}"
        
        # Create or update connection
        connection, _ = SocialMediaConnection.objects.update_or_create(
            user=user,
            platform=platform,
            platform_user_id=account_id,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': '',  # LinkedIn doesn't use refresh tokens
                'token_type': token_data.get('token_type', 'Bearer'),
                'platform_username': platform_username,  # Store type:name format
                'platform_display_name': display_name,
                'platform_profile_url': profile_url,
                'scope': token_data.get('scope', ''),
                'is_active': True,
                'is_verified': True
            }
        )
        
        # LinkedIn tokens are typically valid for 60 days
        if 'expires_in' in token_data:
            connection.expires_at = timezone.now() + timezone.timedelta(seconds=token_data['expires_in'])
            connection.save()
        
        return connection
    
    def _create_post(self, connection: SocialMediaConnection, text: str, **kwargs) -> Dict[str, Any]:
        """Create a post on LinkedIn using Posts API."""
        url = f"{self.api_base}/posts"
        headers = {
            'Authorization': f'Bearer {connection.access_token}',
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202501',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        # Determine if this is a personal profile or company page
        is_company_page = connection.platform_username.startswith('company:')
        
        # Build post data based on account type
        if is_company_page:
            # Company page post
            post_data = {
                "author": f"urn:li:organization:{connection.platform_user_id}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": text
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
        else:
            # Personal profile post
            post_data = {
                "author": f"urn:li:person:{connection.platform_user_id}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": text
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
        
        # Add media if provided
        media_url = kwargs.get('media_url')
        if media_url:
            post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
            post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                {
                    "status": "READY",
                    "media": media_url
                }
            ]
        
        # Add article link if provided
        link_url = kwargs.get('link_url')
        if link_url:
            post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "ARTICLE"
            post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["article"] = {
                "source": link_url,
                "title": kwargs.get('link_title', ''),
                "description": kwargs.get('link_description', '')
            }
        
        response = requests.post(url, headers=headers, json=post_data)
        response.raise_for_status()
        
        result = response.json()
        post_id = result.get('id', '')
        
        return {
            'platform': 'linkedin',
            'post_id': post_id,
            'post_url': f"https://www.linkedin.com/posts/{connection.platform_user_id}_{post_id}",
            'success': True
        }