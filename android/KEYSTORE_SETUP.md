# Android Keystore Setup Guide

## Option 1: Create a New Keystore (If you don't have one)

### Step 1: Generate the Keystore
Run this command in the `android/app` directory:

```bash
keytool -genkey -v -keystore getglory-release.keystore -alias getglory -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- **Keystore password**: (Choose a strong password - SAVE THIS!)
- **Key password**: (Can be same as keystore password)
- **Your name and organization details**

### Step 2: Store Keystore Securely
- Move the keystore file to a secure location (e.g., `android/app/getglory-release.keystore`)
- **IMPORTANT**: Save the password and alias name in a secure password manager
- **DO NOT** commit the keystore file to Git (it should be in .gitignore)

### Step 3: Configure Signing in build.gradle

Add this to `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('getglory-release.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'getglory'
            keyPassword 'YOUR_KEY_PASSWORD'
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

## Option 2: Use keystore.properties (More Secure)

### Step 1: Create keystore.properties
Create `android/keystore.properties`:

```
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=getglory
storeFile=app/getglory-release.keystore
```

### Step 2: Update build.gradle
Add to `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
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
            ...
        }
    }
}
```

### Step 3: Add to .gitignore
Make sure these are in `.gitignore`:
```
android/keystore.properties
android/app/*.keystore
android/app/*.jks
```

## Building for Play Store

After setting up the keystore:

1. **Build the AAB:**
   ```bash
   cd android
   gradlew bundleRelease
   ```

2. **Find your AAB:**
   `android/app/build/outputs/bundle/release/app-release.aab`

3. **Upload to Play Console:**
   - Go to Google Play Console
   - Your app → Production → Create new release
   - Upload the AAB file
   - Add release notes
   - Review and publish

## Important Notes

- **NEVER lose your keystore file or password** - You cannot update your app on Play Store without it!
- If using Google Play App Signing, you only need an upload key
- Keep backups of your keystore in multiple secure locations

