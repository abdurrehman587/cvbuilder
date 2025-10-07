@echo off
echo ========================================
echo CV Builder Backend Deployment Script
echo ========================================
echo.

echo Step 1: Checking Vercel CLI...
vercel --version
if %errorlevel% neq 0 (
    echo ERROR: Vercel CLI not found. Please install it first.
    echo Run: npm install -g vercel
    pause
    exit /b 1
)

echo.
echo Step 2: Logging into Vercel...
echo Please complete the authentication in your browser when prompted.
vercel login

echo.
echo Step 3: Deploying to Vercel...
vercel --prod --yes

echo.
echo Step 4: Getting deployment URL...
vercel ls

echo.
echo ========================================
echo Deployment completed!
echo ========================================
echo.
echo Your backend should now be available at the URL shown above.
echo Please update the frontend with the new backend URL.
echo.
pause

