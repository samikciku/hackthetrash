# Install backend + frontend deps on Windows / PowerShell.
# Usage:  pwsh ./scripts/setup.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Installing backend deps..." -ForegroundColor Cyan
Push-Location (Join-Path $root "backend"); npm install; Pop-Location

Write-Host "Installing frontend deps..." -ForegroundColor Cyan
Push-Location (Join-Path $root "frontend"); npm install; Pop-Location

Write-Host "Done. Run scripts/dev.ps1 to start." -ForegroundColor Green
