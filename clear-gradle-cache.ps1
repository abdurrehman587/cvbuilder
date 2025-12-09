# Clear Gradle Cache and Project Build Folders
Write-Host "=== CLEARING GRADLE CACHE ===" -ForegroundColor Yellow

# Clear project build folders (most important)
Write-Host "`n1. Clearing project build folders..." -ForegroundColor Cyan
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   ✓ Cleared project build folders" -ForegroundColor Green

# Try to clear the specific problematic cache folder if it exists
Write-Host "`n2. Checking for problematic cache folder..." -ForegroundColor Cyan
$problematicFolder = "$env:USERPROFILE\.gradle\caches\8.13\transforms"
if (Test-Path $problematicFolder) {
    try {
        Remove-Item -Path $problematicFolder -Recurse -Force -ErrorAction Stop
        Write-Host "   ✓ Cleared transforms cache" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Could not clear (may be locked)" -ForegroundColor Yellow
        Write-Host "     You may need to close Android Studio and try again" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✓ Transforms folder doesn't exist (this is fine)" -ForegroundColor Green
}

Write-Host "`n✅ DONE!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Close Android Studio COMPLETELY" -ForegroundColor White
Write-Host "2. Wait 10 seconds" -ForegroundColor White
Write-Host "3. Reopen Android Studio" -ForegroundColor White
Write-Host "4. Wait for Gradle sync to complete" -ForegroundColor White
Write-Host "5. Try Build → Clean Project" -ForegroundColor White
