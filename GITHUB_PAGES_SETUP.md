# GitHub Pages Setup Guide

This guide will help you deploy your CV Builder application to GitHub Pages.

## 🚀 Quick Setup

### 1. Repository Setup
Your repository is already set up at: [https://github.com/abdurrehman587/cvbuilder](https://github.com/abdurrehman587/cvbuilder)

### 2. Enable GitHub Pages
1. Go to your repository settings
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Click "Save"

### 3. Configure Supabase for Production

#### Update Supabase Settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Add your GitHub Pages URL to "Site URL":
   ```
   https://abdurrehman587.github.io/cvbuilder
   ```
4. Add to "Redirect URLs":
   ```
   https://abdurrehman587.github.io/cvbuilder/frontend/auth.html
   https://abdurrehman587.github.io/cvbuilder/
   ```

### 4. Deploy Your Code

```bash
# Clone your repository
git clone https://github.com/abdurrehman587/cvbuilder.git
cd cvbuilder

# Copy your local files to the repository
# (Copy all files from C:\Users\GLORY\myapp\ to the cvbuilder folder)

# Add and commit changes
git add .
git commit -m "Deploy CV Builder to GitHub Pages"

# Push to GitHub
git push origin main
```

## 🔧 Configuration Files

### Required Files for GitHub Pages:
- `index.html` - Main landing page
- `frontend/` - Application files
- `.github/workflows/deploy.yml` - Deployment workflow
- `README.md` - Project documentation

### Supabase Configuration:
- Update `frontend/js/supabase-config.js` with your production credentials
- Ensure CORS is configured for your GitHub Pages domain

## 🌐 Access Your Application

Once deployed, your application will be available at:
**https://abdurrehman587.github.io/cvbuilder**

## 🔐 Authentication Flow

### For Production:
1. **Signup**: Users can create accounts with email/password
2. **Email Confirmation**: Enable in Supabase settings
3. **Signin**: Standard Supabase authentication
4. **Fallback**: localStorage for development/testing

### For Development:
1. **Email Confirmation**: Bypassed for easier testing
2. **localStorage Fallback**: Available if Supabase fails
3. **Dynamic Tables**: Created automatically for shopkeepers

## 🛠️ Troubleshooting

### Common Issues:
1. **CORS Errors**: Update Supabase site URL and redirect URLs
2. **404 Errors**: Ensure all file paths are correct
3. **Authentication Fails**: Check Supabase configuration
4. **Dynamic Tables Not Working**: Run the SQL setup script

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase connection
3. Test authentication flow
4. Check network requests

## 📝 Environment Variables

For production, you can set these in GitHub Secrets:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## 🎯 Features Ready for Production

- ✅ Multi-role authentication (Users, Shopkeepers, Admins)
- ✅ Dynamic table creation for shopkeepers
- ✅ Email confirmation (configurable)
- ✅ localStorage fallback for development
- ✅ Responsive design
- ✅ Modern JavaScript (ES6+)
- ✅ Supabase integration

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review browser console logs
3. Verify Supabase configuration
4. Test locally first

---

**Your CV Builder is now ready for production! 🎉**











