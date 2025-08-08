@echo off
REM Quick Start Script for Facebook Testing (Windows)
REM This script sets up the environment and runs tests

echo 🚀 Quick Start: Facebook Testing Setup
echo ======================================

REM Check if we're in the right directory
if not exist "manage.py" (
    echo ❌ Error: Please run this script from the backend directory (turbo/backend/)
    pause
    exit /b 1
)

REM Step 1: Check environment variables
echo 📋 Step 1: Checking environment variables...
if "%FACEBOOK_CLIENT_ID%"=="" (
    echo ❌ Missing FACEBOOK_CLIENT_ID environment variable
    echo Please set it in your environment or .env file
    pause
    exit /b 1
)
if "%FACEBOOK_CLIENT_SECRET%"=="" (
    echo ❌ Missing FACEBOOK_CLIENT_SECRET environment variable
    echo Please set it in your environment or .env file
    pause
    exit /b 1
)
if "%TOKEN_ENCRYPTION_KEY%"=="" (
    echo ❌ Missing TOKEN_ENCRYPTION_KEY environment variable
    echo Please set it in your environment or .env file
    pause
    exit /b 1
)
echo ✅ Environment variables are set

REM Step 2: Apply migrations
echo 📋 Step 2: Applying database migrations...
python manage.py makemigrations
python manage.py migrate
echo ✅ Migrations applied

REM Step 3: Run setup script
echo 📋 Step 3: Setting up Facebook platform and test data...
python setup_facebook_testing.py
echo ✅ Setup completed

REM Step 4: Check if Django server is running
echo 📋 Step 4: Checking if Django server is running...
curl -s http://localhost:8000/api/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Django server is running
) else (
    echo ⚠️  Django server is not running
    echo    Please start it with: python manage.py runserver
    echo    Then run this script again
    pause
    exit /b 1
)

REM Step 5: Run tests
echo 📋 Step 5: Running Facebook functionality tests...
python test_facebook_posting.py

echo.
echo 🎉 Setup and testing completed!
echo.
echo 📚 Next steps:
echo 1. Follow FACEBOOK_TESTING_GUIDE.md for detailed instructions
echo 2. Set up real Facebook OAuth credentials
echo 3. Test with real Facebook tokens
echo.
echo 🔗 Useful URLs:
echo - Django Admin: http://localhost:8000/admin/
echo - API Root: http://localhost:8000/api/
echo - Social Platforms: http://localhost:8000/api/social-platforms/
echo - Social Connections: http://localhost:8000/api/social-connections/

pause
