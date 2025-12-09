# OAuth Troubleshooting Guide

## Current Issue: Error 403: disallowed_useragent

This error means Google is still detecting a WebView instead of the system browser.

## Steps to Fix

### 1. Verify Browser Plugin is Installed
The Browser plugin should be synced. Check the sync output - you should see:
```
@capacitor/browser@7.0.2
```

### 2. Rebuild and Reinstall the App
**Important:** After code changes, you MUST rebuild and reinstall:

```bash
npm run build
npm run android:sync
npm run android:run
```

Or manually:
1. Build: `npm run build`
2. Sync: `npm run android:sync`
3. Open Android Studio: `npm run android:open`
4. In Android Studio, click "Run" (green play button) to install on your device

### 3. Check Console Logs
When you click "Continue with Google", check the device logs (via Android Studio or `adb logcat`) for:
- `Google Sign-In - isNative: true` (should be true on mobile)
- `Opening OAuth URL in system browser: [URL]`
- `Browser opened successfully`

If you see these logs, the Browser plugin is being called.

### 4. Verify Google Cloud Console Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure you have:
   - `https://ctygupgtlawlgcikmkqz.supabase.co/auth/v1/callback` (Supabase callback)
   - `https://getglory.pk/oauth-callback` (Your redirect page)

### 5. Verify Redirect Page is Live
Visit: `https://getglory.pk/oauth-callback`

You should see "Redirecting to app..." message. If you get a 404, the page isn't deployed yet.

### 6. Test the Flow Manually
1. Open Chrome browser on your phone
2. Manually navigate to: `https://accounts.google.com/o/oauth2/v2/auth?...`
   (You can get this URL from the console logs)
3. If Google Sign-In works in Chrome, the issue is with the Browser plugin
4. If it still fails, there's an issue with your Google OAuth configuration

## Alternative Solution: Use In-App Browser

If the Browser plugin still doesn't work, we can try using Capacitor's In-App Browser with a different configuration. However, this might still trigger the WebView detection.

## Debugging Steps

### Check if Browser Plugin is Working
Add this test button temporarily in your app:

```javascript
import { Browser } from '@capacitor/browser';

// Test function
const testBrowser = async () => {
  try {
    await Browser.open({ url: 'https://www.google.com' });
    console.log('Browser opened successfully');
  } catch (error) {
    console.error('Browser error:', error);
  }
};
```

If this opens Google in the system browser (not in-app), the plugin works.

### Check Platform Detection
Add this to see if Capacitor detects the platform correctly:

```javascript
import { Capacitor } from '@capacitor/core';
console.log('Platform:', Capacitor.getPlatform());
console.log('Is Native:', Capacitor.isNativePlatform());
```

On Android, you should see:
- `Platform: android`
- `Is Native: true`

## If Nothing Works

If the Browser plugin still doesn't work, we may need to:
1. Check Android permissions
2. Verify Capacitor version compatibility
3. Try a different approach (native Google Sign-In SDK)

## Next Steps

1. **Rebuild and reinstall the app** (most important!)
2. **Check console logs** when clicking "Continue with Google"
3. **Verify the redirect page** is accessible
4. **Test manually** in Chrome browser
5. Report back with what you see in the logs

