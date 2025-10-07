@echo off
echo ========================================
echo QUICK BACKEND DEPLOYMENT
echo ========================================
echo.

echo Step 1: Installing Vercel CLI globally...
npm install -g vercel

echo.
echo Step 2: Logging into Vercel...
echo Please complete authentication in browser when prompted
vercel login

echo.
echo Step 3: Deploying backend with CORS fixes...
vercel --prod --yes

echo.
echo Step 4: Getting deployment URL...
vercel ls

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your backend is now deployed with CORS fixes.
echo Copy the URL and update the frontend configuration.
echo.
pause

