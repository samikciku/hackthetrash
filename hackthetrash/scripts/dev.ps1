# Start backend (:4000) and frontend (:3000) in dev mode on Windows / PowerShell.
# Usage:  pwsh ./scripts/dev.ps1
#
# Uses cmd.exe so `npm` resolves correctly (Start-Process "npm" alone often fails
# because npm is a .cmd / PowerShell shim, not a direct executable).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting backend on :4000 and frontend on :3000" -ForegroundColor Green

$backend = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory (Join-Path $root "backend") `
    -PassThru -NoNewWindow

$frontend = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory (Join-Path $root "frontend") `
    -PassThru -NoNewWindow

try {
    Wait-Process -Id $backend.Id, $frontend.Id
} finally {
    if (-not $backend.HasExited)  { Stop-Process -Id $backend.Id  -Force -ErrorAction SilentlyContinue }
    if (-not $frontend.HasExited) { Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue }
}
