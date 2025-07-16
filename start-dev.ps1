Write-Host "Starting CV Builder Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if port 3000 is in use
Write-Host "Checking if port 3000 is in use..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "Port 3000 is in use. Stopping existing process..." -ForegroundColor Red
    foreach ($connection in $port3000) {
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Check if port 5000 is in use
Write-Host "Checking if port 5000 is in use..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "Port 5000 is in use. Stopping existing process..." -ForegroundColor Red
    foreach ($connection in $port5000) {
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Starting development environment..." -ForegroundColor Green
Write-Host "This will start both the React app (port 3000) and the PDF server (port 5000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start the development environment
npm run dev 