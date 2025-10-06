# Manual Backend Deployment Fix

## 🚨 **Current Issue**
The backend is experiencing CORS issues and needs to be redeployed with the updated configuration.

## 🔧 **What I've Fixed**
1. **Enhanced CORS Configuration**: Added explicit origins including your frontend URL
2. **Better Error Handling**: Improved health check endpoint with detailed logging  
3. **Preflight Request Handling**: Added proper OPTIONS request handling
4. **Credentials Support**: Enabled credentials for cross-origin requests

## 📋 **Manual Deployment Steps**

### Option 1: Use the Deployment Script
1. **Run the deployment script**:
   ```bash
   cd cv_builder_nodejs_backend
   deploy_fixed_backend.bat
   ```

### Option 2: Manual Vercel Deployment
1. **Navigate to the backend directory**:
   ```bash
   cd cv_builder_nodejs_backend
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```
   - Complete authentication in your browser

3. **Deploy to production**:
   ```bash
   vercel --prod --yes
   ```

4. **Get the deployment URL**:
   ```bash
   vercel ls
   ```

### Option 3: Vercel Dashboard Deployment
1. **Go to**: https://vercel.com/dashboard
2. **Find your project**: `cvbuilder` or similar
3. **Click "Deploy"** or **"Redeploy"**
4. **Copy the new URL** when deployment completes

## 🔄 **Update Frontend Configuration**

Once you have the new backend URL, update the frontend:

1. **Open**: `frontend/js/cv-builder.js`
2. **Find**: `generateBackendPDF` method (around line 2950)
3. **Update**: Replace the old URL with the new one:
   ```javascript
   const backendUrl = 'https://your-new-backend-url.vercel.app';
   ```

## ✅ **Test the Backend**

After deployment, test the backend:

1. **Health Check**: Visit `https://your-backend-url.vercel.app/up`
2. **Should return**: `{"status":"OK","timestamp":"...","server":"CV Builder PDF Server"}`

## 🎯 **Expected Results**

After successful deployment:
- ✅ **CORS errors should be resolved**
- ✅ **Backend health check should work**
- ✅ **PDF generation should use backend instead of frontend fallback**
- ✅ **Faster PDF generation with better quality**

## 🆘 **If Issues Persist**

If you still get CORS errors:
1. **Check the backend URL** is correct
2. **Verify the deployment** is successful
3. **Clear browser cache** and try again
4. **Check browser console** for specific error messages

## 📞 **Support**

The frontend PDF generation is working perfectly as a fallback, so your CV Builder is fully functional even if the backend has issues.
