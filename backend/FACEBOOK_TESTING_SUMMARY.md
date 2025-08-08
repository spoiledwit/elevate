# Facebook Text Posting Testing - Quick Start Guide

This document provides a quick overview of how to test the Facebook OAuth and text posting functionality in your Django/Next.js application.

## 📁 Files Created for Testing

1. **`FACEBOOK_TESTING_GUIDE.md`** - Comprehensive testing guide with step-by-step instructions
2. **`setup_facebook_testing.py`** - Python script to initialize Facebook platform and test data
3. **`test_facebook_posting.py`** - Python script to test all Facebook API endpoints
4. **`quick_start_facebook_testing.sh`** - Bash script for Unix/Linux/macOS users
5. **`quick_start_facebook_testing.bat`** - Batch script for Windows users

## 🚀 Quick Start (3 Steps)

### Step 1: Set Environment Variables
Create a `.env` file in `turbo/backend/` with:

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

### Step 2: Run Quick Start Script

**On Windows:**
```bash
cd turbo/backend
quick_start_facebook_testing.bat
```

**On Unix/Linux/macOS:**
```bash
cd turbo/backend
chmod +x quick_start_facebook_testing.sh
./quick_start_facebook_testing.sh
```

### Step 3: Start Services
```bash
# Terminal 1: Django server
cd turbo/backend
python manage.py runserver

# Terminal 2: Redis (if not using Docker)
redis-server

# Terminal 3: Celery worker
cd turbo/backend
celery -A api worker --loglevel=info

# Terminal 4: Celery beat (for scheduled tasks)
cd turbo/backend
celery -A api beat --loglevel=info
```

## 🧪 What the Tests Cover

The test scripts will verify:

1. **Platform Management**
   - ✅ List available social media platforms
   - ✅ Facebook platform configuration

2. **OAuth Flow**
   - ✅ OAuth callback endpoint (with dummy code)
   - ✅ Connection creation and management

3. **Posting Functionality**
   - ✅ Immediate text posting
   - ✅ Scheduled posting
   - ✅ Post templates

4. **Connection Management**
   - ✅ List user connections
   - ✅ Connection validation
   - ✅ Token refresh

## 📊 Expected Test Results

### ✅ Successful Tests
- Platform listing
- Connection management
- API endpoint availability
- Database operations

### ⚠️ Expected Failures (Normal)
- OAuth callback with dummy code
- Posting without real Facebook tokens
- Token refresh without valid tokens

These failures are expected and indicate the system is working correctly - it's rejecting invalid credentials as it should.

## 🔧 Manual Testing Steps

### 1. Test API Endpoints
```bash
# Get platforms
curl -X GET "http://localhost:8000/api/social-platforms/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get connections
curl -X GET "http://localhost:8000/api/social-connections/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test posting (will fail without real tokens)
curl -X POST "http://localhost:8000/api/social/posts/post-now/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "Test post", "platform_names": ["facebook"]}'
```

### 2. Check Django Admin
Visit `http://localhost:8000/admin/` to see:
- Social Media Platforms
- Social Media Connections
- Social Media Posts
- Social Media Post Templates

### 3. Monitor Celery Tasks
Check Celery logs for:
- Token refresh attempts
- Scheduled post processing
- Error handling

## 🔑 Getting Real Facebook Tokens

To test with real Facebook tokens:

1. **Create Facebook App** (see `FACEBOOK_TESTING_GUIDE.md` for details)
2. **Get Authorization Code**:
   ```
   https://www.facebook.com/v18.0/dialog/oauth?
   client_id=YOUR_APP_ID&
   redirect_uri=http://localhost:8000/api/social/oauth/callback/&
   scope=email,public_profile,publish_actions&
   response_type=code
   ```
3. **Exchange Code for Token**:
   ```bash
   curl -X POST "http://localhost:8000/api/social/oauth/callback/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"platform": "facebook", "code": "REAL_AUTH_CODE"}'
   ```

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Run: `pip install -r requirements.txt` or `uv sync`

2. **Database errors**
   - Run: `python manage.py migrate`

3. **Celery connection errors**
   - Start Redis: `docker run -d -p 6379:6379 redis:alpine`

4. **OAuth errors**
   - Check redirect URIs in Facebook app settings
   - Verify app permissions

### Debug Commands

```bash
# Check Django logs
tail -f turbo/backend/django.log

# Check Celery logs
tail -f turbo/backend/celery.log

# Test database
python manage.py dbshell

# Check environment
python -c "import os; print('FB_ID:', os.getenv('FACEBOOK_CLIENT_ID'))"
```

## 📚 Next Steps

1. **Read the full guide**: `FACEBOOK_TESTING_GUIDE.md`
2. **Set up real Facebook app**: Follow Facebook Developer documentation
3. **Test with real tokens**: Complete OAuth flow with real credentials
4. **Implement frontend**: Connect Next.js frontend to the APIs
5. **Add error handling**: Implement retry logic and user notifications
6. **Production deployment**: Configure for production environment

## 🎯 Success Criteria

You'll know the system is working when:

- ✅ All API endpoints return proper responses
- ✅ Database tables are created and populated
- ✅ Celery tasks are running without errors
- ✅ OAuth flow processes authorization codes
- ✅ Posting attempts are logged (even if they fail due to invalid tokens)
- ✅ Token refresh logic is triggered
- ✅ Scheduled posts are created in the database

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the detailed guide in `FACEBOOK_TESTING_GUIDE.md`
3. Check Django and Celery logs for error messages
4. Verify all environment variables are set correctly
5. Ensure all services (Django, Redis, Celery) are running

The system is designed to be robust and provide clear error messages to help with debugging.
