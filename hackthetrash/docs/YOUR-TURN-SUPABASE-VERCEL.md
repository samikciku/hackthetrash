# After local prep — **you** do these on Supabase & Vercel

On your PC you should have already run:

```powershell
cd hackthetrash
powershell -ExecutionPolicy Bypass -File scripts/prepare-deployment.ps1
```

That installs dependencies, checks the backend build, and creates **`hackthetrash/.env.vercel-prep.txt`** with a generated **`JWT_SECRET`** (gitignored).

---

## A. Supabase (browser only)

1. **https://supabase.com** → **New project** → save the **database password**.
2. **SQL Editor** → run:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Project Settings** (gear) → **Database** → **Connection string** → **URI** (use **pooling / transaction** if offered for serverless).
4. Put your **password** into the URI → copy the full string → append **`?sslmode=require`** if not already there.  
   This is your **`DATABASE_URL`**.

5. **On your PC again** (PowerShell, in `hackthetrash/backend`):

   ```powershell
   $env:DATABASE_URL = "PASTE_SUPABASE_URI_HERE"
   npm run db:migrate
   $env:ADMIN_EMAIL = "your@email.com"
   $env:ADMIN_PASSWORD = "ChooseAStrongPassword"
   npm run db:seed-admin
   ```

---

## B. Vercel (browser only)

1. **Storage** → **Blob** → create / link → copy **Read/Write token** → **`BLOB_READ_WRITE_TOKEN`**.
2. **Settings** → **Environment Variables** → add (Production; mark **Sensitive** where applicable):

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | From Supabase step A.4 |
   | `JWT_SECRET` | From `.env.vercel-prep.txt` on your PC |
   | `BLOB_READ_WRITE_TOKEN` | From Blob step B.1 |
   | `CORS_ORIGINS` | `https://your-project.vercel.app` |
   | `PUBLIC_URL` | Same URL |

   Do **not** set `NEXT_PUBLIC_API_URL`.

3. **Deployments** → **Redeploy** latest (env vars apply after redeploy).

4. Open **`/api/health`** — all `checks.*` should be `true` except you can ignore fine details; `databaseUrl`, `jwtSecret`, `blobToken` must be true.

---

Full detail: [SUPABASE-AND-VERCEL-KEYS.md](./SUPABASE-AND-VERCEL-KEYS.md)
