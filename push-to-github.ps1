# Script to push changes to GitHub
# Make sure Git is installed and you're in the cvbuilder-main directory

# Navigate to project directory
Set-Location $PSScriptRoot

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Cyan
git status

# Stage all changes (including deletions)
Write-Host "`nStaging all changes..." -ForegroundColor Cyan
git add -A

# Commit changes
Write-Host "`nCommitting changes..." -ForegroundColor Cyan
git commit -m "Remove unnecessary files from project"

# Check if remote exists
$remoteExists = git remote | Select-String -Pattern "origin"
if (-not $remoteExists) {
    Write-Host "`nNo remote repository found. Please add your GitHub repository URL:" -ForegroundColor Yellow
    Write-Host "Example: git remote add origin https://github.com/username/repository.git" -ForegroundColor Gray
    Write-Host "`nAfter adding the remote, run this script again or execute:" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor Gray
    exit
}

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
$branch = git branch --show-current
if (-not $branch) {
    $branch = "main"
    git branch -M main
}

git push -u origin $branch

Write-Host "`nDone! Changes have been pushed to GitHub." -ForegroundColor Green

