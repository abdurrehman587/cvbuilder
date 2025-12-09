# Force Icon Update Script
# This script ensures the new icon appears by forcing a complete rebuild

Write-Host "🔄 Forcing complete icon update..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean Android build
Write-Host "1️⃣ Cleaning Android build..." -ForegroundColor Yellow
cd android
if (Test-Path "gradlew.bat") {
    .\gradlew.bat clean 2>$null
}
cd ..
Write-Host "   ✅ Build cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Delete build folders
Write-Host "2️⃣ Deleting build folders..." -ForegroundColor Yellow
$folders = @(
    "android\app\build",
    "android\build"
)
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   🗑️  Deleted: $folder" -ForegroundColor Gray
    }
}
Write-Host "   ✅ Build folders deleted" -ForegroundColor Green
Write-Host ""

Write-Host "✨ READY TO BUILD!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 CRITICAL STEPS TO SEE NEW ICON:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. In Android Studio:" -ForegroundColor Yellow
Write-Host "   - Build → Clean Project" -ForegroundColor White
Write-Host "   - Build → Rebuild Project" -ForegroundColor White
Write-Host ""
Write-Host "2. On your device:" -ForegroundColor Yellow
Write-Host "   - UNINSTALL the app completely" -ForegroundColor White
Write-Host "   - RESTART your device (power off/on)" -ForegroundColor White
Write-Host "   - This clears the launcher icon cache" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Install the new version (1.0.5):" -ForegroundColor Yellow
Write-Host "   - Build and install from Android Studio" -ForegroundColor White
Write-Host "   - OR: cd android; .\gradlew.bat installDebug" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Device restart is REQUIRED to clear icon cache!" -ForegroundColor Red
Write-Host "   Android launchers cache icons aggressively." -ForegroundColor Gray
Write-Host "   Without restart, you will see the old icon even with new APK." -ForegroundColor Gray

