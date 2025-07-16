@echo off
echo Starting CV Builder Development Environment...
echo.

echo Checking if port 3000 is in use...
netstat -ano | findstr :3000
if %errorlevel% equ 0 (
    echo Port 3000 is in use. Stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /f /pid %%a 2>nul
    )
)

echo Checking if port 5000 is in use...
netstat -ano | findstr :5000
if %errorlevel% equ 0 (
    echo Port 5000 is in use. Stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        taskkill /f /pid %%a 2>nul
    )
)

echo.
echo Starting development environment...
echo This will start both the React app (port 3000) and the PDF server (port 5000)
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev 