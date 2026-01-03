# Play Store Upload - Ready Checklist

## ✅ App Configuration

- **App ID**: `com.getglory.app`
- **App Name**: Get Glory
- **Version Code**: 15 (incremented from 14)
- **Version Name**: 2.0.5 (updated from 2.0.4)
- **Package Name**: com.getglory.app

## 📦 Build Status

✅ **Production build completed successfully**
✅ **Capacitor synced with latest build**
✅ **Version code and name updated**

### Build Output
- **Main Bundle**: 429.9 kB (gzipped)
- **CSS Bundle**: 47.28 kB
- **Build Location**: `build/` folder
- **Android Assets**: Synced to `android/app/src/main/assets/`

## 🚀 Build AAB File

**Note**: The Android build requires Java 21, but your system may have a different Java version installed.

### Option 1: Use Android Studio (Recommended - Easiest)
1. Open Android Studio
2. Open the `android` folder as a project
3. Android Studio will handle Java version compatibility automatically
4. Go to **Build** → **Generate Signed Bundle / APK**
5. Select **Android App Bundle (AAB)**
6. Use your existing keystore: `android/app/upload-keystore.jks`
7. Enter keystore password and key alias password
8. Build the release AAB
9. The AAB will be generated at: `android/app/build/outputs/bundle/release/app-release.aab`

### Option 2: Install Java 21 (Command Line)
1. Download Java 21 from: https://adoptium.net/temurin/releases/?version=21
2. Install Java 21
3. Set JAVA_HOME to point to Java 21:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
   ```
4. Then run:
   ```bash
   cd android
   .\gradlew.bat bundleRelease
   ```

### Option 3: Use Gradle Wrapper (If Java 21 is installed)
```bash
# Navigate to android directory
cd android

# Build release AAB
.\gradlew.bat bundleRelease
```

## 📋 Pre-Upload Checklist

### App Configuration ✅
- [x] Version code incremented (15)
- [x] Version name updated (2.0.5)
- [x] Production build created
- [x] Capacitor synced with latest build
- [x] App ID configured correctly (com.getglory.app)
- [x] App name set (Get Glory)

### Build Requirements
- [ ] AAB file generated (requires Java 21 or Android Studio)
- [ ] AAB file signed with release keystore
- [ ] Keystore file exists: `android/app/upload-keystore.jks`
- [ ] Keystore properties configured: `android/keystore.properties`

### Play Store Requirements
- [ ] App icon (512x512) ready
- [ ] Feature graphic (1024x500) ready
- [ ] Screenshots prepared (at least 2, up to 8)
- [ ] App description written
- [ ] Short description written (80 characters max)
- [ ] Privacy policy URL (if required)
- [ ] Content rating completed
- [ ] Target audience set
- [ ] Release notes prepared

## 📝 Release Notes for Version 2.0.5

### New Features & Improvements
- ✅ Mobile responsive design for Admin Panel
- ✅ Improved password reset functionality with better error handling
- ✅ Added order history routing and display
- ✅ Enhanced login error messages for Google-authenticated users
- ✅ Fixed cart, checkout, and order details page positioning
- ✅ Removed Dashboard tab from Admin Panel
- ✅ Updated payment instructions with WhatsApp contact number
- ✅ Improved product detail page layout and removed zoom functionality
- ✅ Fixed marketplace product card clickability

### Bug Fixes
- ✅ Fixed password reset link not showing reset form
- ✅ Fixed cart content cutting off on mobile
- ✅ Fixed order history navigation
- ✅ Improved error handling for expired password reset links
- ✅ Better detection of Google-authenticated accounts

### Technical Improvements
- ✅ Comprehensive mobile responsive breakpoints (1024px, 768px, 480px, 360px)
- ✅ Improved table layouts for mobile devices
- ✅ Enhanced touch-friendly UI elements
- ✅ Better session management for password recovery
- ✅ Optimized admin panel for mobile viewing

## 🚀 Upload Instructions

### Step 1: Generate AAB File
Follow one of the build options above to generate the AAB file.

### Step 2: Upload to Play Store
1. **Go to Google Play Console**: https://play.google.com/console
2. **Select your app**: Get Glory
3. **Navigate to**: Release → Production (or Testing → Internal testing for testing first)
4. **Click**: "Create new release"
5. **Upload AAB**: Select the AAB file from:
   ```
   android\app\build\outputs\bundle\release\app-release.aab
   ```
6. **Add Release Notes**: Copy from "Release Notes for Version 2.0.5" section above
7. **Review and Publish**: 
   - Click "Review release"
   - Review all information
   - Click "Start rollout" to publish

### Step 3: Testing (Recommended First)
Before uploading to Production, consider:
1. Upload to **Internal testing** track first
2. Test the app thoroughly
3. If everything works, promote to **Production**

## 📍 File Locations

### AAB File (After Build)
```
android\app\build\outputs\bundle\release\app-release.aab
```

### Keystore File
```
android\app\upload-keystore.jks
```

### Keystore Properties
```
android\keystore.properties
```

### Production Build
```
build\
```

## ⚠️ Important Notes

### Keystore Security
- **Never commit** `keystore.properties` or `upload-keystore.jks` to Git
- Keep keystore files secure and backed up
- If keystore is lost, you cannot update the app on Play Store

### Version Requirements
- **Version Code**: Must be higher than previous release (currently 15)
- **Version Name**: User-visible version (currently 2.0.5)
- Each upload must have a unique, incrementing version code

### Signing
- The AAB **must** be signed with your release keystore
- Android Studio handles signing automatically when using "Generate Signed Bundle"
- Command line builds require keystore.properties to be configured

### Testing
- Always test on Internal testing track first
- Test on multiple devices and Android versions
- Verify all features work correctly before Production release

## 🔧 Build Commands Reference

### Complete Build Process
```bash
# 1. Build React app
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build AAB (requires Java 21 or Android Studio)
cd android
.\gradlew.bat bundleRelease
```

### Quick Sync (After Code Changes)
```bash
npm run android:sync
```

### Open in Android Studio
```bash
npm run android:open
```

## 📱 App Permissions

The app requires the following permissions (configured in AndroidManifest.xml):
- **INTERNET**: Required for API calls and web content
- **READ_EXTERNAL_STORAGE**: For accessing files
- **WRITE_EXTERNAL_STORAGE**: For saving files (Android 12 and below)

## 🎨 App Assets

### Required for Play Store
- **App Icon**: 512x512 PNG (with transparency)
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: 
  - Phone: At least 2, up to 8 (16:9 or 9:16)
  - Tablet (if supported): At least 2, up to 8

### Current Assets Location
- Icons: `icons/` folder
- Splash: `assets/splash.png`
- Logo: `public/images/glory-logo.png`

## 📞 Troubleshooting

### Build Issues
1. **Java Version Error**: 
   - Check: `java -version` (should be 21)
   - Solution: Use Android Studio or install Java 21

2. **Gradle Build Fails**:
   - Clean build: `cd android && .\gradlew.bat clean`
   - Try building in Android Studio

3. **Keystore Not Found**:
   - Verify `keystore.properties` exists in `android/` folder
   - Check keystore path in properties file

4. **Capacitor Sync Issues**:
   - Delete `android/app/src/main/assets/` folder
   - Run `npx cap sync android` again

### Upload Issues
1. **Version Code Error**: Increment version code in `android/app/build.gradle`
2. **Signing Error**: Ensure AAB is signed with release keystore
3. **Size Limit**: AAB should be under 150MB (current build is well under)

## ✅ Final Checklist Before Upload

- [ ] AAB file generated successfully
- [ ] AAB file is signed
- [ ] Version code is incremented
- [ ] Version name is updated
- [ ] Release notes are prepared
- [ ] App tested on Internal testing track
- [ ] All features working correctly
- [ ] Screenshots and graphics ready
- [ ] App description updated (if needed)
- [ ] Privacy policy URL set (if required)

---

## 📊 Current Status

**✅ App Code**: Ready for Play Store
**✅ Production Build**: Completed (429.9 kB main bundle)
**✅ Capacitor Sync**: Completed
**✅ Version**: Updated to 2.0.5 (Code: 15)
**✅ AndroidManifest**: All required permissions configured
**⏳ AAB Build**: Pending (requires Java 21 or Android Studio)

**Next Step**: Generate AAB file using Android Studio or Java 21, then upload to Play Store.

---

**Last Updated**: Version 2.0.5 (Code: 15)
