@echo off
echo Deploying CV Builder Backend to Vercel...
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo Installing Vercel CLI...
    npm install -g vercel
)

echo.
echo Starting Vercel deployment...
echo.

REM Deploy to Vercel
vercel --prod --yes

echo.
echo Deployment complete!
echo.
echo Your backend will be available at a URL like:
echo https://cv-builder-backend-abc123.vercel.app
echo.
echo Copy this URL and update the frontend code.
echo.
pause

