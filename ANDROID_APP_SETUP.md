# Android App Setup & Publishing Guide

This guide will help you build and publish your "Get Glory" app to the Google Play Store.

## Prerequisites

1. **Android Studio** - Download and install from [developer.android.com/studio](https://developer.android.com/studio)
2. **Java Development Kit (JDK)** - Android Studio includes this, or install JDK 17+
3. **Google Play Developer Account** - Sign up at [play.google.com/console](https://play.google.com/console) ($25 one-time fee)
4. **Node.js and npm** - Already installed for this project

## Initial Setup

### 1. Generate App Icons and Splash Screens

First, ensure you have a high-quality logo image (at least 1024x1024px) at `public/images/glory-logo.png`.

Then generate all required icon and splash screen assets:

```bash
npm run android:assets
```

This will create all necessary icon and splash screen files for Android.

### 2. Build the Web App

Build your React app:

```bash
npm run build
```

### 3. Sync with Capacitor

Sync your web build with the Android project:

```bash
npm run android:sync
```

This copies your built web app to the Android project.

## Development & Testing

### Open in Android Studio

```bash
npm run android:open
```

This opens the Android project in Android Studio where you can:
- Run the app on an emulator
- Run on a connected device
- Debug and test

### Run on Device/Emulator

```bash
npm run android:run
```

This builds, syncs, and runs the app on a connected device or emulator.

### Build Debug APK

```bash
npm run android:build:debug
```

This creates a debug APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

You can install this APK directly on Android devices for testing.

## Preparing for Play Store

### 1. Update App Version

Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 1        // Increment for each release (1, 2, 3, ...)
    versionName "1.0.0"  // User-visible version (1.0.0, 1.0.1, ...)
}
```

**Important**: Every time you upload to Play Store, increment `versionCode`.

### 2. Configure App Signing

#### Option A: Let Google Play Sign Your App (Recommended)

Google Play App Signing is the easiest option. You'll create an upload keystore, and Google will manage the final signing key.

1. Generate an upload keystore:

```bash
cd android/app
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. Create `android/key.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=../app/upload-keystore.jks
```

3. Update `android/app/build.gradle` to use the keystore (see signing config below).

#### Option B: Manual Signing

If you prefer to sign manually, follow the same steps but use your production keystore.

### 3. Update Build Configuration

Edit `android/app/build.gradle` and add signing configuration:

```gradle
android {
    // ... existing code ...
    
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("key.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. Build Release APK/AAB

For Play Store, you need an **Android App Bundle (AAB)**, not an APK:

```bash
npm run build
npm run android:sync
cd android
./gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

Alternatively, build APK for direct distribution:

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Publishing to Google Play Store

### 1. Create App Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - **App name**: Get Glory
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free (or Paid)
   - **Declarations**: Accept terms

### 2. Complete Store Listing

Fill in all required information:

- **App name**: Get Glory
- **Short description**: Professional CV Builder, ID Card Printing, and Marketplace
- **Full description**: Detailed description of your app
- **App icon**: Upload 512x512px icon
- **Feature graphic**: 1024x500px banner
- **Screenshots**: At least 2 screenshots (phone: 16:9 or 9:16, tablet: optional)
- **Categories**: Business, Productivity, Shopping
- **Contact details**: Email, website, phone

### 3. Set Up Content Rating

Complete the content rating questionnaire. For this app, it should be rated "Everyone" or similar.

### 4. Set Up Pricing & Distribution

- Choose countries for distribution
- Set price (if paid)
- Accept export compliance if applicable

### 5. Upload App Bundle

1. Go to "Production" → "Create new release"
2. Upload your `app-release.aab` file
3. Add release notes
4. Review and roll out

### 6. Complete App Content

Complete all required sections:
- Privacy Policy (required)
- Data Safety (required)
- Target audience
- Ads (if applicable)
- In-app products (if applicable)

### 7. Submit for Review

Once all sections are complete, click "Submit for review". Google typically reviews within 1-7 days.

## Updating Your App

For each update:

1. Increment `versionCode` in `android/app/build.gradle`
2. Update `versionName` if needed
3. Build new release: `cd android && ./gradlew bundleRelease`
4. Upload new AAB in Play Console
5. Add release notes
6. Submit for review

## Troubleshooting

### Build Errors

- **Gradle sync failed**: Open Android Studio and sync project
- **Missing dependencies**: Run `npm install` and `npm run android:sync`
- **Signing errors**: Check `key.properties` file and keystore path

### App Crashes

- Check Android Studio Logcat for errors
- Test on multiple devices/Android versions
- Ensure all permissions are declared in `AndroidManifest.xml`

### Network Issues

- Ensure `INTERNET` permission is in `AndroidManifest.xml` (already added)
- Check `capacitor.config.ts` for `allowNavigation` settings

## Important Files

- `capacitor.config.ts` - Capacitor configuration
- `android/app/build.gradle` - Android build configuration
- `android/app/src/main/AndroidManifest.xml` - App permissions and metadata
- `android/app/src/main/res/values/strings.xml` - App name and strings
- `android/key.properties` - Keystore configuration (create this)

## Security Notes

⚠️ **Never commit these files to Git:**
- `android/key.properties`
- `android/app/*.jks` (keystore files)
- `android/app/upload-keystore.jks`

Add them to `.gitignore`:

```
android/key.properties
android/app/*.jks
android/app/upload-keystore.jks
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [App Signing Best Practices](https://developer.android.com/studio/publish/app-signing)

## Quick Commands Reference

```bash
# Generate icons and splash screens
npm run android:assets

# Build web app and sync
npm run android:sync

# Open in Android Studio
npm run android:open

# Run on device/emulator
npm run android:run

# Build release AAB for Play Store
npm run build && npm run android:sync && cd android && ./gradlew bundleRelease

# Build release APK
npm run build && npm run android:sync && cd android && ./gradlew assembleRelease
```

Good luck with your app launch! 🚀

