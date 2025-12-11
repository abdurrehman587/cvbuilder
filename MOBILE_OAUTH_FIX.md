# Mobile OAuth Fix - Google Sign-In in Android App

## Problem
Google blocks OAuth requests from WebViews (which Capacitor uses by default) with error: **"Error 403: disallowed_useragent"**

## Solution
Use the system browser instead of WebView for OAuth authentication, and handle the callback via deep linking.

## Changes Made

### 1. Installed Required Plugins
- `@capacitor/browser` - Opens OAuth in system browser
- `@capacitor/app` - Handles deep link callbacks

### 2. Updated Files

#### `capacitor.config.ts`
- Added `appUrlOpen` configuration for deep linking with custom URL scheme: `getglory://oauth-callback`

#### `src/components/Supabase/supabase.js`
- Modified `signInWithGoogle()` to:
  - Detect if running on mobile (Capacitor)
  - Use `skipBrowserRedirect: true` on mobile
  - Open OAuth URL in system browser using `Browser.open()`
  - Use custom URL scheme (`getglory://oauth-callback`) as redirect URL

#### `src/App.js`
- Added `App.addListener('appUrlOpen')` to handle deep link callbacks
- Closes browser after OAuth callback
- Properly handles OAuth session exchange

#### `android/app/src/main/AndroidManifest.xml`
- Added intent filter for deep link: `getglory://oauth-callback`

## Required: Update Google Cloud Console

Google Cloud Console only accepts web URLs (not custom URL schemes). You need to add your website's OAuth callback page:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID (the one used for your app)
4. Under **Authorized redirect URIs**, add:
   ```
   https://getglory.pk/oauth-callback
   ```
   (Replace `getglory.pk` with your actual domain if different)
5. Click **Save**

## Required: Host the Redirect Page

You need to host the `oauth-callback.html` file on your website:

1. Upload `public/oauth-callback.html` to your website
2. Make sure it's accessible at: `https://getglory.pk/oauth-callback`
3. The page will automatically redirect to the app using the custom URL scheme

**Note:** If you don't have a website yet, you can:
- Use GitHub Pages (free)
- Use Netlify/Vercel (free)
- Or any web hosting service

## Testing

1. Build and sync the app:
   ```bash
   npm run build
   npm run android:sync
   ```

2. Run on device:
   ```bash
   npm run android:run
   ```

3. Test Google Sign-In:
   - Click "Continue with Google"
   - Should open in system browser (not WebView)
   - After signing in, should redirect back to app
   - User should be authenticated

## How It Works

1. User clicks "Sign in with Google" in the app
2. App detects it's running on mobile
3. App opens Supabase OAuth URL in system browser (not WebView)
4. User signs in with Google in the browser
5. Google redirects to Supabase callback URL
6. Supabase processes OAuth and redirects to `getglory://oauth-callback?code=xxx`
7. Android opens the app via deep link
8. App handles the callback and completes authentication
9. Browser closes automatically

## Troubleshooting

### OAuth still fails
- Verify the redirect URI `getglory://oauth-callback` is added in Google Cloud Console
- Check that the app is properly built and synced
- Verify the intent filter is in `AndroidManifest.xml`

### Browser doesn't close
- This is handled automatically, but if it doesn't close, the user can manually close it
- The app will still receive the callback

### Deep link not working
- Verify `appUrlOpen` is configured in `capacitor.config.ts`
- Check that the intent filter is correctly added to `AndroidManifest.xml`
- Rebuild and reinstall the app

