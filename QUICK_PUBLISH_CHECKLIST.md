# Quick Publishing Checklist

Use this checklist to ensure you've completed all steps before submitting to Play Store.

## ✅ Pre-Publishing Steps

### 1. App Assets
- [ ] Generated app icons: `npm run android:assets`
- [ ] App icon (512x512px) ready
- [ ] Feature graphic (1024x500px) ready
- [ ] Screenshots prepared (at least 2 for phone)

### 2. App Configuration
- [ ] Version code set in `android/app/build.gradle` (start with 1)
- [ ] Version name set in `android/app/build.gradle` (e.g., "1.0.0")
- [ ] App name confirmed: "Get Glory"
- [ ] Package name confirmed: "com.getglory.app"

### 3. App Signing
- [ ] Upload keystore created
- [ ] `android/key.properties` file created with passwords
- [ ] `build.gradle` updated with signing config
- [ ] Keystore passwords saved securely (you'll need them for updates!)

### 4. Build Release
- [ ] Web app built: `npm run build`
- [ ] Capacitor synced: `npm run android:sync`
- [ ] Release AAB built: `cd android && ./gradlew bundleRelease`
- [ ] AAB file located: `android/app/build/outputs/bundle/release/app-release.aab`

### 5. Testing
- [ ] App tested on physical device
- [ ] All features working (Marketplace, CV Builder, ID Card)
- [ ] Authentication working
- [ ] Checkout flow tested
- [ ] No crashes or major bugs

## ✅ Play Console Setup

### 6. Store Listing
- [ ] App name entered
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App icon uploaded (512x512px)
- [ ] Feature graphic uploaded (1024x500px)
- [ ] At least 2 phone screenshots uploaded
- [ ] App category selected
- [ ] Contact details entered

### 7. Content & Policies
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] Privacy policy URL added (REQUIRED!)
- [ ] Target audience set
- [ ] Pricing set (Free/Paid)

### 8. Release
- [ ] AAB file uploaded to Production
- [ ] Release name set (e.g., "1.0.0")
- [ ] "What's new" text added
- [ ] Release reviewed

### 9. Final Checks
- [ ] All required sections show ✅ (green checkmarks)
- [ ] No warnings or errors in Play Console
- [ ] Ready to submit for review

## 🚀 Submit!

- [ ] Click "Start rollout to Production"
- [ ] Confirm submission
- [ ] Wait for review (1-7 days typically)
- [ ] Monitor email for updates

## 📝 After Submission

- [ ] Check Play Console dashboard regularly
- [ ] Respond to any review feedback quickly
- [ ] Celebrate when approved! 🎉

---

## Common Mistakes to Avoid

❌ **Don't forget:**
- Privacy policy URL (REQUIRED)
- Content rating (REQUIRED)
- Data safety form (REQUIRED)
- At least 2 screenshots (REQUIRED)
- App icon (REQUIRED)

❌ **Don't:**
- Submit without testing thoroughly
- Use placeholder text in descriptions
- Upload wrong version code
- Forget to save keystore passwords
- Skip any required sections

---

## Need Help?

Refer to `PLAY_STORE_PUBLISHING_GUIDE.md` for detailed step-by-step instructions.

Good luck! 🚀

