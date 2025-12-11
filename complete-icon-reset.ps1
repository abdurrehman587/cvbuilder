# Complete Icon Reset Script
# This script performs a FULL cleanup and rebuild of the app icon

Write-Host "Starting COMPLETE icon reset..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop Gradle daemons
Write-Host "1. Stopping Gradle daemons..." -ForegroundColor Yellow
cd android
if (Test-Path "gradlew.bat") {
    .\gradlew.bat --stop 2>$null
}
cd ..
Write-Host "   Gradle daemons stopped" -ForegroundColor Green

# Step 2: Delete ALL build folders
Write-Host "2. Deleting ALL build folders..." -ForegroundColor Yellow
$folders = @(
    "android\app\build",
    "android\build",
    "android\.gradle",
    "build"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Deleted: $folder" -ForegroundColor Gray
    }
}

# Delete all mipmap and drawable folders
Get-ChildItem -Path "android\app\src\main\res" -Directory | Where-Object { $_.Name -like "mipmap-*" -or $_.Name -like "drawable*" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   All build folders deleted" -ForegroundColor Green

# Step 3: Delete old logo files
Write-Host "3. Deleting old logo files..." -ForegroundColor Yellow
if (Test-Path "public\images\glory-logo.png") {
    Remove-Item -Path "public\images\glory-logo.png" -Force
    Write-Host "   Deleted old logo" -ForegroundColor Gray
}
Write-Host "   Old logo files deleted" -ForegroundColor Green

# Step 4: Regenerate logo
Write-Host "4. Regenerating NEW logo..." -ForegroundColor Yellow
npm run generate:logo
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Logo generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   New logo generated" -ForegroundColor Green

# Step 5: Generate Android assets
Write-Host "5. Generating Android assets..." -ForegroundColor Yellow
npm run android:assets
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Asset generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   Android assets generated" -ForegroundColor Green

# Step 6: Sync Capacitor
Write-Host "6. Syncing Capacitor..." -ForegroundColor Yellow
npm run android:sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   Capacitor synced" -ForegroundColor Green

# Step 7: Clear Gradle cache
Write-Host "7. Clearing Gradle cache..." -ForegroundColor Yellow
$gradleCache = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCache) {
    Get-ChildItem -Path $gradleCache -Directory | Where-Object { $_.Name -match "transforms|build-cache" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Gradle cache cleared" -ForegroundColor Green
} else {
    Write-Host "   Gradle cache not found (this is OK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "COMPLETE RESET FINISHED!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. In Android Studio: Build -> Clean Project" -ForegroundColor White
Write-Host "   2. In Android Studio: Build -> Rebuild Project" -ForegroundColor White
Write-Host "   3. UNINSTALL the app from your device completely" -ForegroundColor White
Write-Host "   4. RESTART your device (power off/on)" -ForegroundColor White
Write-Host "   5. Install the NEW build (version 1.0.3)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: You MUST uninstall and restart to clear device cache!" -ForegroundColor Yellow
