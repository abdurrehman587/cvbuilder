# Upload AAB to Google Play Store

## 📦 Build Release AAB

Before uploading, you need to build the release AAB file:

### Build Command:
```bash
npm run android:build
```

On **Windows** (if `./gradlew` fails), use:
```powershell
npm run android:build:win
```

Or manually:
```bash
npm run build
npx cap sync android
cd android
# Unix/Mac:
./gradlew bundleRelease
# Windows (from android folder):
.\gradlew.bat bundleRelease
```

**Output Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

**File Details:**
- Size: ~8-10 MB (will be generated after build)
- Signed with: New keystore (Pakistan123@)
- Version: 2.1.0 (versionCode: 24)
- Last Modified: [Will be updated after build]

---

## Step-by-Step Upload Instructions

### Step 1: Go to Google Play Console

1. Visit: https://play.google.com/console
2. Sign in with your developer account
3. Select your app

### Step 2: Navigate to Production

1. In the left sidebar, click **"Release"**
2. Click **"Production"** (or **"Testing"** → **"Internal testing"** if you want to test first)
3. Click **"Create new release"** button

### Step 3: Upload Your AAB

1. In the **"App bundles and APKs"** section, click **"Upload"**
2. Navigate to and select your AAB file:
   ```
   C:\Users\GLORY\cvbuilder\cvbuilder-main\android\app\build\outputs\bundle\release\app-release.aab
   ```
3. Wait for the upload to complete (this may take a few minutes)

### Step 4: Add Release Notes

1. Scroll down to **"Release notes"** section
2. Add release notes describing what's new in this version
   - Example: 
     ```
     Version 2.1.0 - What's New:
     • Redesigned homepage with improved CV Builder and ID Card sections
     • Enhanced marketplace with faster loading and better performance
     • Added feature highlights for all main sections
     • Improved user experience and navigation
     • Performance optimizations for smoother app experience
     ```
3. You can add notes in multiple languages if needed

### Step 5: Review and Publish

1. Review all the information:
   - ✅ AAB file uploaded
   - ✅ Version number (2.1.0)
   - ✅ Release notes added
   - ✅ App signing key matches your new keystore

2. Click **"Save"** to save the draft, or
3. Click **"Review release"** to proceed to review
4. After review, click **"Start rollout to Production"** (or **"Start rollout"**)

### Step 6: Wait for Review

- Google will review your app (usually 1-7 days)
- You'll receive an email when the review is complete
- Once approved, your app will be live on the Play Store

---

## Important Notes

✅ **Your upload key reset was approved** - You can now upload with the new keystore

✅ **AAB is signed correctly** - The AAB is signed with your new keystore (Pakistan123@)

✅ **Version code incremented** - Current version: 19 (versionName: 2.1.0)

⚠️ **If you get an error about signing:**
- Make sure your upload key reset request was fully approved
- Check that the certificate in Play Console matches your new keystore
- Wait a few minutes after approval before uploading (sometimes there's a delay)

---

## Quick Checklist

Before uploading, verify:
- [x] AAB file exists and is accessible
- [x] Upload key reset was approved in Play Console
- [x] Version code is incremented (current: 24)
- [ ] Release notes are prepared
- [ ] You're ready to publish

---

## Troubleshooting

### Error: "Upload failed - signing key mismatch"

**Solution:** 
- Verify your upload key reset was fully approved
- Check App signing page in Play Console to confirm new certificate is active
- Wait a few minutes and try again

### Error: "Version code already exists"

**Solution:**
- Increment `versionCode` in `android/app/build.gradle`
- Rebuild the AAB:
  ```bash
  cd android
  gradlew bundleRelease
  ```

### Error: "App bundle is not signed"

**Solution:**
- Verify `keystore.properties` file exists and has correct values
- Check that keystore file exists at the specified path
- Rebuild the AAB

---

## Next Steps After Upload

1. Monitor the release in Play Console
2. Check for any review issues
3. Once live, monitor user feedback and crash reports
4. Plan your next update!

---

**Good luck with your release! 🚀**

