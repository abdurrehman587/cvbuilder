# Complete Guide: Updating Logo and Splash Screen

## Step 1: Verify the Logo File
The logo should have NO text - only crown, laurels, and globe.

## Step 2: Clean Everything in Android Studio

1. **Close Android Studio completely** (if it's open)

2. **In Android Studio:**
   - Open the project
   - Wait for Gradle sync to complete
   - Go to **Build → Clean Project**
   - Wait for it to finish

3. **Invalidate Caches:**
   - Go to **File → Invalidate Caches...**
   - Check all boxes:
     - ✅ Clear file system cache and Local History
     - ✅ Clear downloaded shared indexes
   - Click **Invalidate and Restart**
   - Wait for Android Studio to restart

## Step 3: Clean Build Folders (Terminal)

Run these commands in your terminal (PowerShell):

```powershell
# Remove Android build folders
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue

# Remove old assets
Remove-Item -Path "android\app\src\main\res\mipmap-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\src\main\res\drawable*" -Recurse -Force -ErrorAction SilentlyContinue
```

## Step 4: Regenerate Logo and Assets

Run these commands in order:

```powershell
# 1. Generate new logo (no text)
npm run generate:logo

# 2. Generate all Android assets
npm run android:assets

# 3. Sync with Capacitor
npm run android:sync
```

## Step 5: Uninstall App from Device

**CRITICAL:** You MUST uninstall the old app first!

1. On your Android device:
   - Go to **Settings → Apps**
   - Find **"Get Glory"** (or your app name)
   - Tap on it
   - Tap **Uninstall**
   - Confirm uninstall

2. **Restart your device** (optional but recommended to clear all caches)

## Step 6: Rebuild in Android Studio

1. **In Android Studio:**
   - Wait for Gradle sync to complete (check bottom status bar)
   - Go to **Build → Clean Project**
   - Wait for it to finish
   - Go to **Build → Assemble Project** (or press `Ctrl+F9`)
   - Wait for build to complete

2. **Check for errors:**
   - Look at the "Build" tab at the bottom
   - Make sure there are no errors (warnings are OK)

## Step 7: Run the App

1. **Connect your device** via USB (with USB debugging enabled)
   - Or use an emulator

2. **In Android Studio:**
   - Click the green **Run** button (▶️)
   - Or press `Shift+F10`
   - Select your device
   - Wait for app to install and launch

## Step 8: Verify the New Logo

The splash screen should show:
- ✅ Golden crown at top
- ✅ Golden laurel leaves
- ✅ Teal globe in center
- ❌ NO TEXT (no "GLORY", no "LOI", nothing)

## Troubleshooting

### If you still see the old logo:

1. **Check the logo file:**
   ```powershell
   Get-Item "public\images\glory-logo.png" | Select-Object LastWriteTime
   ```
   Should show a recent timestamp (just now)

2. **Verify assets were regenerated:**
   ```powershell
   Get-ChildItem "android\app\src\main\res\drawable-port-xxhdpi\splash.png" | Select-Object LastWriteTime
   ```
   Should show a recent timestamp

3. **Force uninstall and reinstall:**
   - Uninstall app from device
   - Restart device
   - Rebuild and reinstall

4. **Clear Android Studio completely:**
   - Close Android Studio
   - Delete `android\.gradle` folder
   - Delete `android\app\build` folder
   - Reopen Android Studio
   - Let it sync and rebuild

## Current Logo Design

The logo should contain:
- **Crown:** Golden crown with 5 peaks at the top
- **Laurels:** Golden laurel leaves below the crown
- **Globe:** Teal globe with grid lines in the center
- **No Text:** Completely removed to avoid cutoff issues

## Commands Summary

```powershell
# Full reset and regenerate
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\src\main\res\mipmap-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\src\main\res\drawable*" -Recurse -Force -ErrorAction SilentlyContinue
npm run generate:logo
npm run android:assets
npm run android:sync
```

Then in Android Studio:
1. Build → Clean Project
2. Build → Assemble Project
3. Uninstall app from device
4. Run the app

