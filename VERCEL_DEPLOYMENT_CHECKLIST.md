# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All files are committed to GitHub
- [ ] Build works locally (`npm run build`)
- [ ] No critical errors in console
- [ ] All dependencies are in package.json

### 2. Environment Variables (Set in Vercel Dashboard)
- [ ] `REACT_APP_SUPABASE_URL` = https://poqarsztryrdlliwjhgx.supabase.co
- [ ] `REACT_APP_SUPABASE_ANON_KEY` = your-anon-key
- [ ] `REACT_APP_JAZZCASH_MERCHANT_ID` = your-merchant-id (if using payments)
- [ ] `REACT_APP_JAZZCASH_PASSWORD` = your-password (if using payments)
- [ ] `REACT_APP_JAZZCASH_RETURN_URL` = https://your-domain.vercel.app/payment-success
- [ ] `REACT_APP_JAZZCASH_CANCEL_URL` = https://your-domain.vercel.app/payment-cancelled

### 3. Supabase Configuration
- [ ] Go to Supabase Dashboard > Settings > API
- [ ] Add your Vercel domain to "Additional Allowed Origins":
  - `https://your-domain.vercel.app`
  - `https://your-domain.vercel.app/auth/callback`

### 4. Google OAuth (if using)
- [ ] Go to Google Cloud Console
- [ ] Add Vercel domain to "Authorized JavaScript origins"
- [ ] Add callback URL to "Authorized redirect URIs":
  - `https://your-domain.vercel.app/auth/callback`

## 🚀 Deployment Steps

### 1. Connect to Vercel
- [ ] Go to vercel.com and sign in
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Select the repository

### 2. Configure Build Settings
- [ ] Framework Preset: Create React App
- [ ] Root Directory: `./` (leave empty)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] Install Command: `npm install`

### 3. Add Environment Variables
- [ ] Add all environment variables listed above
- [ ] Make sure to use your actual Vercel domain in URLs

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Check for any build errors

## 🔍 Post-Deployment Testing

### 1. Basic Functionality
- [ ] Website loads without errors
- [ ] No console errors in browser
- [ ] All images and assets load correctly

### 2. Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth works (if configured)
- [ ] Sign out works

### 3. Core Features
- [ ] Template selection works
- [ ] Form fills out correctly
- [ ] Live preview updates
- [ ] PDF generation works
- [ ] Admin panel access works

### 4. Payment (if applicable)
- [ ] Payment modal opens
- [ ] JazzCash integration works
- [ ] Payment success/failure handling

## 🐛 Common Issues & Solutions

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Authentication Not Working
- Verify environment variables are set correctly
- Check Supabase allowed origins
- Ensure Google OAuth redirect URIs are correct

### 404 Errors
- Check vercel.json configuration
- Ensure all routes redirect to index.html

### CORS Errors
- Add your Vercel domain to Supabase allowed origins
- Check browser console for specific CORS messages

### Static Assets Not Loading
- Verify all files are in the public folder
- Check file paths are correct
- Ensure files are committed to GitHub

## 📞 Getting Help

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test locally with production build
5. Check Supabase logs for database issues 