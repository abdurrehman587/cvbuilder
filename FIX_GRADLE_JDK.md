# Fix Gradle JDK Configuration Error

## Error Message
"Invalid Gradle JDK configuration found. The Gradle JVM is configured as #USE_PROJECT_JDK, but the Project JDK is invalid or not defined."

## Solution: Configure Gradle JDK in Android Studio

### Step 1: Open Android Studio Settings
1. Open **Android Studio**
2. Go to **File → Settings** (or **Ctrl+Alt+S**)
   - On Mac: **Android Studio → Preferences** (or **Cmd+,**)

### Step 2: Navigate to Gradle Settings
1. In the left sidebar, expand **Build, Execution, Deployment**
2. Expand **Build Tools**
3. Click on **Gradle**

### Step 3: Configure Gradle JDK
1. Look for the **"Gradle JDK"** dropdown at the top
2. Click the dropdown and select one of these options:
   - **"jbr-17"** (JetBrains Runtime 17) - RECOMMENDED
   - **"jbr-11"** (JetBrains Runtime 11)
   - Or any other JDK version that shows as available

3. If no JDK is listed:
   - Click **"Download JDK..."** 
   - Select **"Version 17"** and **"Vendor: JetBrains Runtime"**
   - Click **Download**
   - After download, select it from the dropdown

### Step 4: Apply and Sync
1. Click **Apply** (bottom right)
2. Click **OK**
3. Android Studio will automatically sync Gradle
4. Wait for the sync to complete

### Alternative: Use Project Structure
If the above doesn't work:

1. Go to **File → Project Structure** (or **Ctrl+Alt+Shift+S**)
2. Click **SDK Location** in the left sidebar
3. Under **JDK location**, ensure a valid JDK path is set
4. Common paths:
   - `C:\Users\Glory\AppData\Local\Android\Sdk\jbr`
   - `C:\Program Files\Android\Android Studio\jbr`
5. Click **OK**
6. Then go back to **File → Settings → Build Tools → Gradle**
7. Set **Gradle JDK** to match the JDK location

### Verify Fix
After configuring:
1. The error message should disappear
2. You should be able to build the project
3. Try: **Build → Clean Project** (should work without errors)

## Troubleshooting

### If JDK is still not found:
1. **Check Android Studio installation:**
   - Android Studio usually includes a bundled JDK (JBR)
   - It should be at: `C:\Users\Glory\AppData\Local\Android\Sdk\jbr`

2. **Manually set JAVA_HOME (if needed):**
   - Open PowerShell as Administrator
   - Run: `[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Users\Glory\AppData\Local\Android\Sdk\jbr', 'User')`
   - Restart Android Studio

3. **Reinstall Android Studio (last resort):**
   - If nothing works, reinstall Android Studio
   - This will ensure the bundled JDK is properly installed

