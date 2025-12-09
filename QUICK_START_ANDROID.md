# Quick Start - Android App

## First Time Setup

1. **Install Android Studio** from [developer.android.com/studio](https://developer.android.com/studio)

2. **Generate app icons and splash screens:**
   ```bash
   npm run android:assets
   ```

3. **Build and sync:**
   ```bash
   npm run build
   npm run android:sync
   ```

4. **Open in Android Studio:**
   ```bash
   npm run android:open
   ```

5. In Android Studio:
   - Wait for Gradle sync to complete
   - Connect an Android device (enable USB debugging) or create an emulator
   - Click the "Run" button (green play icon) to install and run the app

## Testing on Device

1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. Enable USB Debugging:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. Connect device via USB and run:
   ```bash
   npm run android:run
   ```

## Building for Release

See `ANDROID_APP_SETUP.md` for detailed instructions on:
- Setting up app signing
- Building release AAB/APK
- Publishing to Google Play Store

## Common Commands

```bash
# Generate assets (icons, splash screens)
npm run android:assets

# Build web app and sync with Android
npm run android:sync

# Open Android project in Android Studio
npm run android:open

# Run on connected device/emulator
npm run android:run

# Build debug APK
npm run android:build:debug
```

## Next Steps

1. Test the app thoroughly on multiple devices
2. Set up app signing (see `ANDROID_APP_SETUP.md`)
3. Build release version
4. Create Google Play Developer account
5. Upload to Play Store

For detailed instructions, see `ANDROID_APP_SETUP.md`.

