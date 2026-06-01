# Push only the hackthetrash/ app tree to https://github.com/samikciku/hackthetrash-2 (flat repo).
# Run from anywhere:  pwsh hackthetrash/scripts/push-app-remote.ps1
# Requires git remote "app" -> hackthetrash-2.git (see docs/GIT-APP-REMOTE.md).
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot
Write-Host "git subtree push --prefix=hackthetrash app main" -ForegroundColor Cyan
Write-Host "(repo root: $repoRoot)" -ForegroundColor DarkGray
git subtree push --prefix=hackthetrash app main
