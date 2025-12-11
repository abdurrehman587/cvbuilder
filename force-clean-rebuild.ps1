# Force Complete Clean Rebuild
# This ensures the APK contains the NEW assets

Write-Host "🧹 FORCING COMPLETE CLEAN REBUILD..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean Gradle
Write-Host "1️⃣ Cleaning Gradle build..." -ForegroundColor Yellow
cd android
if (Test-Path "gradlew.bat") {
    .\gradlew.bat clean 2>&1 | Out-Null
    Write-Host "   ✅ Gradle cleaned" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Gradle wrapper not found" -ForegroundColor Yellow
}
cd ..

# Step 2: Delete ALL build folders
Write-Host "2️⃣ Deleting ALL build folders..." -ForegroundColor Yellow
$folders = @(
    "android\app\build",
    "android\build",
    "android\.gradle"
)
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   🗑️  Deleted: $folder" -ForegroundColor Gray
    }
}
Write-Host "   ✅ All build folders deleted" -ForegroundColor Green
Write-Host ""

# Step 3: Verify assets exist
Write-Host "3️⃣ Verifying new assets exist..." -ForegroundColor Yellow
$iconPath = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png"
$splashPath = "android\app\src\main\res\drawable\splash.png"
$logoPath = "public\images\glory-logo.png"

if (Test-Path $iconPath) {
    $icon = Get-Item $iconPath
    Write-Host "   ✅ Icon: $([math]::Round($icon.Length/1KB, 2)) KB, Modified: $($icon.LastWriteTime)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Icon not found!" -ForegroundColor Red
}

if (Test-Path $splashPath) {
    $splash = Get-Item $splashPath
    Write-Host "   ✅ Splash: $([math]::Round($splash.Length/1KB, 2)) KB, Modified: $($splash.LastWriteTime)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Splash not found!" -ForegroundColor Red
}

if (Test-Path $logoPath) {
    Write-Host "   ✅ Logo source exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Logo source not found!" -ForegroundColor Red
}
Write-Host ""

Write-Host "✨ CLEAN COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. In Android Studio:" -ForegroundColor Yellow
Write-Host "   - Build → Clean Project" -ForegroundColor White
Write-Host "   - Build → Rebuild Project" -ForegroundColor White
Write-Host "   - Wait for build to complete" -ForegroundColor White
Write-Host ""
Write-Host "2. Install on device:" -ForegroundColor Yellow
Write-Host "   - Uninstall old app from device" -ForegroundColor White
Write-Host "   - Install the NEW APK (version 1.0.5)" -ForegroundColor White
Write-Host "   - Restart device to clear icon cache" -ForegroundColor White
Write-Host ""
Write-Host "3. Verify:" -ForegroundColor Yellow
Write-Host "   - Check app icon shows purple star" -ForegroundColor White
Write-Host "   - Check splash screen shows purple star" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: This rebuild will create a FRESH APK with new assets!" -ForegroundColor Red

