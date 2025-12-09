# Step-by-Step: Create Upload Keystore for Google Play

## Method 1: Using Android Studio's JDK (Easiest)

### Step 1: Find Android Studio's JDK Path

1. Open **Android Studio**
2. Go to **File → Settings** (or **Android Studio → Preferences** on Mac)
3. Navigate to **Build, Execution, Deployment → Build Tools → Gradle**
4. Look for **"Gradle JDK"** - it will show the path, something like:
   - `C:\Users\Glory\AppData\Local\Android\Sdk\jbr\bin`
   - Or: `C:\Program Files\Android\Android Studio\jbr\bin`

### Step 2: Use Full Path to keytool

Open PowerShell in your project root (`C:\Users\Glory\cv-builder`) and run:

**Replace the path with your actual JDK path:**

```powershell
# Example (adjust path to match your system):
& "C:\Users\Glory\AppData\Local\Android\Sdk\jbr\bin\keytool.exe" -genkey -v -keystore android\app\upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Or if your JDK is in a different location:

```powershell
# Common locations:
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore android\app\upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

### Step 3: Answer the Questions

You'll be prompted to enter:

1. **Keystore password:** 
   - Choose a STRONG password (e.g., `MyApp2024!Secure#Key`)
   - ⚠️ **SAVE THIS PASSWORD!** You'll need it for every update.

2. **Re-enter password:** Type the same password again

3. **Key password:** 
   - Press Enter to use the same password as keystore
   - Or enter a different password (also save it!)

4. **What is your first and last name?**
   - Enter: Your name or company name (e.g., `Get Glory`)

5. **What is the name of your organizational unit?**
   - Enter: (Optional, press Enter to skip) or `Development`

6. **What is the name of your organization?**
   - Enter: Your company name (e.g., `Get Glory`)

7. **What is the name of your City or Locality?**
   - Enter: Your city (e.g., `Karachi`)

8. **What is the name of your State or Province?**
   - Enter: Your state/province (e.g., `Sindh`)

9. **What is the two-letter country code for this unit?**
   - Enter: Your country code (e.g., `PK` for Pakistan, `US` for USA)

10. **Is CN=Your Name, OU=..., O=..., L=..., ST=..., C=... correct?**
    - Type: `yes` and press Enter

### Step 4: Verify Keystore Created

After completion, you should see:
```
[Storing android\app\upload-keystore.jks]
```

Check that the file exists:
```powershell
Test-Path android\app\upload-keystore.jks
```
Should return `True`

---

## Method 2: Using Java JDK (If Installed)

If you have Java JDK installed separately:

### Find Java Installation

```powershell
# Check if Java is installed
java -version

# Find Java home
$env:JAVA_HOME
```

### Use Java's keytool

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore android\app\upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

---

## Method 3: Using Android Studio Terminal

1. Open **Android Studio**
2. Open your project
3. Go to **View → Tool Windows → Terminal** (or press `Alt+F12`)
4. The terminal will be in your project root
5. Run:

```bash
cd android/app
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

This should work because Android Studio's terminal has the JDK in its PATH.

---

## After Creating Keystore

### Step 5: Create key.properties File

1. Go back to project root: `C:\Users\Glory\cv-builder`
2. Create file: `android/key.properties`
3. Add this content (replace with YOUR passwords):

```properties
storePassword=YOUR_STORE_PASSWORD_HERE
keyPassword=YOUR_KEY_PASSWORD_HERE
keyAlias=upload
storeFile=../app/upload-keystore.jks
```

**Example:**
```properties
storePassword=MyApp2024!Secure#Key
keyPassword=MyApp2024!Secure#Key
keyAlias=upload
storeFile=../app/upload-keystore.jks
```

### Step 6: Verify build.gradle

Your `android/app/build.gradle` should already have the signing configuration (we added it earlier). Verify it looks correct.

### Step 7: Test the Build

Try building a release to verify signing works:

```powershell
cd android
.\gradlew.bat bundleRelease
```

If it asks for passwords, the keystore is working!

---

## ⚠️ IMPORTANT: Save Your Passwords!

**You MUST save:**
1. Keystore password
2. Key password (if different)
3. Keep `upload-keystore.jks` file safe
4. Keep `key.properties` file safe (but don't commit to Git - it's already in .gitignore)

**If you lose these:**
- You won't be able to update your app on Play Store
- You'll need to create a new app listing

---

## Troubleshooting

### "keytool not found"
- Use Method 1 (full path to Android Studio's JDK)
- Or use Method 3 (Android Studio terminal)

### "Permission denied"
- Make sure you're in the correct directory
- Check file permissions

### "Keystore file already exists"
- Delete the old one first: `Remove-Item android\app\upload-keystore.jks`
- Or use a different name

---

## Next Steps

Once keystore is created:
1. ✅ Create `android/key.properties` file
2. ✅ Verify `build.gradle` has signing config (already done)
3. ✅ Build release AAB
4. ✅ Upload to Play Store

Good luck! 🚀

