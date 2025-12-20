# Install App via Android Studio

## ✅ Quick Method: Build and Run Directly

### Step 1: Open Project in Android Studio

1. Open **Android Studio**
2. Click **File** → **Open**
3. Navigate to: `C:\Users\GLORY\cvbuilder\cvbuilder-main\android`
4. Click **OK** to open the project
5. Wait for Gradle sync to complete

### Step 2: Connect Your Device

1. Connect your Android device to your computer via USB
2. Enable **USB debugging** on your device:
   - Go to **Settings** → **About phone**
   - Tap **Build number** 7 times
   - Go to **Settings** → **Developer options**
   - Enable **USB debugging**
3. On your device, allow USB debugging when prompted

### Step 3: Select Your Device

1. In Android Studio, look at the top toolbar
2. Click the device dropdown (next to the Run button)
3. Select your connected device
   - If you don't see it, click **Run** → **Edit Configurations** → Check device settings

### Step 4: Build and Install

**Option A: Build APK and Install (Recommended)**

1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. A notification will appear: "APK(s) generated successfully"
4. Click **locate** in the notification
5. Or manually find: `android/app/build/outputs/apk/release/app-release.apk`
6. Transfer this APK to your device and install it

**Option B: Run Directly (Easiest)**

1. Click the **Run** button (green play icon ▶️) in the toolbar
2. Or press **Shift + F10**
3. Or go to **Run** → **Run 'app'**
4. Select your device from the list
5. Android Studio will:
   - Build the app
   - Install it on your device
   - Launch it automatically

**Option C: Build Release APK**

1. Go to **Build** → **Select Build Variant**
2. Make sure **release** is selected (not debug)
3. Go to **Build** → **Generate Signed Bundle / APK**
4. Select **APK** → Click **Next**
5. Select your keystore (if needed) → Click **Next**
6. Select **release** build variant → Click **Finish**
7. The APK will be generated at: `android/app/release/app-release.apk`
8. Install this APK on your device

---

## Method 2: Install Existing APK via Android Studio

If you already have the APK built:

1. **Connect your device** via USB
2. In Android Studio, open **Device Manager** (View → Tool Windows → Device Manager)
3. Right-click on your device → **Install APK**
4. Browse to: `C:\Users\GLORY\cvbuilder\cvbuilder-main\android\app\build\outputs\apk\release\app-release.apk`
5. Click **OK**
6. The app will be installed automatically

---

## Method 3: Use ADB from Android Studio Terminal

1. In Android Studio, open the **Terminal** tab (bottom of screen)
2. Navigate to the android directory:
   ```bash
   cd android
   ```
3. Install the APK:
   ```bash
   adb install -r app/build/outputs/apk/release/app-release.apk
   ```

---

## Method 4: Convert AAB to APK using Bundletool

If you want to install the AAB file:

### Step 1: Download Bundletool

1. Download bundletool from: https://github.com/google/bundletool/releases
2. Download the latest `bundletool-all-x.x.x.jar` file
3. Save it to a convenient location (e.g., `C:\Users\GLORY\bundletool.jar`)

### Step 2: Generate APK from AAB

1. Open **Terminal** in Android Studio (View → Tool Windows → Terminal)
2. Run this command:
   ```bash
   java -jar C:\Users\GLORY\bundletool.jar build-apks --bundle=app/build/outputs/bundle/release/app-release.aab --output=app-release.apks --mode=universal
   ```
   (Replace the path to bundletool.jar with your actual path)

3. This creates `app-release.apks` (which is actually a ZIP file)

4. Extract the APK:
   - Rename `app-release.apks` to `app-release.zip`
   - Extract it
   - Find `universal.apk` inside
   - Install this APK on your device

### Step 3: Install the APK

Use any of the methods above to install the extracted APK.

---

## Recommended: Use Run Button (Easiest)

**The easiest way is to simply click the Run button in Android Studio:**

1. ✅ Open project in Android Studio
2. ✅ Connect device via USB
3. ✅ Click **Run** button (▶️)
4. ✅ Select your device
5. ✅ Done! App is installed and running

This will build and install the latest code automatically.

---

## Troubleshooting

### Device Not Showing Up

1. **Check USB connection:**
   - Try different USB cable
   - Try different USB port
   - Enable USB debugging again

2. **Install device drivers:**
   - Some devices need specific drivers
   - Check manufacturer's website

3. **Restart ADB:**
   - In Android Studio Terminal:
     ```bash
     adb kill-server
     adb start-server
     adb devices
     ```

### Build Errors

1. **Sync Gradle:**
   - Click **File** → **Sync Project with Gradle Files**

2. **Invalidate Caches:**
   - Click **File** → **Invalidate Caches** → **Invalidate and Restart**

3. **Clean and Rebuild:**
   - Click **Build** → **Clean Project**
   - Then **Build** → **Rebuild Project**

---

## Quick Steps Summary

1. **Open Android Studio**
2. **Open project:** `C:\Users\GLORY\cvbuilder\cvbuilder-main\android`
3. **Connect device** via USB
4. **Click Run button** (▶️)
5. **Select your device**
6. **Done!** App installs and launches automatically

---

**This is the easiest method - Android Studio handles everything for you!**

