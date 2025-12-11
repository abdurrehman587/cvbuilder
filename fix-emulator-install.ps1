# Fix Emulator Installation Issue
# This script helps resolve "already running" errors

Write-Host "Fixing emulator installation issue..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill the specific process if it exists
Write-Host "1. Stopping process 15572 (if running)..." -ForegroundColor Yellow
$process = Get-Process -Id 15572 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id 15572 -Force -ErrorAction SilentlyContinue
    Write-Host "   Process stopped" -ForegroundColor Green
} else {
    Write-Host "   Process not found (may have already stopped)" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Stop all ADB processes
Write-Host "2. Stopping ADB server..." -ForegroundColor Yellow
adb kill-server 2>$null
Start-Sleep -Seconds 2
adb start-server 2>$null
Write-Host "   ADB server restarted" -ForegroundColor Green
Write-Host ""

# Step 3: Uninstall app from device/emulator
Write-Host "3. Uninstalling app from device..." -ForegroundColor Yellow
adb uninstall com.getglory.app 2>&1 | Out-Null
Write-Host "   App uninstalled (if it was installed)" -ForegroundColor Green
Write-Host ""

# Step 4: List devices
Write-Host "4. Checking connected devices..." -ForegroundColor Yellow
$devices = adb devices
Write-Host $devices
Write-Host ""

Write-Host "SOLUTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Restart Emulator in Android Studio" -ForegroundColor Yellow
Write-Host "  1. In Android Studio, click the emulator dropdown" -ForegroundColor White
Write-Host "  2. Click the 'Stop' button (square icon) next to your emulator" -ForegroundColor White
Write-Host "  3. Wait 5 seconds" -ForegroundColor White
Write-Host "  4. Click 'Play' button to start emulator again" -ForegroundColor White
Write-Host "  5. Wait for emulator to fully boot" -ForegroundColor White
Write-Host "  6. Try installing again" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Use Cold Boot" -ForegroundColor Yellow
Write-Host "  1. In Android Studio, click emulator dropdown" -ForegroundColor White
Write-Host "  2. Click the dropdown arrow next to your emulator" -ForegroundColor White
Write-Host "  3. Select 'Cold Boot Now'" -ForegroundColor White
Write-Host "  4. Wait for emulator to fully boot" -ForegroundColor White
Write-Host "  5. Try installing again" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Install via ADB (Terminal)" -ForegroundColor Yellow
Write-Host "  cd android" -ForegroundColor White
Write-Host "  .\gradlew.bat installDebug" -ForegroundColor White
Write-Host ""

Write-Host "Option 4: Close and Restart Android Studio" -ForegroundColor Yellow
Write-Host "  Sometimes Android Studio gets confused about device state" -ForegroundColor Gray
Write-Host "  Close Android Studio completely and reopen it" -ForegroundColor White

