# Facebook Text Posting Testing Guide

This guide will walk you through testing the Facebook OAuth and text posting functionality in your Django/Next.js application.

## Prerequisites

1. **Facebook Developer Account**: You need a Facebook Developer account
2. **Facebook App**: A Facebook app with proper permissions
3. **Environment Setup**: Your Django backend and Next.js frontend running
4. **Database**: PostgreSQL or SQLite with migrations applied

## Step 1: Facebook App Setup

### 1.1 Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Consumer" → "Next"
3. Fill in app details:
   - App Name: `Your App Name`
   - App Contact Email: Your email
   - App Purpose: Select appropriate purpose
4. Click "Create App"

### 1.2 Configure Facebook Login
1. In your app dashboard, go to "Add Product" → "Facebook Login"
2. Choose "Web" platform
3. Enter your site URL: `http://localhost:3000` (for development)
4. Save and continue

### 1.3 Configure OAuth Settings
1. Go to "Facebook Login" → "Settings"
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:8000/api/social/oauth/callback/`
   - `http://localhost:3000/api/auth/callback/facebook`
3. Save changes

### 1.4 Get App Credentials
1. Go to "Settings" → "Basic"
2. Note down:
   - App ID (Client ID)
   - App Secret (Client Secret)
3. Go to "Facebook Login" → "Settings"
4. Note the OAuth redirect URI

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables
Create/update your `.env` file in `turbo/backend/`:

```bash
# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_AUTH_URL=https://www.facebook.com/v18.0/dialog/oauth
FACEBOOK_TOKEN_URL=https://graph.facebook.com/v18.0/oauth/access_token
FACEBOOK_SCOPE=email,public_profile,publish_actions

# Token Encryption
TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/elevate_db

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
```

### 2.2 Frontend Environment Variables
Create/update your `.env.local` file in `turbo/frontend/`:

```bash
# Facebook OAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

## Step 3: Database Setup

### 3.1 Apply Migrations
```bash
cd turbo/backend
python manage.py makemigrations
python manage.py migrate
```

### 3.2 Create Facebook Platform Record
Run Django shell to create the Facebook platform:

```bash
cd turbo/backend
python manage.py shell
```

```python
from api.models import SocialMediaPlatform
from django.conf import settings

# Create Facebook platform
facebook_platform = SocialMediaPlatform.objects.create(
    name='facebook',
    display_name='Facebook',
    client_id=settings.SOCIAL_MEDIA_PLATFORMS['facebook']['client_id'],
    client_secret=settings.SOCIAL_MEDIA_PLATFORMS['facebook']['client_secret'],
    auth_url=settings.SOCIAL_MEDIA_PLATFORMS['facebook']['auth_url'],
    token_url=settings.SOCIAL_MEDIA_PLATFORMS['facebook']['token_url'],
    scope=settings.SOCIAL_MEDIA_PLATFORMS['facebook']['scope'],
    is_active=True
)

print(f"Created Facebook platform: {facebook_platform}")
exit()
```

## Step 4: Start Services

### 4.1 Start Backend
```bash
cd turbo/backend
python manage.py runserver
```

### 4.2 Start Frontend
```bash
cd turbo/frontend
npm run dev
```

### 4.3 Start Redis (for Celery)
```bash
# On Windows (if using WSL or Docker)
docker run -d -p 6379:6379 redis:alpine

# On macOS
brew services start redis

# On Linux
sudo systemctl start redis
```

### 4.4 Start Celery Worker
```bash
cd turbo/backend
celery -A api worker --loglevel=info
```

### 4.5 Start Celery Beat (for scheduled tasks)
```bash
cd turbo/backend
celery -A api beat --loglevel=info
```

## Step 5: Testing OAuth Flow

### 5.1 Test OAuth Authorization URL
Make a GET request to get the Facebook OAuth URL:

```bash
curl -X GET "http://localhost:8000/api/social-platforms/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "name": "facebook",
      "display_name": "Facebook",
      "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
      "scope": "email,public_profile,publish_actions",
      "is_active": true
    }
  ]
}
```

### 5.2 Test OAuth Callback
Simulate the OAuth callback with an authorization code:

```bash
curl -X POST "http://localhost:8000/api/social/oauth/callback/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "facebook",
    "code": "AUTHORIZATION_CODE_FROM_FACEBOOK"
  }'
```

**Note**: You'll need to get a real authorization code by:
1. Opening: `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=http://localhost:8000/api/social/oauth/callback/&scope=email,public_profile,publish_actions&response_type=code`
2. Authorizing the app
3. Copying the `code` parameter from the redirect URL

## Step 6: Testing Facebook Text Posting

### 6.1 Test Immediate Posting
Once you have a valid Facebook connection, test posting:

```bash
curl -X POST "http://localhost:8000/api/social/posts/post-now/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Hello from my Django app! This is a test post.",
    "platform_names": ["facebook"]
  }'
```

Expected response:
```json
{
  "success": true,
  "posts": [
    {
      "platform": "facebook",
      "success": true,
      "post_id": "123456789_987654321",
      "post_url": "https://facebook.com/123456789_987654321",
      "message": "Post published successfully"
    }
  ]
}
```

### 6.2 Test Scheduled Posting
Test scheduling a post for later:

```bash
curl -X POST "http://localhost:8000/api/social-posts/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "This is a scheduled post from my Django app!",
    "platform_names": ["facebook"],
    "scheduled_at": "2024-01-15T10:00:00Z"
  }'
```

### 6.3 Test Post Templates
Create and use a post template:

```bash
# Create template
curl -X POST "http://localhost:8000/api/social-templates/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Template",
    "description": "A test template for Facebook",
    "text_template": "Hello from {{user.username}}! This is a template post.",
    "platform_names": ["facebook"]
  }'

# Use template
curl -X POST "http://localhost:8000/api/social-templates/1/use-template/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform_names": ["facebook"]
  }'
```

## Step 7: Testing Token Management

### 7.1 Test Token Refresh
Manually trigger token refresh:

```bash
curl -X POST "http://localhost:8000/api/social-connections/1/refresh-token/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7.2 Test Connection Validation
Validate a connection:

```bash
curl -X POST "http://localhost:8000/api/social-connections/1/validate/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 8: Testing Background Tasks

### 8.1 Test Token Refresh Task
The system automatically refreshes tokens. Check logs:

```bash
# Check Celery worker logs for token refresh activity
tail -f celery.log
```

### 8.2 Test Scheduled Post Processing
Schedule a post and wait for it to be processed:

```bash
# Schedule a post for 2 minutes from now
curl -X POST "http://localhost:8000/api/social-posts/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "This post will be sent automatically!",
    "platform_names": ["facebook"],
    "scheduled_at": "2024-01-15T10:02:00Z"
  }'
```

## Step 9: Frontend Integration Testing

### 9.1 Test OAuth Flow in Frontend
1. Navigate to your frontend app
2. Go to social media connections page
3. Click "Connect Facebook"
4. Complete OAuth flow
5. Verify connection is established

### 9.2 Test Posting from Frontend
1. Go to posting interface
2. Enter text content
3. Select Facebook platform
4. Click "Post Now"
5. Verify post appears on Facebook

## Step 10: Error Handling Testing

### 10.1 Test Invalid Token
```bash
# Try posting with expired/invalid token
curl -X POST "http://localhost:8000/api/social/posts/post-now/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "This should fail with invalid token",
    "platform_names": ["facebook"]
  }'
```

### 10.2 Test Network Errors
Temporarily disable internet and test posting to see error handling.

## Troubleshooting

### Common Issues

1. **OAuth Error**: Check redirect URIs in Facebook app settings
2. **Token Refresh Fails**: Verify app permissions include `publish_actions`
3. **Posts Not Appearing**: Check Facebook app review status
4. **Celery Tasks Not Running**: Verify Redis is running and accessible

### Debug Commands

```bash
# Check Django logs
tail -f turbo/backend/django.log

# Check Celery logs
tail -f turbo/backend/celery.log

# Check database connections
python manage.py dbshell

# Test Facebook API directly
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
```

### Facebook App Review

For production use, your Facebook app needs to go through review for:
- `publish_actions` permission
- `user_posts` permission

During development, you can test with your own account and up to 25 test users.

## Security Considerations

1. **Token Encryption**: All tokens are encrypted using Fernet
2. **HTTPS**: Use HTTPS in production
3. **App Secret**: Never expose app secret in frontend
4. **Token Rotation**: Implement token rotation for production
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Next Steps

1. Implement error retry logic
2. Add analytics and monitoring
3. Implement multi-platform posting
4. Add content scheduling UI
5. Implement post analytics
6. Add content moderation features
