# Debugging Android App - Items Not Displaying

## Step 1: Check What You See on Your Phone

Describe what you see:
- [ ] Blank white screen
- [ ] App loads but no content/items visible
- [ ] Error message
- [ ] App crashes immediately
- [ ] Splash screen but nothing after

## Step 2: Enable Remote Debugging (Chrome DevTools)

This is the **most important step** to see what's wrong:

### On Your Computer:

1. **Open Google Chrome** (not Android Studio)
2. Type in address bar: `chrome://inspect`
3. Check the box: **"Discover USB devices"**

### On Your Phone:

1. Make sure **USB Debugging is enabled**:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
2. **Connect phone to computer via USB**
3. On your phone, when prompted, **allow USB debugging**

### In Chrome:

4. You should see your device listed under "Remote Target"
5. Look for your app: **"Get Glory"** or **"com.getglory.app"**
6. Click **"Inspect"** next to your app
7. A new Chrome DevTools window will open

## Step 3: Check Console for Errors

In the Chrome DevTools window that opened:

1. Click the **"Console"** tab
2. Look for **red error messages**
3. **Copy any errors** you see

Common errors to look for:
- `Failed to load resource`
- `Network error`
- `CORS error`
- `Uncaught TypeError`
- `Cannot read property of undefined`

## Step 4: Check Network Tab

1. Click the **"Network"** tab in DevTools
2. **Reload the app** on your phone (or refresh in DevTools)
3. Look for:
   - **Red entries** (failed requests)
   - **Missing files** (404 errors)
   - **Supabase API calls** failing

## Step 5: Common Issues & Fixes

### Issue 1: Blank White Screen
**Possible causes:**
- JavaScript error preventing render
- Missing build files
- Network connectivity issue

**Fix:**
- Check Console tab for errors
- Verify phone has internet connection
- Rebuild and reinstall app

### Issue 2: "Failed to fetch" or Network Errors
**Possible causes:**
- Supabase URL not accessible
- CORS issues
- Internet connection problem

**Fix:**
- Check phone's internet connection
- Verify Supabase URL in console logs
- Check if Supabase project is active

### Issue 3: Items Not Loading
**Possible causes:**
- API calls failing
- Data not loading from Supabase
- JavaScript errors in data fetching

**Fix:**
- Check Network tab for failed API calls
- Check Console for JavaScript errors
- Verify Supabase credentials are correct

### Issue 4: App Crashes
**Possible causes:**
- Unhandled JavaScript error
- Memory issue
- Native plugin error

**Fix:**
- Check Logcat in Android Studio (bottom panel)
- Look for crash logs
- Check Console in Chrome DevTools

## Step 6: Check Logcat (Android Studio)

1. In Android Studio, click **"Logcat"** tab (bottom panel)
2. Filter by: `Get Glory` or `com.getglory.app`
3. Look for **red error messages**
4. Check for crash logs

## Quick Diagnostic Commands

### Rebuild and Reinstall:
```bash
npm run build
npx cap sync android
```
Then run from Android Studio again.

### Check if Build Files Exist:
```bash
# Check if build folder has files
dir build\static
```

### Verify Capacitor Config:
The app should be loading from local files, not a remote server.

## What to Report Back

Please share:
1. **What you see on your phone** (blank screen, partial UI, etc.)
2. **Any errors from Chrome DevTools Console**
3. **Any failed network requests** from Network tab
4. **Any errors from Logcat** in Android Studio

This will help identify the exact issue!

