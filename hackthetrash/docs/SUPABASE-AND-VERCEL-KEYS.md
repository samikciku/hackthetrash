# Exact steps: Supabase database + Vercel keys (HackTheTrash)

Follow **in order**. You need accounts on **[Supabase](https://supabase.com)** and **[Vercel](https://vercel.com)**.

HackTheTrash needs **PostgreSQL + PostGIS**. Supabase supports that — you do **not** need a separate “map database” product.

---

## Part 1 — Create the database on Supabase

### 1.1 New project

1. Go to **https://supabase.com** → sign in → **New project**.
2. Choose organization, **name** (e.g. `hackthetrash`), **region** (pick closest to your users, e.g. `Frankfurt` for Kosovo/EU).
3. Set a **strong database password** → **Save this password somewhere safe** (you cannot see it again in full; you can reset it later in Supabase if lost).
4. Wait until the project finishes provisioning (green / “Project is ready”).

### 1.2 Enable PostGIS (required)

1. In the Supabase project, open the left sidebar → **SQL Editor**.
2. Click **New query**.
3. Paste exactly:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

4. Click **Run** (or **Ctrl+Enter**). You should see **Success** with no errors.

### 1.3 Copy the database connection string (for `DATABASE_URL`)

1. Left sidebar → **Project Settings** (gear icon) → **Database**.
2. Scroll to **Connection string** (sometimes under **Database settings** / **Connection parameters**).
3. Choose:
   - **URI** tab (or “Connection string” with URI format).
   - For **Vercel serverless**, prefer the **Connection pooling** / **Transaction** mode string if Supabase shows separate “Direct” vs “Pooler” — use the **pooler / transaction** URI for `DATABASE_URL` on Vercel when available (better for many short-lived connections).
4. Copy the string. It looks like:

   `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

5. **Replace `[YOUR-PASSWORD]`** with the database password you set in step 1.1 (Supabase often shows `[YOUR-PASSWORD]` as a placeholder in the copied URI).

6. If the URI does not already include SSL and your client complains, append (before `#` if any):

   `?sslmode=require`

   Example end of string: `...5432/postgres?sslmode=require`

**This final string is your `DATABASE_URL`.** Keep it secret.

> **If `npm run db:migrate` fails** with pooler-only errors, use the **Direct connection** URI (port **5432**) **only on your laptop** to run migrations once; keep the **pooler** URI in Vercel for the live app. Same database, two URLs — both in Supabase → **Project Settings → Database**.

---

## Part 2 — Create tables (migrations) using that database

Do this **on your computer** (not inside Vercel’s UI).

1. Clone/open the repo and go to the backend folder:

   ```bash
   cd hackthetrash/backend
   ```

2. Install dependencies (once):

   ```bash
   npm install
   ```

3. Set `DATABASE_URL` for **this terminal only** (PowerShell example — use your real string in quotes):

   ```powershell
   $env:DATABASE_URL = "postgresql://postgres.xxxx:YOUR_PASSWORD@....supabase.com:6543/postgres?sslmode=require"
   ```

   macOS / Linux:

   ```bash
   export DATABASE_URL="postgresql://postgres.xxxx:YOUR_PASSWORD@....supabase.com:6543/postgres?sslmode=require"
   ```

4. Run migrations:

   ```bash
   npm run db:migrate
   ```

   You should see lines like `Running 001_init.sql...` and **Migrations complete**.

5. (Optional but recommended) Create an admin login for `/admin`:

   ```powershell
   $env:ADMIN_EMAIL = "you@yourdomain.com"
   $env:ADMIN_PASSWORD = "ChooseAStrongUniquePassword123!"
   npm run db:seed-admin
   ```

   Remember **email + password** — you’ll use them on Vercel at `/admin/login`.

---

## Part 3 — Vercel Blob (photos; required on Vercel)

Supabase is **only the SQL database**. Report **images** go to **Vercel Blob** on production.

1. Open **https://vercel.com** → select your **HackTheTrash project** (the one with Root Directory `hackthetrash/frontend`).
2. Top tabs → **Storage** (or **Integrations** → Storage, depending on UI).
3. **Create** / **Add** → **Blob**.
4. Link the Blob store to this project when asked.
5. Open the Blob store → find **Read/Write token** (or create an access token with read/write).
6. **Copy the token** — this value is **`BLOB_READ_WRITE_TOKEN`** (you will paste it in Part 4).

---

## Part 4 — Paste everything into Vercel → Environment Variables

1. Vercel → your project → **Settings** → **Environment Variables**.
2. For **each** row below, click **Add New** / **Add Environment Variable**:
   - **Key** = exact name in the left column.
   - **Value** = what the right column says (paste from Supabase / your password manager / Blob / openssl).
   - **Environments** = at least **Production** (add **Preview** too if you use preview deployments and want them to work).
   - **Sensitive** = ON for anything that is a secret.

| Key | Where you get the value |
|-----|-------------------------|
| **`DATABASE_URL`** | The Supabase URI from **Part 1.3** (with your real password and `?sslmode=require` if needed). |
| **`JWT_SECRET`** | Generate on your PC: `openssl rand -hex 64` (Git Bash / WSL / Mac). Or any long random string (64+ characters). |
| **`BLOB_READ_WRITE_TOKEN`** | **Part 3** — Vercel Blob read/write token. |
| **`CORS_ORIGINS`** | Your live site URL only, e.g. `https://your-project.vercel.app` (no trailing slash). After a custom domain: `https://yourdomain.com` (comma-separate multiple origins if needed). |
| **`PUBLIC_URL`** | Same as public site URL, e.g. `https://your-project.vercel.app` |

**Do not add** `NEXT_PUBLIC_API_URL` for normal deployment (leave unset so the browser uses same-origin `/api/...`).

3. Click **Save** for each variable.
4. **Redeploy**: **Deployments** → open the latest deployment → **⋯** → **Redeploy** (or push a commit). New env vars apply only after redeploy.

---

## Part 5 — Verify (2-minute check)

1. Open in the browser (replace with your real Vercel URL):

   `https://YOUR-PROJECT.vercel.app/api/health`

2. JSON should include `"status": "healthy"` and `"checks"` with:

   - `databaseUrl`: **true**
   - `jwtSecret`: **true**
   - `blobToken`: **true**
   - `vercel`: **true**

3. Open:

   `https://YOUR-PROJECT.vercel.app/api/reports`

   Should return JSON (maybe `"reports": []` if empty) — **not** a 500 error.

4. Open `/admin/login` and sign in with the admin email/password from **Part 2 step 5** (if you ran `db:seed-admin`).

---

## Quick reference — what lives where

| Secret / config | Created in | Pasted into Vercel as |
|-----------------|------------|------------------------|
| Database | **Supabase** project | `DATABASE_URL` |
| JWT signing | You generate | `JWT_SECRET` |
| Images | **Vercel Blob** | `BLOB_READ_WRITE_TOKEN` |
| Browser security | You type your site URL | `CORS_ORIGINS`, `PUBLIC_URL` |

Supabase **Project Settings → API** has `anon` / `service_role` keys — **HackTheTrash’s Node backend does not use those** for this setup; it uses **`DATABASE_URL`** only.

---

## If something fails

| Problem | What to check |
|---------|----------------|
| `/api/health` shows `databaseUrl: false` | `DATABASE_URL` missing or typo in key name; **Redeploy** after saving. |
| Migrations fail on Supabase | Run Part 1.2 PostGIS SQL again; use **direct** URI (port 5432) for migrate. |
| `POST /api/reports` fails on images | `BLOB_READ_WRITE_TOKEN` missing or wrong; **Redeploy**. |
| Browser says CORS | `CORS_ORIGINS` must match **exact** origin (`https://...`). |

More context: [FULL-STACK-IMPLEMENTATION.md](./FULL-STACK-IMPLEMENTATION.md).
