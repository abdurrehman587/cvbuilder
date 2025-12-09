# Logo Image Modification Guide

## Current Issue

Your logo (`public/images/glory-logo.png`) is being cropped in the splash screen because:
- The logo has a **tall aspect ratio** (crown + leaves + globe + text stacked vertically)
- Even with 35% padding, the vertical content exceeds the available space
- The logo needs to be more **square-shaped** (1:1 aspect ratio) to fit properly

## Ideal Logo Specifications

### For App Icon & Splash Screen:
- **Aspect Ratio:** 1:1 (square) - **CRITICAL**
- **Recommended Size:** 1024x1024 pixels (or larger, but must be square)
- **Padding/Whitespace:** Add generous padding around all logo elements
- **Content Area:** Logo elements should occupy about 60-70% of the image, with 30-40% whitespace around them

## What to Modify

### Option 1: Add More Whitespace (Easiest)
1. Open `public/images/glory-logo.png` in an image editor (Photoshop, GIMP, Canva, etc.)
2. **Increase canvas size** to make it square (1:1 ratio)
3. **Add equal padding** on all sides (top, bottom, left, right)
4. **Center the logo** in the new square canvas
5. Save as PNG with transparent background (if possible) or white background

### Option 2: Reposition Elements (Better Fit)
1. **Reduce vertical spacing** between crown, leaves, globe, and text
2. **Make the logo more compact** vertically
3. **Add horizontal padding** to make it square
4. Consider making text smaller or repositioning it

### Option 3: Create Separate Versions (Best Solution)
Create two versions:
- **Icon version:** Crown + leaves only (no text) - for app icon
- **Splash version:** Full logo with better proportions - for splash screen

## Step-by-Step Instructions

### Using Online Tools (Canva, Photopea, etc.)

1. **Open your logo** in the editor
2. **Check current dimensions:**
   - Note the width and height
   - Calculate if it's square (width = height)

3. **Make it square:**
   - If width > height: Increase canvas height to match width
   - If height > width: Increase canvas width to match height
   - Add equal padding on all sides

4. **Add padding:**
   - Add 30-40% whitespace around the logo
   - Example: If logo is 1000px tall, add 300-400px padding on all sides
   - Final size should be square (e.g., 1600x1600px or 2000x2000px)

5. **Center the logo:**
   - Ensure logo is perfectly centered in the square canvas
   - Use alignment tools in your editor

6. **Export:**
   - Save as PNG format
   - Maintain high quality (at least 1024x1024px)
   - Save to: `public/images/glory-logo.png` (replace existing)

### Using Photoshop/GIMP

1. **Open** `public/images/glory-logo.png`
2. **Image → Canvas Size** (or Image → Resize Canvas)
3. **Set to square:**
   - Make width and height equal
   - Use the larger dimension as both width and height
4. **Add padding:**
   - Increase canvas size by 30-40%
   - Anchor: Center
5. **Save** as PNG

### Using Command Line (ImageMagick)

If you have ImageMagick installed:

```bash
# Make square and add 35% padding
magick public/images/glory-logo.png -background white -gravity center -extent 135%x135% public/images/glory-logo.png
```

## Quick Test After Modification

After modifying the logo:

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
   - Uninstall old app
   - Install new version
   - Check app icon and splash screen

## Recommended Dimensions

### Minimum Size:
- **1024x1024 pixels** (square)

### Optimal Size:
- **2048x2048 pixels** (square) - for high-quality display on all devices

### Maximum Size:
- **4096x4096 pixels** (square) - for future-proofing

## Visual Guide

```
BEFORE (Tall Logo):
┌─────────────┐
│    Crown    │ ← Cut off at top
│   Leaves    │
│    Globe    │
│    Text     │ ← Cut off at bottom
└─────────────┘
  (Wide but tall)

AFTER (Square Logo with Padding):
┌─────────────────────┐
│                     │ ← Padding
│      ┌───────┐      │
│      │ Crown │      │
│      │Leaves │      │ ← Logo centered
│      │ Globe │      │
│      │ Text  │      │
│      └───────┘      │
│                     │ ← Padding
└─────────────────────┘
    (Square, 1:1 ratio)
```

## Tips

1. **Keep it simple:** Don't make the logo too complex
2. **Test frequently:** Regenerate assets and test after each modification
3. **Backup original:** Keep a copy of the original logo before modifying
4. **Transparent background:** If possible, use transparent background (PNG with alpha)
5. **High resolution:** Use at least 1024x1024px for best quality

## After Modification

Once you've modified the logo:

1. Replace `public/images/glory-logo.png` with your new square version
2. Run: `npm run android:assets`
3. Run: `npm run build && npm run android:sync`
4. Test on device

The logo should now fit perfectly in both the app icon and splash screen!

