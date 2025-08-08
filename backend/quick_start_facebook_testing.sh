#!/bin/bash

# Quick Start Script for Facebook Testing
# This script sets up the environment and runs tests

echo "🚀 Quick Start: Facebook Testing Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: Please run this script from the backend directory (turbo/backend/)"
    exit 1
fi

# Step 1: Check environment variables
echo "📋 Step 1: Checking environment variables..."
if [ -z "$FACEBOOK_CLIENT_ID" ] || [ -z "$FACEBOOK_CLIENT_SECRET" ] || [ -z "$TOKEN_ENCRYPTION_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - FACEBOOK_CLIENT_ID"
    echo "   - FACEBOOK_CLIENT_SECRET" 
    echo "   - TOKEN_ENCRYPTION_KEY"
    echo ""
    echo "Please set these in your .env file or export them:"
    echo "export FACEBOOK_CLIENT_ID='your_app_id'"
    echo "export FACEBOOK_CLIENT_SECRET='your_app_secret'"
    echo "export TOKEN_ENCRYPTION_KEY='your_32_char_key'"
    exit 1
fi
echo "✅ Environment variables are set"

# Step 2: Apply migrations
echo "📋 Step 2: Applying database migrations..."
python manage.py makemigrations
python manage.py migrate
echo "✅ Migrations applied"

# Step 3: Run setup script
echo "📋 Step 3: Setting up Facebook platform and test data..."
python setup_facebook_testing.py
echo "✅ Setup completed"

# Step 4: Check if Django server is running
echo "📋 Step 4: Checking if Django server is running..."
if curl -s http://localhost:8000/api/ > /dev/null; then
    echo "✅ Django server is running"
else
    echo "⚠️  Django server is not running"
    echo "   Please start it with: python manage.py runserver"
    echo "   Then run this script again"
    exit 1
fi

# Step 5: Run tests
echo "📋 Step 5: Running Facebook functionality tests..."
python test_facebook_posting.py

echo ""
echo "🎉 Setup and testing completed!"
echo ""
echo "📚 Next steps:"
echo "1. Follow FACEBOOK_TESTING_GUIDE.md for detailed instructions"
echo "2. Set up real Facebook OAuth credentials"
echo "3. Test with real Facebook tokens"
echo ""
echo "🔗 Useful URLs:"
echo "- Django Admin: http://localhost:8000/admin/"
echo "- API Root: http://localhost:8000/api/"
echo "- Social Platforms: http://localhost:8000/api/social-platforms/"
echo "- Social Connections: http://localhost:8000/api/social-connections/"
