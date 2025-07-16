# CV Builder Troubleshooting Guide

## Issues You're Experiencing

### 1. Supabase 406 Errors
**Problem**: `Failed to load resource: the server responded with a status of 406 ()`

**Cause**: The Supabase API queries are failing due to incorrect query parameters or missing headers.

**Solution**: 
- ✅ Fixed in `src/paymentService.js` by changing `.single()` to `.maybeSingle()` for better error handling
- ✅ Added proper error handling for Supabase queries

### 2. PDF Generation 404 Errors (Development)
**Problem**: `Failed to load resource: the server responded with a status of 404 (Not Found)` for `/api/generate-pdf` and `/api/generate-pdf-simple`

**Cause**: API routes are not being served in development environment.

**Solution**:
- ✅ Added proxy configuration to `package.json` to forward API calls to Express server
- ✅ Integrated API routes into `server.js` for development
- ✅ Added proper CORS and body parsing middleware

### 3. PDF Generation 500 Errors - Chrome Binary Issue (Production)
**Problem**: `Could not find Chrome (ver. 138.0.7204.94). This can occur if either 1. you did not perform an installation before running the script or 2. your cache path is incorrectly configured`

**Cause**: Puppeteer can't find Chrome in Vercel's serverless environment.

**Solution**:
- ✅ Enhanced `api/generate-pdf.js` with correct Chrome executable path for Vercel
- ✅ Created `api/generate-pdf-simple.js` with multiple Chrome path fallbacks
- ✅ Added client-side PDF generation fallback in `src/Template4PDF.js`
- ✅ Updated Template4PDF to try multiple API endpoints

### 4. Port 3000 Conflicts
**Problem**: `Something is already running on port 3000`

**Cause**: Multiple processes trying to use the same port.

**Solution**:
- ✅ Added `concurrently` dependency to run both server and client
- ✅ Created startup scripts (`start-dev.bat` and `start-dev.ps1`)
- ✅ Updated `package.json` scripts for better port management

## How to Fix These Issues

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Environment
**Option A: Using the provided script (Recommended)**
```bash
# Windows Command Prompt
start-dev.bat

# Windows PowerShell
.\start-dev.ps1
```

**Option B: Manual start**
```bash
npm run dev
```

### Step 3: Test the APIs
1. Open your browser and go to: `http://localhost:3000/api-test`
2. Click "Run All Tests" to check if all APIs are working
3. This will test:
   - Health Check API
   - Supabase Connection
   - PDF Generation API

### Step 4: Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for any remaining errors
- The API test page will show detailed results

## Development vs Production

### Development Environment:
- **API Routes**: Served by Express server on port 5000
- **Proxy**: React app proxies API calls to Express server
- **PDF Generation**: Uses local Puppeteer installation
- **Fallback**: Client-side generation if server-side fails

### Production Environment (Vercel):
- **API Routes**: Served by Vercel serverless functions
- **PDF Generation**: Uses Vercel's Chrome binary
- **Fallback**: Client-side generation if server-side fails

## PDF Generation Solutions

### For Development (Local):
The Express server now handles all API routes:
- `/api/health` - Health check
- `/api/generate-pdf` - Main PDF generation
- `/api/generate-pdf-simple` - Simple PDF generation with Chrome path fallbacks

### For Production (Vercel):
1. **Primary**: Server-side API with Chrome binary detection
2. **Fallback**: Client-side PDF generation using html2canvas + jsPDF
3. **Multiple API endpoints**: Simple API tries different Chrome paths

### Chrome Binary Paths Tried:
- `/usr/bin/google-chrome-stable` (Vercel default)
- `/usr/bin/chromium-browser`
- `/usr/bin/chromium`
- `/snap/bin/chromium`
- macOS and Windows paths

## API Test Page

The API test page (`/api-test`) will help you:
- Verify all APIs are working correctly
- Get detailed error messages if something fails
- Test PDF generation with a simple HTML template
- Check Supabase connectivity

## Common Solutions

### If Supabase 406 errors persist:
1. Check your Supabase project settings
2. Verify the API keys in `src/supabase.js`
3. Check if the `payments` table exists and has the correct structure

### If API 404 errors persist in development:
1. **Check if Express server is running**: Look for "PDF server running on port 5000" in console
2. **Check proxy configuration**: Verify `"proxy": "http://localhost:5000"` in package.json
3. **Restart development environment**: Use `npm run dev` or the startup scripts
4. **Check port conflicts**: Make sure port 5000 is not in use

### If PDF generation still fails:
1. **Check the API test page** - it will show which method works
2. **Client-side fallback** - Template4PDF now has automatic fallback
3. **Multiple API endpoints** - tries simple API first, then main API
4. **Check Vercel deployment logs** for serverless function errors

### If port conflicts continue:
1. Use the provided startup scripts
2. Manually kill processes using the ports:
   ```bash
   # Find processes using port 3000
   netstat -ano | findstr :3000
   
   # Kill the process (replace PID with actual process ID)
   taskkill /f /pid PID
   ```

## Production Deployment

For the live site, the fixes include:
1. **Multiple Chrome binary detection** in API routes
2. **Client-side fallback** for PDF generation
3. **Enhanced error handling** with detailed messages
4. **Multiple API endpoint attempts**

## Debugging Tips

1. **Use the API test page** (`/api-test`) to isolate issues
2. **Check browser console** for detailed error messages
3. **Use the health check API** (`/api/health`) to verify services
4. **Clear browser cache** if you're testing on the live site
5. **Check network tab** in Developer Tools to see actual API calls
6. **Look for fallback messages** - Template4PDF will show when it switches to client-side generation
7. **Check server logs** - Express server shows detailed API request logs

## File Changes Made

- ✅ `src/paymentService.js` - Fixed Supabase query handling
- ✅ `package.json` - Added proxy configuration for development
- ✅ `server.js` - Integrated API routes for development environment
- ✅ `api/generate-pdf.js` - Enhanced for Vercel serverless with Chrome path
- ✅ `api/generate-pdf-simple.js` - New API with multiple Chrome path fallbacks
- ✅ `src/Template4PDF.js` - Added client-side PDF generation fallback
- ✅ `api/health.js` - Added comprehensive health check
- ✅ `src/APITest.js` - Created API testing interface
- ✅ `src/App.js` - Added API test route
- ✅ `package.json` - Added concurrently and new scripts
- ✅ `start-dev.bat` - Windows startup script
- ✅ `start-dev.ps1` - PowerShell startup script

## PDF Generation Flow

1. **Template4PDF tries simple API first** (`/api/generate-pdf-simple`)
2. **If that fails, tries main API** (`/api/generate-pdf`)
3. **If both fail, uses client-side generation** (html2canvas + jsPDF)
4. **User gets PDF regardless** of which method works

## Development Environment Setup

The development environment now properly handles API routing:

1. **Express server** runs on port 5000 and handles all API routes
2. **React app** runs on port 3000 and proxies API calls to Express server
3. **Concurrently** runs both servers simultaneously
4. **Proxy configuration** forwards `/api/*` requests to Express server

## Next Steps

1. Run the startup script to avoid port conflicts
2. Test the APIs using the test page
3. Try downloading Template 4 PDF - it should work with the fallback
4. Check if the issues are resolved
5. If problems persist, check the detailed error messages from the test page

The PDF generation now has multiple fallback mechanisms and proper development environment setup, so it should work reliably in both development and production environments. 