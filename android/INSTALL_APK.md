# How to Install APK on Android Device

## ✅ APK File Location

**APK File:**
```
C:\Users\GLORY\cvbuilder\cvbuilder-main\android\app\build\outputs\apk\release\app-release.apk
```

**Version:** 2.0.3 (versionCode: 13)

---

## Method 1: Transfer and Install via USB (Recommended)

### Step 1: Enable USB Debugging on Your Device

1. Go to **Settings** → **About phone**
2. Tap **Build number** 7 times to enable Developer options
3. Go back to **Settings** → **Developer options**
4. Enable **USB debugging**
5. Enable **Install via USB** (if available)

### Step 2: Connect Device to Computer

1. Connect your Android device to your computer via USB cable
2. On your device, allow USB debugging when prompted
3. Select **File transfer** or **MTP** mode

### Step 3: Transfer APK to Device

1. Copy the APK file to your device:
   - Drag and drop `app-release.apk` to your device's storage
   - Or use File Explorer to copy it to Downloads folder

### Step 4: Install APK on Device

1. On your device, open **File Manager** or **Downloads**
2. Find `app-release.apk`
3. Tap on it to install
4. If prompted, allow **Install from unknown sources**
5. Tap **Install**
6. Wait for installation to complete
7. Tap **Open** or find the app in your app drawer

---

## Method 2: Install via ADB (Advanced)

### Prerequisites:
- ADB installed on your computer
- USB debugging enabled on device
- Device connected via USB

### Steps:

1. **Open PowerShell or Command Prompt**

2. **Navigate to ADB directory** (or add ADB to PATH):
   ```powershell
   cd "C:\Users\GLORY\AppData\Local\Android\Sdk\platform-tools"
   ```

3. **Check if device is connected:**
   ```powershell
   .\adb devices
   ```
   You should see your device listed

4. **Install the APK:**
   ```powershell
   .\adb install "C:\Users\GLORY\cvbuilder\cvbuilder-main\android\app\build\outputs\apk\release\app-release.apk"
   ```

5. **If app is already installed, use:**
   ```powershell
   .\adb install -r "C:\Users\GLORY\cvbuilder\cvbuilder-main\android\app\build\outputs\apk\release\app-release.apk"
   ```
   (The `-r` flag replaces the existing app)

---

## Method 3: Transfer via Cloud/Email

1. **Upload APK to cloud storage:**
   - Upload `app-release.apk` to Google Drive, Dropbox, or similar
   - Or email it to yourself

2. **Download on device:**
   - Open the cloud storage app or email on your device
   - Download the APK file

3. **Install:**
   - Open **File Manager** → **Downloads**
   - Tap on `app-release.apk`
   - Allow installation from unknown sources if prompted
   - Tap **Install**

---

## Method 4: Use Android Studio

1. **Open Android Studio**
2. **Connect your device** via USB
3. **Run the app:**
   - Click the **Run** button (green play icon)
   - Or go to **Run** → **Run 'app'**
   - Select your device from the list
   - The app will be installed and launched automatically

---

## Troubleshooting

### Error: "App not installed"
- **Solution:** Uninstall the old version first, then install the new one
- Or use `adb install -r` to replace existing installation

### Error: "Install blocked"
- **Solution:** Go to **Settings** → **Security** → Enable **Unknown sources** or **Install unknown apps**

### Error: "Package appears to be corrupt"
- **Solution:** Rebuild the APK and try again

### Device not detected by ADB
- **Solution:**
  1. Check USB cable connection
  2. Enable USB debugging again
  3. Try different USB port
  4. Install device drivers if needed

---

## Quick ADB Install Command

If ADB is in your PATH, you can use:
```powershell
adb install -r "C:\Users\GLORY\cvbuilder\cvbuilder-main\android\app\build\outputs\apk\release\app-release.apk"
```

---

## After Installation

1. **Open the app** on your device
2. **Test the timeout fix:**
   - The timeout warning should appear after **10 seconds** (not 31 seconds)
   - The message should say "after 10 seconds"
3. **Check the console logs** to verify the new timeout code is working

---

**The APK is ready to install! Choose the method that works best for you.**

