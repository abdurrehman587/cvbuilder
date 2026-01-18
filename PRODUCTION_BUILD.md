# 🚀 Production Build Guide - Get Glory Mobile App

## ✅ Pre-Build Checklist

Before building for production, ensure:

- [x] Version code incremented (Current: **19**)
- [x] Version name set (Current: **2.1.0**)
- [x] Keystore configured (`android/keystore.properties`)
- [x] ProGuard/R8 enabled for code obfuscation
- [x] Console logs removed/disabled for production
- [x] Environment variables set for production
- [x] App icons and splash screens updated
- [x] All features tested

---

## 📦 Step 1: Build Production Web App

```bash
# Install dependencies (if needed)
npm install

# Build optimized production bundle
npm run build
```

**Expected Output:**
- Build folder created with optimized assets
- Bundle size should be optimized
- All assets minified and compressed

---

## 🔄 Step 2: Sync with Capacitor

```bash
# Sync web build to Android
npx cap sync android
```

This will:
- Copy `build/` folder to `android/app/src/main/assets/`
- Update Capacitor plugins
- Sync configuration files

---

## 🏗️ Step 3: Build Release AAB

### Option A: Using Command Line (Recommended)

```bash
# Navigate to android directory
cd android

# Build release AAB
.\gradlew.bat bundleRelease
```

**Output Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Option B: Using Android Studio

1. Open Android Studio
2. File → Open → Select `android` folder
3. Build → Generate Signed Bundle / APK
4. Select **Android App Bundle (AAB)**
5. Choose release keystore
6. Build variant: **release**

---

## ✅ Step 4: Verify Build

Check the AAB file:

- **Location**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Size**: Should be ~8-15 MB
- **Signed**: Yes (with your release keystore)
- **Version**: 2.1.0 (versionCode: 19)

---

## 📤 Step 5: Upload to Google Play Store

1. **Go to Play Console**: https://play.google.com/console
2. **Select App**: Get Glory
3. **Navigate**: Release → Production (or Testing → Internal testing)
4. **Create Release**: Click "Create new release"
5. **Upload AAB**: Upload `app-release.aab`
6. **Add Release Notes**: See release notes below
7. **Review & Publish**: Review and start rollout

---

## 📝 Release Notes Template

**Version 2.1.0 - What's New:**

• Added Shopkeeper Panel for product management
• Fixed marketplace scrolling performance issues
• Improved ID Card printing functionality
• Enhanced user authentication and security
• Performance optimizations and bug fixes
• Better mobile app experience

---

## 🔐 Production Configuration

### Environment Variables

Ensure these are set in your production environment:

```env
REACT_APP_SUPABASE_URL=https://ctygupgtlawlgcikmkqz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
REACT_APP_SITE_URL=https://getglory.pk
```

### Build Configuration

- **Minification**: ✅ Enabled
- **Code Obfuscation**: ✅ Enabled (ProGuard/R8)
- **Resource Shrinking**: ✅ Enabled
- **Debug Logging**: ❌ Disabled in production

---

## 🛠️ Troubleshooting

### Build Fails with "Signing Error"

**Solution:**
- Verify `keystore.properties` exists
- Check keystore file path is correct
- Ensure keystore passwords are correct

### AAB File Too Large

**Solution:**
- Check for unused assets
- Enable resource shrinking (already enabled)
- Review dependencies for bloat

### App Crashes After Install

**Solution:**
- Check ProGuard rules (keep necessary classes)
- Review crash logs in Play Console
- Test on multiple devices

---

## 📊 Build Information

- **App ID**: `com.getglory.app`
- **App Name**: Get Glory
- **Version Code**: 19
- **Version Name**: 2.1.0
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)
- **Build Tool**: Gradle 8.13.2

---

## 🎯 Quick Build Commands

```bash
# Full production build (all steps)
npm run build && npx cap sync android && cd android && .\gradlew.bat bundleRelease

# Or use the npm script
npm run android:build
```

---

## ⚠️ Important Notes

1. **Keystore Security**: Never commit keystore files to Git
2. **Version Code**: Must increment for each Play Store upload
3. **Testing**: Always test on Internal testing track first
4. **Backup**: Keep keystore backups in secure locations
5. **Environment**: Use production environment variables

---

## 📱 Post-Release Checklist

After uploading to Play Store:

- [ ] Monitor crash reports in Play Console
- [ ] Check user reviews and ratings
- [ ] Monitor app performance metrics
- [ ] Plan next update
- [ ] Update version code for next release

---

**Status**: ✅ **READY FOR PRODUCTION**

**Last Updated**: Version 2.1.0 (versionCode: 19)

**Good luck with your release! 🚀**
