# How to Update Signing Key on Google Play Store

## ⚠️ IMPORTANT: When You Change Your Signing Key

When you change your app's signing key, Google Play Store requires you to **reset the upload key** before you can upload new versions of your app. This is a security measure to prevent unauthorized updates.

---

## Step-by-Step Process

### Step 1: Export Your New Certificate

First, you need to export the certificate from your new keystore:

#### Option A: Using Android Studio Terminal (Recommended)

1. Open Android Studio
2. Open Terminal (View → Tool Windows → Terminal)
3. Navigate to your android directory:
   ```bash
   cd android
   ```
4. Run this command (replace with your actual password and alias):
   ```bash
   keytool -export -rfc -keystore app/upload-keystore.jks -alias key0 -file upload_certificate.pem -storepass Pakistan123@
   ```
   **Note:** Replace:
   - `key0` with your actual key alias (check `keystore.properties`)
   - `Pakistan123@` with your actual keystore password
   - `upload-keystore.jks` with your actual keystore filename

5. The certificate will be created as `upload_certificate.pem` in the `android` folder.

#### Option B: Using Full Path to keytool

If keytool is not in your PATH:

1. Find keytool.exe (usually in Android Studio's JBR):
   - `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`
   - Or: `C:\Users\GLORY\AppData\Local\Android\Sdk\jre\bin\keytool.exe`

2. Use the full path:
   ```powershell
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -export -rfc -keystore app/upload-keystore.jks -alias key0 -file upload_certificate.pem -storepass Pakistan123@
   ```

---

### Step 2: Request Upload Key Reset in Play Console

1. **Go to Google Play Console:**
   - Visit: https://play.google.com/console
   - Sign in with your developer account

2. **Navigate to App Signing:**
   - Select your app
   - Go to **Release** → **Setup** → **App signing** (in the left sidebar)
   - Or go to: **Release** → **Production** → **App signing**

3. **Request Upload Key Reset:**
   - Look for **"Upload key certificate"** section
   - Click **"Request upload key reset"** or **"Reset upload key"**
   - You may see a warning about security - this is normal

4. **Upload Your New Certificate:**
   - Click **"Upload new certificate"** or **"Choose file"**
   - Select the `upload_certificate.pem` file you created in Step 1
   - **IMPORTANT:** Upload the `.pem` file, NOT the `.jks` keystore file!

5. **Submit the Request:**
   - Review the information
   - Click **"Submit"** or **"Confirm"**

---

### Step 3: Wait for Approval

- Google will review your request (usually takes **24-48 hours**, but can take up to **7 days**)
- You'll receive an email when the request is approved
- **DO NOT** try to upload a new AAB until you receive approval

---

### Step 4: Verify Upload Key Reset

1. Go back to **App signing** in Play Console
2. Check that your new certificate is listed under **"Upload key certificate"**
3. The certificate fingerprint should match your new keystore

---

### Step 5: Build and Upload New AAB

Once the upload key reset is approved:

1. **Build your AAB:**
   ```bash
   cd android
   gradlew bundleRelease
   ```

2. **Find your AAB:**
   - Location: `android/app/build/outputs/bundle/release/app-release.aab`

3. **Upload to Play Console:**
   - Go to **Release** → **Production** (or **Testing** → **Internal testing**)
   - Click **"Create new release"**
   - Upload the new AAB file
   - Add release notes
   - Review and publish

---

## Troubleshooting

### Error: "The upload certificate is the same as one of the past upload certificates"

**Solution:** You need to create a **completely new keystore** with a different certificate. You cannot reuse an old certificate.

### Error: "The upload certificate could not be decoded"

**Solution:** Make sure you're uploading the `.pem` file (certificate), NOT the `.jks` file (keystore). The `.pem` file should start with `-----BEGIN CERTIFICATE-----`.

### Error: "Keystore file not found"

**Solution:** 
1. Check that your `keystore.properties` file has the correct path
2. The path in `storeFile` should be relative to the `app` directory
3. Example: If keystore is at `android/app/upload-keystore.jks`, use `storeFile=upload-keystore.jks`

### Error: "Alias does not exist"

**Solution:**
1. List your keystore aliases:
   ```bash
   keytool -list -v -keystore app/upload-keystore.jks -storepass Pakistan123@
   ```
2. Find the correct alias name
3. Update `keyAlias` in `keystore.properties`

---

## Important Notes

1. **Keep Your Keystore Safe:**
   - Save the keystore file in multiple secure locations
   - Save the password in a password manager
   - **NEVER** commit the keystore to Git (it's in `.gitignore`)

2. **Backup Everything:**
   - Keep a backup of your old keystore (in case you need it)
   - Keep a backup of your new keystore
   - Document all passwords and aliases

3. **Google Play App Signing:**
   - If you're using Google Play App Signing (recommended), Google manages your app signing key
   - You only need to provide an upload key
   - The upload key can be reset if lost, but the app signing key cannot

4. **Version Code:**
   - Make sure to increment `versionCode` in `build.gradle` before building
   - Current version: `versionCode 12`, `versionName "2.0.2"`

---

## Quick Reference

**Current Keystore Info (from keystore.properties):**
- Alias: `key0`
- Password: `Pakistan123@`
- File: `upload-keystore.jks`
- Location: `android/app/upload-keystore.jks`

**Export Certificate Command:**
```bash
keytool -export -rfc -keystore app/upload-keystore.jks -alias key0 -file upload_certificate.pem -storepass Pakistan123@
```

**Build AAB Command:**
```bash
cd android
gradlew bundleRelease
```

---

## Need Help?

If you encounter issues:
1. Check the Play Console for specific error messages
2. Verify your keystore file exists and is accessible
3. Ensure your certificate export was successful
4. Wait for Google's approval before attempting to upload

