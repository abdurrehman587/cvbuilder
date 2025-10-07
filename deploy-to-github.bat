@echo off
echo ========================================
echo    CV Builder - GitHub Deployment
echo ========================================
echo.

echo [1/4] Checking Git status...
git status

echo.
echo [2/4] Adding all files...
git add .

echo.
echo [3/4] Committing changes...
git commit -m "Deploy CV Builder to GitHub Pages - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Your application will be available at:
echo https://abdurrehman587.github.io/cvbuilder
echo.
echo Make sure to:
echo 1. Enable GitHub Pages in repository settings
echo 2. Configure Supabase for your domain
echo 3. Test the authentication flow
echo.
pause













