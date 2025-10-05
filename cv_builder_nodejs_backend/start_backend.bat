@echo off
echo Starting CV Builder Node.js Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Please run this script from the cv_builder_nodejs_backend directory
    pause
    exit /b 1
)

echo Installing dependencies...
npm install

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Testing PDF generation first...
node test_pdf.js

if errorlevel 1 (
    echo ERROR: PDF generation test failed
    pause
    exit /b 1
)

echo.
echo PDF generation test successful!
echo.
echo Starting Node.js server...
echo.
echo Server will be available at: http://localhost:3000
echo PDF endpoint: POST http://localhost:3000/api/pdf/generate
echo Health check: GET http://localhost:3000/up
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js
