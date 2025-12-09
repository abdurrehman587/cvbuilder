# Fix Gradle Cache Issues
Write-Host "=== FIXING GRADLE CACHE ===" -ForegroundColor Yellow

# Stop all Gradle daemons
Write-Host "`n1. Stopping Gradle daemons..." -ForegroundColor Cyan
cd android
.\gradlew --stop
cd ..

# Close any processes that might be locking the cache
Write-Host "`n2. Checking for locked processes..." -ForegroundColor Cyan
$gradleProcesses = Get-Process | Where-Object { $_.ProcessName -like "*gradle*" -or $_.ProcessName -like "*java*" } | Where-Object { $_.Path -like "*gradle*" }
if ($gradleProcesses) {
    Write-Host "Found Gradle processes. Please close Android Studio and try again." -ForegroundColor Red
    Write-Host "Processes found:" -ForegroundColor Yellow
    $gradleProcesses | ForEach-Object { Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" }
} else {
    Write-Host "No Gradle processes found. Good!" -ForegroundColor Green
}

# Clear Gradle cache
Write-Host "`n3. Clearing Gradle cache..." -ForegroundColor Cyan
$gradleCachePath = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCachePath) {
    try {
        Remove-Item -Path "$gradleCachePath\8.13\transforms" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Cleared transforms cache" -ForegroundColor Green
    } catch {
        Write-Host "Could not clear cache. Please close Android Studio and manually delete:" -ForegroundColor Yellow
        Write-Host "  $gradleCachePath\8.13\transforms" -ForegroundColor Yellow
    }
} else {
    Write-Host "Gradle cache path not found" -ForegroundColor Yellow
}

# Clear project build folders
Write-Host "`n4. Clearing project build folders..." -ForegroundColor Cyan
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleared project build folders" -ForegroundColor Green

Write-Host "`n✅ DONE! Now:" -ForegroundColor Green
Write-Host "1. Close Android Studio completely" -ForegroundColor White
Write-Host "2. Wait 10 seconds" -ForegroundColor White
Write-Host "3. Reopen Android Studio" -ForegroundColor White
Write-Host "4. Wait for Gradle sync to complete" -ForegroundColor White
Write-Host "5. Try Build → Clean Project again" -ForegroundColor White

