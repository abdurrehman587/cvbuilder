# Vercel Deployment Guide

## Prerequisites
- GitHub repository with your code
- Vercel account
- Supabase project configured

## Step 1: Environment Variables Setup

In your Vercel dashboard, add these environment variables:

### Supabase Configuration
```
REACT_APP_SUPABASE_URL=https://poqarsztryrdlliwjhgx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4
```

### JazzCash Configuration (Optional - for payment functionality)
```
REACT_APP_JAZZCASH_MERCHANT_ID=your_merchant_id
REACT_APP_JAZZCASH_PASSWORD=your_password
REACT_APP_JAZZCASH_RETURN_URL=https://your-vercel-domain.vercel.app/payment-success
REACT_APP_JAZZCASH_CANCEL_URL=https://your-vercel-domain.vercel.app/payment-cancelled
REACT_APP_JAZZCASH_API_URL=https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction
```

## Step 2: Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Add your Vercel domain to the allowed origins:
   - Add: `https://your-vercel-domain.vercel.app`
   - Add: `https://your-vercel-domain.vercel.app/auth/callback`

## Step 3: Google OAuth Setup (if using)

1. Go to Google Cloud Console
2. Add your Vercel domain to authorized origins
3. Add your Vercel callback URL to authorized redirect URIs:
   - `https://your-vercel-domain.vercel.app/auth/callback`

## Step 4: Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set the following build settings:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

## Step 5: Common Issues and Solutions

### Issue 1: Build Fails
- Check that all dependencies are in package.json
- Ensure Node.js version is compatible (use Node.js 18+)

### Issue 2: Authentication Not Working
- Verify Supabase environment variables are set correctly
- Check that your Vercel domain is added to Supabase allowed origins
- Ensure Google OAuth redirect URIs are configured correctly

### Issue 3: Static Assets Not Loading
- Check that all image files are in the public folder
- Verify file paths are correct

### Issue 4: Routing Issues
- The vercel.json file should handle client-side routing
- Ensure all routes redirect to index.html

### Issue 5: Database Connection Issues
- Verify Supabase RLS policies are configured correctly
- Check that the database table exists and has proper permissions

## Step 6: Testing After Deployment

1. Test user registration and login
2. Test CV template selection
3. Test form functionality
4. Test PDF generation
5. Test payment flow (if applicable)
6. Test admin panel access

## Troubleshooting

### Check Vercel Logs
1. Go to your Vercel dashboard
2. Click on your project
3. Go to Functions tab to see server logs
4. Check the Build logs for any errors

### Common Error Messages

**404 Not Found**: Check vercel.json configuration
**Authentication Error**: Verify Supabase configuration
**Build Error**: Check package.json and dependencies
**CORS Error**: Add domain to Supabase allowed origins

## Support

If you continue to have issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test locally with production build
4. Check browser console for client-side errors 