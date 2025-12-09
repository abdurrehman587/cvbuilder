# Step-by-Step Guide: Publishing to Google Play Store

## Prerequisites ✅
- ✅ Google Play Developer Account (Already purchased)
- ✅ App tested and working on device
- ✅ All features working correctly

---

## Step 1: Generate App Icons and Splash Screens

First, ensure you have a high-quality logo (at least 1024x1024px) at `public/images/glory-logo.png`.

```bash
npm run android:assets
```

This will generate all required icon and splash screen assets for Android.

---

## Step 2: Update App Version

Edit `android/app/build.gradle`:

1. Open `android/app/build.gradle`
2. Find the `defaultConfig` section
3. Update version numbers:

```gradle
defaultConfig {
    applicationId "com.getglory.app"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1        // Start with 1, increment for each release
    versionName "1.0.0"  // User-visible version (1.0.0, 1.0.1, etc.)
    // ... rest of config
}
```

**Important Notes:**
- `versionCode`: Must be a whole number (1, 2, 3...). Increment for EVERY release.
- `versionName`: User-visible version (1.0.0, 1.0.1, 2.0.0, etc.)

---

## Step 3: Set Up App Signing

### Option A: Google Play App Signing (Recommended - Easiest)

Google will manage your signing key. You only need an upload key.

#### 3.1 Generate Upload Keystore

Open terminal in your project root:

```bash
cd android/app
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

**You'll be asked for:**
- Keystore password: (Choose a strong password - SAVE THIS!)
- Key password: (Can be same as keystore password - SAVE THIS!)
- Your name: Your name or company name
- Organizational unit: (Optional)
- Organization: Your company name
- City: Your city
- State: Your state/province
- Country code: (e.g., PK for Pakistan, US for USA)

**⚠️ CRITICAL:** Save these passwords securely! You'll need them for every update.

#### 3.2 Create key.properties File

Create `android/key.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=../app/upload-keystore.jks
```

Replace `YOUR_STORE_PASSWORD` and `YOUR_KEY_PASSWORD` with your actual passwords.

#### 3.3 Update build.gradle for Signing

Edit `android/app/build.gradle`:

Add this BEFORE the `android {` block:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then add signing configs INSIDE the `android {` block:

```gradle
android {
    namespace "com.getglory.app"
    compileSdk rootProject.ext.compileSdkVersion
    
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
    
    defaultConfig {
        // ... existing config
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

---

## Step 4: Build Release AAB (Android App Bundle)

The Play Store requires an **AAB** (Android App Bundle), not an APK.

```bash
# Build the web app
npm run build

# Sync with Capacitor
npm run android:sync

# Build release AAB
cd android
./gradlew bundleRelease
```

**On Windows (PowerShell):**
```powershell
cd android
.\gradlew.bat bundleRelease
```

The AAB file will be created at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Note:** This file is large (usually 20-50MB). This is normal.

---

## Step 5: Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your developer account
3. Click **"Create app"** button (top right)

### 5.1 App Details

Fill in the form:

- **App name:** `Get Glory`
- **Default language:** English (United States) or your preferred language
- **App or game:** Select **App**
- **Free or paid:** Select **Free** (or Paid if you want to charge)
- **Declarations:** Check all boxes to accept terms

Click **"Create app"**

---

## Step 6: Complete Store Listing

### 6.1 App Details

Go to **"Store presence" → "Main store listing"**

Fill in:

- **App name:** `Get Glory` (50 characters max)
- **Short description:** `Professional CV Builder, ID Card Printing, and Marketplace - All in one app!` (80 characters max)
- **Full description:** 
  ```
  Get Glory is your all-in-one professional toolkit featuring:
  
  🛒 MARKETPLACE
  Browse and shop from a curated collection of products and services.
  
  📄 CV BUILDER
  Create professional CVs with multiple beautiful templates. Build, edit, and download your resume in PDF format. Perfect for job seekers.
  
  🪪 ID CARD PRINTER
  Print multiple ID cards on A4 paper with perfect alignment. Supports front and back printing for professional results.
  
  Features:
  • Easy-to-use interface
  • Professional templates
  • Secure authentication
  • Real-time updates
  • Offline capabilities
  
  Download now and take your career to the next level!
  ```
  (4000 characters max)

### 6.2 Graphics Assets

**App icon:**
- Size: 512 x 512 pixels
- Format: PNG (32-bit with alpha)
- Upload your icon

**Feature graphic:**
- Size: 1024 x 500 pixels
- Format: PNG or JPG
- This appears at the top of your Play Store listing

**Screenshots (Required):**
- **Phone:** At least 2 screenshots
  - Size: 16:9 or 9:16 aspect ratio
  - Minimum: 320px, Maximum: 3840px (longest side)
  - Format: PNG or JPG (24-bit)
- **Tablet (Optional):** 7-inch and 10-inch tablet screenshots

**Tips for screenshots:**
- Show your best features
- Use real device screenshots
- Add text overlays to highlight features
- Show different sections (Marketplace, CV Builder, ID Card)

### 6.3 Categorization

- **App category:** Select **Productivity** or **Business**
- **Tags (Optional):** Add relevant tags like "CV", "Resume", "Marketplace"

### 6.4 Contact Details

- **Email:** Your support email
- **Phone:** (Optional)
- **Website:** `https://www.getglory.pk` (or your website)

Click **"Save"** when done.

---

## Step 7: Set Up Content Rating

1. Go to **"Policy" → "App content"**
2. Click **"Start questionnaire"**
3. Answer all questions honestly:

**For Get Glory app:**
- **Does your app allow users to communicate with each other?** → No (unless you have chat features)
- **Does your app allow users to share content?** → No (unless you have sharing features)
- **Does your app contain user-generated content?** → No (unless users can upload content)
- **Does your app contain violence, gambling, etc.?** → No

4. Complete the questionnaire
5. You'll get a rating (usually "Everyone" for this type of app)
6. Click **"Save"**

---

## Step 8: Set Up Pricing & Distribution

1. Go to **"Monetization setup" → "Products" → "In-app products"** (if you have paid features)
   - Or skip if your app is completely free

2. Go to **"Store presence" → "Pricing & distribution"**

   **Pricing:**
   - Select **Free** (or set price if paid)

   **Countries/regions:**
   - Select **All countries** (or specific countries)

   **Device categories:**
   - ✅ Phones
   - ✅ Tablets (if supported)

   **Program policies:**
   - Read and check all boxes to confirm compliance

   Click **"Save"**

---

## Step 9: Set Up Data Safety

1. Go to **"Policy" → "Data safety"**
2. Click **"Start"**

Answer questions about data collection:

**For Get Glory:**
- **Does your app collect or share any of the required user data types?**
  - If you collect emails for authentication: Yes
  - If you collect names, addresses for orders: Yes
  - If you only use data locally: No

- **Data types you might collect:**
  - ✅ Email address (for authentication)
  - ✅ Name (for user profiles, orders)
  - ✅ Phone number (if collected)
  - ✅ Address (for shipping)
  - ✅ Photos (if users upload profile pictures or CV photos)

- **How is data used?**
  - Account management
  - App functionality
  - Personalization

- **Is data shared with third parties?**
  - Supabase (for backend services) - Yes
  - Payment processors (if any) - Yes/No

3. Complete all sections
4. Click **"Save"**

---

## Step 10: Upload Your App Bundle

1. Go to **"Production"** in the left menu (under "Release")
2. Click **"Create new release"**

3. **Release name:** `1.0.0` (or your version name)

4. **What's new in this release:**
   ```
   Initial release of Get Glory!
   
   Features:
   • Browse and shop from marketplace
   • Create professional CVs with multiple templates
   • Print ID cards with perfect alignment
   • Secure user authentication
   • Real-time updates
   ```

5. **Upload your AAB:**
   - Click **"Upload"** or drag and drop
   - Select: `android/app/build/outputs/bundle/release/app-release.aab`
   - Wait for upload to complete (may take a few minutes)

6. **Review the release:**
   - Check that version code and version name are correct
   - Review "What's new" text

7. Click **"Save"** (don't submit yet!)

---

## Step 11: Complete Required Sections

Before submitting, ensure these are complete (green checkmarks):

✅ **Store listing** - Completed in Step 6
✅ **Content rating** - Completed in Step 7
✅ **Target audience & content** - Set in Step 8
✅ **Data safety** - Completed in Step 9
✅ **App access** - Usually "All functionality is available without restrictions"
✅ **Ads** - Select if you show ads or not
✅ **Content ratings** - Completed in Step 7
✅ **Store settings** - Basic settings

Check each section and complete any missing items.

---

## Step 12: Privacy Policy (Required)

You **MUST** have a privacy policy URL.

1. Go to **"Policy" → "App content" → "Privacy Policy"**

2. Options:
   - **Option A:** Host a privacy policy on your website
     - URL: `https://www.getglory.pk/privacy-policy` (or your URL)
   - **Option B:** Use a privacy policy generator
     - [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
     - [Termly](https://termly.io/products/privacy-policy-generator/)

3. Create a privacy policy that covers:
   - What data you collect
   - How you use the data
   - Third-party services (Supabase)
   - User rights
   - Contact information

4. Enter the URL in Play Console

---

## Step 13: Submit for Review

1. Go back to **"Production" → "Releases"**
2. Review your release
3. Click **"Review release"**
4. Review all sections
5. Click **"Start rollout to Production"** or **"Submit for review"**

**You'll see:**
- "Your app is being published"
- Review typically takes 1-7 days
- You'll receive email notifications

---

## Step 14: Monitor Review Status

1. Check **"Dashboard"** for review status
2. You'll see:
   - ⏳ **Under review** - Google is reviewing
   - ✅ **Published** - Your app is live!
   - ❌ **Rejected** - Check feedback and fix issues

---

## After Publishing

### Update Your App

For future updates:

1. **Update version in `build.gradle`:**
   ```gradle
   versionCode 2        // Increment
   versionName "1.0.1"  // Update
   ```

2. **Build new AAB:**
   ```bash
   npm run build
   npm run android:sync
   cd android
   ./gradlew bundleRelease
   ```

3. **Upload new AAB in Play Console**
4. **Add release notes**
5. **Submit for review**

---

## Common Issues & Solutions

### Issue: "Upload failed"
- **Solution:** Check file size (should be under 150MB), ensure AAB is valid

### Issue: "Missing privacy policy"
- **Solution:** Add privacy policy URL in Policy section

### Issue: "Content rating incomplete"
- **Solution:** Complete the content rating questionnaire

### Issue: "Data safety incomplete"
- **Solution:** Complete all Data Safety sections accurately

### Issue: "App rejected"
- **Solution:** Read feedback, fix issues, resubmit

---

## Quick Checklist Before Submitting

- [ ] App icons generated (`npm run android:assets`)
- [ ] Version code and name set in `build.gradle`
- [ ] Keystore created and configured
- [ ] Release AAB built successfully
- [ ] Store listing completed (name, description, screenshots)
- [ ] Content rating completed
- [ ] Data safety completed
- [ ] Privacy policy URL added
- [ ] Pricing & distribution set
- [ ] AAB uploaded to Production
- [ ] All required sections show green checkmarks
- [ ] App tested thoroughly on device

---

## Support Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Play Console](https://play.google.com/console)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)

---

## Congratulations! 🎉

Once your app is approved, it will be available on the Google Play Store for users to download!

Good luck with your app launch! 🚀

