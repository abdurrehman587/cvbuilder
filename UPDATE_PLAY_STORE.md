# How to Update Your App on Google Play Store

## Step 1: Update Version Numbers ✅
Version numbers have been updated:
- **Version Code**: 2 → **3** (required - must be higher)
- **Version Name**: 1.0.1 → **1.0.2**

## Step 2: Build Release AAB

### Option A: Using Command Line (Recommended)
```bash
# Make sure you're in the project root
cd C:\Users\Glory\cv-builder

# Set JAVA_HOME if not already set
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Build the release AAB
cd android
.\gradlew bundleRelease
```

The AAB file will be created at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Option B: Using Android Studio
1. Open Android Studio
2. Go to **Build** > **Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Click **Next**
5. Select your keystore file: `android/app/upload-keystore.jks`
6. Enter passwords (from `android/key.properties`)
7. Click **Next**
8. Select **release** build variant
9. Click **Create**
10. The AAB will be created in `android/app/release/`

## Step 3: Upload to Google Play Console

1. **Go to Play Console**
   - Visit [Google Play Console](https://play.google.com/console)
   - Sign in and select your app

2. **Navigate to Production**
   - In the left sidebar, go to **Release** > **Production**
   - (Or **Testing** > **Internal testing** / **Closed testing** if you want to test first)

3. **Create New Release**
   - Click **Create new release** (or **Edit release** if updating existing)
   - If prompted, select the release track (Production/Testing)

4. **Upload AAB**
   - Click **Upload** under "App bundles and APKs"
   - Select the file: `android/app/build/outputs/bundle/release/app-release.aab`
   - Wait for upload to complete (may take a few minutes)

5. **Add Release Notes**
   - Under "Release name", enter: `1.0.2`
   - Under "What's new in this release?", add:
     ```
     - Fixed Google Sign-In authentication for mobile app
     - Improved OAuth flow with system browser
     - Fixed "Checking authentication" loading issue
     - Enhanced app stability and performance
     ```

6. **Review and Rollout**
   - Review all information
   - Click **Save** (for draft) or **Review release** (to submit)
   - If submitting, click **Start rollout to Production** (or your selected track)

## Step 4: Wait for Review

- Google typically reviews updates within **1-7 days**
- You'll receive an email when the review is complete
- The update will automatically roll out to users

## Important Notes

### Version Code Rules
- **Version Code must always increase** (3, 4, 5, etc.)
- Each upload must have a higher version code than the previous one
- Version Name can be anything (1.0.2, 1.1.0, 2.0.0, etc.)

### Testing Before Production
It's recommended to test the update first:
1. Upload to **Internal testing** track first
2. Test with a few devices
3. If everything works, promote to **Production**

### Rollout Options
- **Full rollout**: All users get the update immediately
- **Gradual rollout**: Start with 20% of users, then increase
- **Staged rollout**: Recommended for major updates

## Troubleshooting

### "Version code already used"
- Increment versionCode in `android/app/build.gradle`
- Rebuild the AAB

### "Upload failed"
- Check file size (must be under 150MB for AAB)
- Ensure you're uploading an AAB, not an APK
- Check internet connection

### "Signing error"
- Verify `android/key.properties` exists and has correct passwords
- Ensure keystore file exists at `android/app/upload-keystore.jks`

## Quick Checklist

- [ ] Version code incremented (3)
- [ ] Version name updated (1.0.2)
- [ ] AAB built successfully
- [ ] AAB uploaded to Play Console
- [ ] Release notes added
- [ ] Release reviewed and submitted
- [ ] Waiting for Google review

## After Update is Live

Users will automatically receive the update through the Play Store. They don't need to do anything - the update will appear in their "Updates" section.

