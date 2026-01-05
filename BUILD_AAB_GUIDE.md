# 🚀 Build AAB for Play Store - Complete Guide

## ✅ Pre-Build Checklist

- [x] Production build completed (`npm run build`)
- [x] Capacitor synced (`npx cap sync android`)
- [x] Version Code: **15**
- [x] Version Name: **2.0.5**
- [x] App ID: `com.getglory.app`
- [x] Keystore configured

## 📦 Current Build Status

- **Main Bundle**: 430.34 kB (gzipped)
- **CSS Bundle**: 48.09 kB
- **Build Location**: `build/` folder
- **Android Assets**: Synced to `android/app/src/main/assets/`

## 🔧 Method 1: Build AAB with Android Studio (Recommended)

### Step 1: Open Project in Android Studio

1. **Open Android Studio**
2. **File** → **Open**
3. Navigate to and select the `android` folder in your project
4. Wait for Gradle sync to complete

### Step 2: Generate Signed Bundle

1. **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle (AAB)**
3. Click **Next**

### Step 3: Configure Keystore

1. **Keystore path**: Browse to `android/app/upload-keystore.jks`
   - If you don't have this file, see "Keystore Setup" section below
2. **Keystore password**: Enter your keystore password
3. **Key alias**: Enter your key alias (usually `upload`)
4. **Key password**: Enter your key password
5. Click **Next**

### Step 4: Build Configuration

1. **Build variant**: Select `release`
2. **Destination folder**: `android/app/build/outputs/bundle/release/`
3. Click **Create**

### Step 5: Locate AAB File

After build completes, your AAB file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 🔧 Method 2: Build AAB from Command Line

### Prerequisites

- Java 21 installed (required for Gradle 8.13.2)
- Keystore file configured

### Step 1: Verify Java Version

```powershell
java -version
```

Should show Java 21. If not, download from: https://adoptium.net/temurin/releases/?version=21

### Step 2: Set JAVA_HOME (if needed)

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
```

### Step 3: Build AAB

```powershell
cd android
.\gradlew.bat bundleRelease
```

### Step 4: Locate AAB File

After build completes:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 🔐 Keystore Setup (If Not Already Configured)

### Option 1: Use Existing Keystore

If you have an existing keystore file:
1. Place it at: `android/app/upload-keystore.jks`
2. Create `android/keystore.properties`:
   ```properties
   storeFile=app/upload-keystore.jks
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_KEY_PASSWORD
   ```

### Option 2: Generate New Keystore

```powershell
cd android/app
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Then create `android/keystore.properties` as above.

⚠️ **IMPORTANT**: Keep your keystore file and passwords secure! If you lose the keystore, you cannot update your app on Play Store.

## 📤 Upload to Play Store

### Step 1: Go to Google Play Console

1. Visit: https://play.google.com/console
2. Select your app: **Get Glory**

### Step 2: Create New Release

1. Navigate to: **Release** → **Production** (or **Testing** → **Internal testing** for testing first)
2. Click **Create new release**

### Step 3: Upload AAB

1. Click **Upload** under "App bundles"
2. Select: `android/app/build/outputs/bundle/release/app-release.aab`
3. Wait for upload to complete

### Step 4: Add Release Notes

**Version 2.0.5 Release Notes:**
```
🚀 New Features:
- Fixed Google Sign-In redirect loop issue
- Improved order notification system
- Enhanced authentication flow

🐛 Bug Fixes:
- Fixed "New orders" notification persistence issue
- Improved OAuth callback handling for mobile apps
- Better session management after sign-in

✨ Improvements:
- Optimized notification dismissal
- Better error handling
- Performance improvements
```

### Step 5: Review and Publish

1. Click **Review release**
2. Review all information
3. Click **Start rollout** to publish

## 🧪 Testing Before Production

### Recommended Testing Flow

1. **Internal Testing Track** (Recommended first)
   - Upload AAB to Internal testing
   - Test with internal testers
   - Verify all features work

2. **Closed Testing Track** (Optional)
   - Test with a larger group
   - Get feedback

3. **Production Track**
   - Only after thorough testing
   - Gradual rollout recommended (start with 20%)

## 📋 Version Information

- **Version Code**: 15 (must be unique and incrementing)
- **Version Name**: 2.0.5 (user-visible version)
- **App ID**: com.getglory.app
- **Package Name**: com.getglory.app

## ⚠️ Important Notes

### Version Code Requirements
- Each upload **must** have a higher version code than the previous release
- Version code is an integer (15, 16, 17, etc.)
- Play Store uses version code to determine which version is newer

### Version Name Requirements
- Version name is user-visible (2.0.5, 2.0.6, etc.)
- Can be any string format
- Does not need to match version code

### Signing Requirements
- AAB **must** be signed with your release keystore
- Same keystore must be used for all updates
- If keystore is lost, you cannot update the app

### Size Limits
- AAB should be under 150MB (current build is well under)
- Individual APK downloads are optimized by Play Store

## 🔍 Troubleshooting

### Build Fails with Java Version Error

**Error**: `Unsupported class file major version`
**Solution**: Install Java 21 and set JAVA_HOME

### Keystore Not Found

**Error**: `Keystore file not found`
**Solution**: 
1. Verify keystore path in `keystore.properties`
2. Ensure keystore file exists at specified location
3. Check file permissions

### Gradle Sync Fails

**Error**: Gradle sync failed
**Solution**:
1. In Android Studio: **File** → **Invalidate Caches / Restart**
2. Clean project: **Build** → **Clean Project**
3. Rebuild: **Build** → **Rebuild Project**

### AAB Too Large

**Solution**:
1. Check bundle size: `android/app/build/outputs/bundle/release/app-release.aab`
2. If over 150MB, optimize assets
3. Remove unused dependencies

## 📊 Build Verification

After building, verify:
- [ ] AAB file exists at expected location
- [ ] AAB file size is reasonable (< 150MB)
- [ ] Version code is incremented
- [ ] Version name is updated
- [ ] AAB is signed (can be verified in Android Studio)

## 📍 File Locations

### AAB File (After Build)
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Keystore File
```
android/app/upload-keystore.jks
```

### Keystore Properties
```
android/keystore.properties
```

### Production Build
```
build/
```

## ✅ Final Checklist Before Upload

- [ ] AAB file generated successfully
- [ ] AAB file is signed
- [ ] Version code is 15 (or higher if updating)
- [ ] Version name is 2.0.5
- [ ] Release notes prepared
- [ ] App tested on Internal testing track (recommended)
- [ ] All features working correctly
- [ ] Screenshots and graphics ready (if updating store listing)
- [ ] App description updated (if needed)
- [ ] Privacy policy URL set (if required)

---

## 🎯 Quick Start Commands

```powershell
# 1. Build production app
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio: Build → Generate Signed Bundle / APK
```

---

**Last Updated**: Version 2.0.5 (Code: 15)
**Build Date**: $(Get-Date -Format "yyyy-MM-dd")

