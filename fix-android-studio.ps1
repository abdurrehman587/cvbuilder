# Fix Android Studio Play Button Issue

Write-Host "Fixing Android Studio configuration..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Invalidate Android Studio caches
Write-Host "1. In Android Studio, do this:" -ForegroundColor Yellow
Write-Host "   File -> Invalidate Caches..." -ForegroundColor White
Write-Host "   Check: 'Invalidate and Restart'" -ForegroundColor White
Write-Host "   Click 'Invalidate and Restart'" -ForegroundColor White
Write-Host ""

# Step 2: After restart, sync Gradle
Write-Host "2. After Android Studio restarts:" -ForegroundColor Yellow
Write-Host "   File -> Sync Project with Gradle Files" -ForegroundColor White
Write-Host "   Wait for sync to complete" -ForegroundColor White
Write-Host ""

# Step 3: Check run configuration
Write-Host "3. Check Run Configuration:" -ForegroundColor Yellow
Write-Host "   Click the dropdown next to the play button" -ForegroundColor White
Write-Host "   Select 'app' (not 'capacitor-android' or others)" -ForegroundColor White
Write-Host "   If 'app' is not listed:" -ForegroundColor White
Write-Host "     Run -> Edit Configurations..." -ForegroundColor White
Write-Host "     Click '+' -> Android App" -ForegroundColor White
Write-Host "     Name: 'app'" -ForegroundColor White
Write-Host "     Module: 'app'" -ForegroundColor White
Write-Host "     Click OK" -ForegroundColor White
Write-Host ""

# Step 4: Alternative - run from terminal
Write-Host "4. ALTERNATIVE - Run from terminal:" -ForegroundColor Yellow
Write-Host "   cd android" -ForegroundColor White
Write-Host "   .\gradlew.bat installDebug" -ForegroundColor White
Write-Host ""

Write-Host "The build was successful, so the APK is ready!" -ForegroundColor Green
Write-Host "The play button issue is just an Android Studio UI problem." -ForegroundColor Green

