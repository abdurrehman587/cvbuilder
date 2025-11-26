# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your CV Builder application using Supabase.

## Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### 1.2 Create or Select a Project
1. Click on the project dropdown at the top
2. Click **"New Project"** (or select an existing project)
3. Enter a project name (e.g., "CV Builder")
4. Click **"Create"**

### 1.3 Enable Google+ API
1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** or **"Google Identity Services API"**
3. Click on it and click **"Enable"**

### 1.4 Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

### 1.5 Configure OAuth Consent Screen (First Time Only)
If this is your first time, you'll need to configure the consent screen:
1. Click **"Configure Consent Screen"**
2. Choose **"External"** (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: CV Builder (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **"Save and Continue"**
5. Skip scopes (click **"Save and Continue"**)
6. Add test users if needed (click **"Save and Continue"**)
7. Review and click **"Back to Dashboard"**

### 1.6 Create OAuth Client ID
1. Go back to **"Credentials"** > **"Create Credentials"** > **"OAuth client ID"**
2. Select **"Web application"** as the application type
3. Give it a name (e.g., "CV Builder Web Client")
4. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://your-production-domain.com` (for production)
5. Add **Authorized redirect URIs**:
   - `https://ctygupgtlawlgcikmkqz.supabase.co/auth/v1/callback`
   - (Replace with your Supabase project URL if different)
6. Click **"Create"**

### 1.7 Copy Your Credentials
After creating, you'll see a popup with:
- **Client ID**: Copy this (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret**: Copy this (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**⚠️ Important**: Keep these credentials secure and never commit them to version control!

## Step 2: Configure Google OAuth in Supabase

### 2.1 Go to Supabase Dashboard
1. Visit [Supabase Dashboard](https://app.supabase.com/)
2. Sign in and select your project

### 2.2 Navigate to Authentication Settings
1. In the left sidebar, click **"Authentication"**
2. Click on **"Providers"** tab
3. Find **"Google"** in the list

### 2.3 Enable and Configure Google Provider
1. Toggle **"Enable Google provider"** to ON
2. Enter your **Client ID** (from Step 1.7)
3. Enter your **Client Secret** (from Step 1.7)
4. Click **"Save"**

### 2.4 Configure Redirect URL
Make sure your Supabase redirect URL is added to Google OAuth:
- Go back to Google Cloud Console > Credentials
- Edit your OAuth 2.0 Client ID
- Add this redirect URI: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
- Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference (e.g., `ctygupgtlawlgcikmkqz`)

## Step 3: Test Google OAuth

1. Start your application: `npm start`
2. Go to the login page
3. Click **"Continue with Google"**
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

### Error: "invalid_client"
- Verify that your Client ID and Client Secret are correctly entered in Supabase
- Make sure there are no extra spaces when copying

### OAuth not working in production
- Add your production domain to **Authorized JavaScript origins** in Google Cloud Console
- Update the redirect URI if your Supabase project URL is different

## Security Notes

1. **Never commit credentials to Git**: Use environment variables for sensitive data
2. **Use different OAuth clients for development and production**: Create separate OAuth clients for each environment
3. **Regularly rotate secrets**: Update your Client Secret periodically
4. **Restrict redirect URIs**: Only add the exact URIs you need

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

