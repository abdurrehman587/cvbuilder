@echo off
echo ========================================
echo URGENT BACKEND DEPLOYMENT
echo ========================================
echo.

echo Step 1: Installing Vercel CLI...
npm install -g vercel@latest

echo.
echo Step 2: Logging into Vercel...
echo Please complete authentication in browser
vercel login

echo.
echo Step 3: Deploying backend...
vercel --prod --yes

echo.
echo Step 4: Getting deployment URL...
vercel ls

echo.
echo ========================================
echo BACKEND DEPLOYED!
echo ========================================
echo.
echo Copy the URL above and update frontend
echo.
pause

