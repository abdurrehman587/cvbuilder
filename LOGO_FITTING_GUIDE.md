# Logo Fitting Guide for App Icon and Splash Screen

## Current Settings

### App Icon
- **Padding:** 35% (maximum recommended)
- **Source:** `public/images/glory-logo.png`
- **Status:** ✅ Appears to fit correctly based on home screen

### Splash Screen
- **Padding:** 35% (maximum recommended)
- **Scale Type:** `FIT_CENTER` (scales to fit while maintaining aspect ratio)
- **Source:** `public/images/glory-logo.png`
- **Status:** ⚠️ Still showing some cropping (crown cut off at top, text cut off at bottom)

## Issue Analysis

The splash screen logo is still being cropped because:
1. The logo image (`glory-logo.png`) likely has a tall aspect ratio (crown + leaves + globe + text)
2. Even with 35% padding, the vertical content exceeds the available space
3. `FIT_CENTER` scales to fit, but if the logo is very tall, it may still be cropped

## Solutions

### Option 1: Increase Padding Further (Quick Fix)
If 35% isn't enough, you can try:
- **40% padding** for splash screen (may make logo too small)
- **45% padding** for splash screen (logo will be quite small)

### Option 2: Adjust Logo Source Image (Recommended)
The best solution is to create a version of the logo that:
- Has more horizontal padding/whitespace around the logo elements
- Is more square-shaped (1:1 aspect ratio) rather than tall
- Has the crown, leaves, globe, and text better proportioned to fit in a square

### Option 3: Use Different Splash Screen Image
Create a separate splash screen image that:
- Only includes the crown and leaves (without the text)
- Or has the text positioned differently
- Is optimized for a square/landscape format

## Current Configuration Files

### `assets.config.ts`
```typescript
android: {
  icon: {
    source: './public/images/glory-logo.png',
    target: './android/app/src/main/res',
    padding: '35%',
  },
  splash: {
    source: './public/images/glory-logo.png',
    target: './android/app/src/main/res',
    width: 512,
    height: 512,
    padding: '35%',
  },
}
```

### `capacitor.config.ts`
```typescript
SplashScreen: {
  androidScaleType: 'FIT_CENTER',
  // ... other settings
}
```

## Regeneration Steps

After making any changes:

1. **Regenerate assets:**
   ```bash
   npm run android:assets
   ```

2. **Rebuild and sync:**
   ```bash
   npm run build
   npm run android:sync
   ```

3. **Test on device:**
   - Uninstall the old app
   - Install the new version
   - Check app icon on home screen
   - Check splash screen when launching app

## Recommendations

1. **For App Icon:** Current 35% padding appears to work well ✅

2. **For Splash Screen:** 
   - Try increasing to 40% padding if logo is still cropped
   - OR create a modified logo image with better proportions
   - OR use a simplified version (crown + leaves only) for splash screen

3. **Test on multiple devices:**
   - Different screen sizes may show different results
   - Test on both small and large Android devices

