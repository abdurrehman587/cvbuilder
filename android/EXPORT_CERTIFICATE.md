# How to Export Certificate for Play Console

## Method 1: Using Android Studio (Easiest)

1. Open Android Studio
2. Open Terminal in Android Studio (View → Tool Windows → Terminal)
3. Navigate to the android directory:
   ```bash
   cd android
   ```
4. Run this command (replace with your actual password):
   ```bash
   keytool -export -rfc -keystore app/upload-keystore.jks -alias upload -file upload_certificate.pem -storepass YOUR_KEYSTORE_PASSWORD
   ```
   Replace `YOUR_KEYSTORE_PASSWORD` with your actual keystore password.

5. The certificate will be created as `upload_certificate.pem` in the `android` folder.

## Method 2: Find Java and Use keytool

1. Find where Android Studio installed Java:
   - Usually at: `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`
   - Or: `C:\Users\GLORY\AppData\Local\Android\Sdk\jre\bin\keytool.exe`

2. Use the full path to keytool:
   ```bash
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -export -rfc -keystore app/upload-keystore.jks -alias upload -file upload_certificate.pem
   ```

3. Enter your keystore password when prompted.

## After Exporting:

1. You'll have a file called `upload_certificate.pem`
2. Go back to Play Console → App signing → Request upload key reset
3. Upload the `upload_certificate.pem` file
4. Submit the request

