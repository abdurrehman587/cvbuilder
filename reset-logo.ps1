# Complete Logo Reset Script
Write-Host "=== CLEANING EVERYTHING ===" -ForegroundColor Yellow

# Remove build folders
Write-Host "Removing build folders..." -ForegroundColor Cyan
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue

# Remove old assets
Write-Host "Removing old assets..." -ForegroundColor Cyan
Remove-Item -Path "android\app\src\main\res\mipmap-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\src\main\res\drawable*" -Recurse -Force -ErrorAction SilentlyContinue

# Remove old logo
Write-Host "Removing old logo..." -ForegroundColor Cyan
Remove-Item -Path "public\images\glory-logo.png" -Force -ErrorAction SilentlyContinue

Write-Host "`n=== REGENERATING LOGO ===" -ForegroundColor Yellow
npm run generate:logo

Write-Host "`n=== GENERATING ASSETS ===" -ForegroundColor Yellow
npm run android:assets

Write-Host "`n=== SYNCING WITH CAPACITOR ===" -ForegroundColor Yellow
npm run android:sync

Write-Host "`n✅ DONE! Now:" -ForegroundColor Green
Write-Host "1. Open Android Studio" -ForegroundColor White
Write-Host "2. Build → Clean Project" -ForegroundColor White
Write-Host "3. Build → Assemble Project" -ForegroundColor White
Write-Host "4. UNINSTALL the app from your device" -ForegroundColor Yellow
Write-Host "5. Run the app from Android Studio" -ForegroundColor White

