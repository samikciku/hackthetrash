# Run from repo root:   pwsh hackthetrash/scripts/prepare-deployment.ps1
# Or from hackthetrash: pwsh scripts/prepare-deployment.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "== HackTheTrash: local prep for Vercel + Supabase ==" -ForegroundColor Cyan

Write-Host "`n[1/4] npm install (backend)..." -ForegroundColor Yellow
Push-Location (Join-Path $Root "backend")
try {
  npm install
  if ($LASTEXITCODE -ne 0) { throw "backend npm install failed" }
} finally { Pop-Location }

Write-Host "`n[2/4] npm install (frontend)..." -ForegroundColor Yellow
Push-Location (Join-Path $Root "frontend")
try {
  npm install
  if ($LASTEXITCODE -ne 0) { throw "frontend npm install failed" }
} finally { Pop-Location }

Write-Host "`n[3/4] Typecheck backend (tsc)..." -ForegroundColor Yellow
Push-Location (Join-Path $Root "backend")
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "backend tsc failed" }
} finally { Pop-Location }

Write-Host "`n[4/4] Generate JWT + write .env.vercel-prep.txt (gitignored)..." -ForegroundColor Yellow
$jwt = node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
$out = Join-Path $Root ".env.vercel-prep.txt"
@"
# Generated $(Get-Date -Format o) on this PC — file is gitignored; do not commit.
# Paste into Vercel -> Settings -> Environment Variables (Production).

JWT_SECRET=$jwt

# You fill these after Supabase + Vercel Blob (see docs/SUPABASE-AND-VERCEL-KEYS.md):
# DATABASE_URL=postgresql://...
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
# CORS_ORIGINS=https://YOUR-PROJECT.vercel.app
# PUBLIC_URL=https://YOUR-PROJECT.vercel.app

# Then on THIS PC (after DATABASE_URL is set), run migrations:
#   cd backend
#   `$env:DATABASE_URL = '...your supabase uri...'
#   npm run db:migrate
#   `$env:ADMIN_EMAIL = 'you@email.com'; `$env:ADMIN_PASSWORD = '...'; npm run db:seed-admin
"@ | Set-Content -Path $out -Encoding utf8

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  Open for copy-paste: $out" -ForegroundColor Green
Write-Host "  Next: docs/YOUR-TURN-SUPABASE-VERCEL.md" -ForegroundColor Green
