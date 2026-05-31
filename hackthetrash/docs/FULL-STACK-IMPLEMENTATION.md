# Full-stack implementation guide — Backend, database, frontend, Vercel

**Short “Supabase + where to copy keys + Vercel env” walkthrough:** [SUPABASE-AND-VERCEL-KEYS.md](./SUPABASE-AND-VERCEL-KEYS.md).

This document walks you from **zero** to a **running HackTheTrash stack**: PostgreSQL + PostGIS, Express API, Next.js web app, file storage, and deployment on **Vercel**. Follow the sections in order unless you already have pieces in place.

---

## 1. What you are implementing

| Layer | Technology | Where it runs locally | Where it runs on Vercel |
|-------|------------|------------------------|-------------------------|
| Web UI | Next.js 14 (App Router) | `http://localhost:3000` | Same URL as your deployment |
| HTTP API | Express (TypeScript) | `http://localhost:4000` (Docker/scripts) **or** inside Next via `pages/api` | **One serverless function** wrapping Express (`serverless-http`) at `/api/*` |
| Database | PostgreSQL **+ PostGIS** | Docker or local Postgres | **Managed** (Neon, Supabase, RDS, or **Vercel Postgres**) — not inside Vercel’s serverless runtime |
| Report photos | Multer + disk **or** Vercel Blob | `backend/uploads/` or Blob | **Vercel Blob** (required in production) |
| Auth | JWT in `Authorization` header | Same | Same |

```mermaid
flowchart TB
  subgraph browser [Browser]
    NextUI[Next.js pages]
  end
  subgraph vercel [Vercel]
    NextUI -->|"/api/*"| Lambda[Pages API + serverless-http + Express]
    Lambda --> Blob[Vercel Blob]
  end
  subgraph cloud [Managed cloud]
    Lambda -->|DATABASE_URL| PG[(PostgreSQL + PostGIS)]
  end
```

**Important:** Vercel does **not** run a long-lived Node server for Express. The repo already mounts the same Express `createApp()` behind Next’s **`/api/[[...slug]]`** route so all existing routes (`/api/reports`, `/api/auth/login`, …) keep working on one hostname.

---

## 2. Prerequisites

Install on your machine:

- **Node.js 18+** (LTS recommended)
- **Git**
- **Docker Desktop** (optional but recommended for local Postgres + full stack)

Accounts you will use:

- **GitHub** — repo with code (e.g. `flosskosova/trash`)
- **Vercel** — sign in with GitHub
- **Neon** or **Vercel Storage → Postgres** — database (must allow **PostGIS**)
- **Vercel Blob** — for photo uploads in production

---

## 3. Repository layout (what to open in your editor)

From the monorepo root (e.g. `trash/` on GitHub):

```
hackthetrash/
├── frontend/                 # Next.js — Vercel Root Directory points HERE
│   ├── src/app/              # UI routes
│   ├── src/pages/api/[[...slug]].ts   # Serverless Express entry (production + optional local)
│   ├── vercel.json           # Vercel install + build commands
│   └── .env.local            # You create this locally (not committed)
├── backend/                  # Express app (shared with Vercel bundle)
│   ├── src/
│   │   ├── app.ts            # createApp() — routes, CORS, static /api/uploads
│   │   ├── index.ts          # listen(4000) — used when running API alone
│   │   ├── routes/           # /api/reports, /api/auth, …
│   │   └── db/migrations/*.sql
│   └── .env                  # You create this for local API + migrations
├── mobile/                   # Expo — needs explicit HTTPS API URL in prod
├── docker-compose.yml        # Optional: Postgres + backend + frontend together
└── docs/
    ├── FULL-STACK-IMPLEMENTATION.md   # This file
    └── VERCEL.md               # Shorter Vercel-only checklist
```

---

## 4. Part A — Implement the backend locally (database + API)

### 4.1 Option A — Full stack with Docker (easiest)

From `hackthetrash/`:

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Postgres: `postgresql://htt:htt@localhost:5432/hackthetrash`

Migrations are applied via the PostGIS image init in Compose (see `docker-compose.yml`). For a **fresh** DB you can still run:

```bash
cd backend
set DATABASE_URL=postgresql://htt:htt@localhost:5432/hackthetrash
npm install
npm run db:migrate
```

(On macOS/Linux use `export` instead of `set`.)

### 4.2 Option B — Postgres only in Docker, Node on host

```bash
docker run -d --name htt-pg -e POSTGRES_USER=htt -e POSTGRES_PASSWORD=htt -e POSTGRES_DB=hackthetrash -p 5432:5432 postgis/postgis:16-3.4-alpine
```

Then create `hackthetrash/backend/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://htt:htt@localhost:5432/hackthetrash
JWT_SECRET=local_dev_only_change_me_use_openssl_rand_in_prod
JWT_EXPIRES=12h
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads
AI_PROVIDER=mock
SMTP_TRANSPORT=console
PUBLIC_URL=http://localhost:3000
```

Install and migrate:

```bash
cd hackthetrash/backend
npm install
npm run db:migrate
npm run db:seed-admin
```

`db:seed-admin` creates an admin user using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (see `backend/.env.example`).

Start the API:

```bash
npm run dev
```

You should see: `HackTheTrash API running on http://localhost:4000`.

**Smoke test:**

```bash
curl http://localhost:4000/api/health
```

Expect JSON like `{"status":"healthy"}`.

### 4.3 What `db:migrate` does

`backend/src/db/migrate.ts` runs every `*.sql` file in `backend/src/db/migrations/` in alphabetical order:

- `001_init.sql` — extensions (`postgis`, `uuid-ossp`), core tables
- `002_functions.sql`, `003_phase2.sql` — follow-up schema

**PostGIS is mandatory** — `001_init.sql` runs `CREATE EXTENSION IF NOT EXISTS postgis;`. If your cloud DB blocks that, the migrate will fail; pick a provider that allows PostGIS (Neon: enable in SQL editor).

### 4.4 Backend environment variables (reference)

Copy `backend/.env.example` → `backend/.env` and fill in. Full list is in that file; minimum for local API + DB:

| Variable | Required locally? | Purpose |
|----------|-------------------|---------|
| `DATABASE_URL` | Yes (for real DB mode) | Connection string; without it, some code paths use in-memory demo data |
| `JWT_SECRET` | Yes | Signs JWTs for login |
| `CORS_ORIGINS` | Recommended | Browser origins allowed to call the API (comma-separated) |
| `PORT` | Optional | Default `4000` |

---

## 5. Part B — Frontend + how it talks to the backend

### 5.1 Split dev (recommended while iterating on API)

Terminal 1 — backend (from §4):

```bash
cd hackthetrash/backend && npm run dev
```

Terminal 2 — frontend:

Create `hackthetrash/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
cd hackthetrash/frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The UI calls `NEXT_PUBLIC_API_URL` + `/api/...`.

### 5.2 Single-process dev (Next only, Express inside Next)

Useful to mimic Vercel locally.

`frontend/.env.local`:

```env
HACKTHETRASH_INTEGRATED_API=1
# Do NOT set NEXT_PUBLIC_API_URL — same-origin /api
```

Set `backend/.env` with `DATABASE_URL` etc. **or** rely on in-memory mode for quick UI tests (no DB).

```bash
cd hackthetrash/frontend
npm install
npm ci --prefix ../backend
npm run dev
```

Photos go to `hackthetrash/backend/uploads/` when Blob is not used.

### 5.3 How production differs

- **`NEXT_PUBLIC_API_URL`**: leave **empty / unset** on Vercel so the browser uses **relative** `/api/...` on the same host.
- **Photos**: `VERCEL=1` forces memory uploads + **Vercel Blob** via `BLOB_READ_WRITE_TOKEN`.

---

## 6. Part C — Vercel: detailed dashboard steps

These instructions match the **Vercel dashboard** as of 2025–2026; menu names may shift slightly.

### 6.1 Create the project

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. **Continue with GitHub**).
2. **Add New… → Project**.
3. **Import** the Git repository that contains this code (`flosskosova/trash` or your fork).
4. Before clicking **Deploy**, open **Configure Project**:
   - **Root Directory**: click **Edit**, set to **`hackthetrash/frontend`**  
     This is critical: the default repo root does not contain `package.json` for the Next app.
   - **Framework Preset**: should auto-detect **Next.js**.
   - **Build Command** / **Install Command**: leave default **unless** you removed `frontend/vercel.json`. The repo ships:

     ```json
     "installCommand": "npm ci && npm ci --prefix ../backend",
     "buildCommand": "npm run build --prefix ../backend && npm run build"
     ```

     That installs **frontend + backend** dependencies and runs **`tsc`** on the backend before **`next build`**.

5. **Environment Variables**: do **not** deploy successfully yet without DB + secrets — either:
   - Add the variables in the next subsection **now** on this screen (expand **Environment Variables**), or  
   - Finish import, then **Project → Settings → Environment Variables** after first failed/successful deploy.

6. Click **Deploy**.

First build may **fail** if `DATABASE_URL` is missing at **build** time only if something imports DB at build — currently Next should build without DB. Runtime still needs `DATABASE_URL` for real data.

---

### 6.2 Create Postgres (choose one path)

#### Path 1 — Vercel Postgres (Neon under the hood)

1. In Vercel: open your **project**.
2. **Storage** tab → **Create Database** → choose **Postgres** (or **Neon** if offered as separate).
3. **Connect** the database to this project. Vercel injects env vars such as `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.
4. In **Settings → Environment Variables**, add:

   - **`DATABASE_URL`** = the **pooled** or **direct** connection string Vercel shows (copy from the Storage UI).  
     If only `POSTGRES_URL` exists, duplicate its value into `DATABASE_URL` — our backend reads **`DATABASE_URL`**.

5. **Enable PostGIS** (one-time, in Neon SQL Editor or Vercel’s SQL tab):

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

   (`uuid-ossp` may already exist; safe to re-run.)

#### Path 2 — Neon standalone

1. [neon.tech](https://neon.tech) → new project → copy **connection string** (include `?sslmode=require` if offered).
2. SQL Editor → run the same `CREATE EXTENSION` lines as above.
3. Vercel → **Settings → Environment Variables** → add **`DATABASE_URL`** = that connection string for **Production** (and **Preview** if you use previews).

---

### 6.3 Create Vercel Blob (photos)

1. Vercel project → **Storage** → **Create** → **Blob**.
2. Link the store to the project.
3. Copy the **Read/Write token** (or create a token in Blob settings).
4. **Settings → Environment Variables** → add:

   - **`BLOB_READ_WRITE_TOKEN`** = paste token  
   - Scope: **Production** (and **Preview** if needed)

Without this, **photo uploads fail on Vercel** (`VERCEL=1` uses memory + Blob).

---

### 6.4 Environment variables to set in Vercel (copy checklist)

Go to: **Project → Settings → Environment Variables**.

Add each row; use **Production** at minimum. For PR previews, also enable **Preview** with the same keys (often same `DATABASE_URL` or a separate Neon branch).

| Name | Example / notes |
|------|-----------------|
| **`DATABASE_URL`** | `postgresql://user:pass@host/db?sslmode=require` |
| **`JWT_SECRET`** | Generate: `openssl rand -hex 64` (Windows: Git Bash or WSL) |
| **`BLOB_READ_WRITE_TOKEN`** | From Vercel Blob |
| **`CORS_ORIGINS`** | `https://your-project.vercel.app` — after first deploy you’ll know the URL; update if you add a custom domain (comma-separated list) |
| **`PUBLIC_URL`** | Same as public site URL, e.g. `https://your-project.vercel.app` (used in emails/links) |
| **`JWT_EXPIRES`** | Optional; default in code is often `12h` — see `backend/.env.example` |
| **`AI_PROVIDER`** | `mock` until you wire Hugging Face |
| **`SMTP_*`** | Optional; `console` logs only if unset |

**Do not set** `NEXT_PUBLIC_API_URL` for standard same-host deployment.

After changing env vars: **Redeploy** (Deployments → … on latest → **Redeploy**, or push an empty commit).

---

### 6.5 Run database migrations against production DB

Run **from your laptop** (or CI) so `DATABASE_URL` points at the **same** database Vercel uses:

```bash
cd hackthetrash/backend
npm install
set DATABASE_URL=postgresql://...your_production_url...
npm run db:migrate
npm run db:seed-admin
```

Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` **or** prefix the command:

```bash
set ADMIN_EMAIL=you@domain.com
set ADMIN_PASSWORD=YourSecurePassword
npm run db:seed-admin
```

Then log in at `https://your-site.vercel.app/admin/login`.

---

### 6.6 Custom domain (optional)

1. **Project → Settings → Domains** → add domain → follow DNS instructions.
2. Update **`CORS_ORIGINS`** and **`PUBLIC_URL`** to include the new `https://…` origin.
3. Redeploy.

---

## 7. Part D — Verify everything works

Replace `https://YOUR_DEPLOYMENT.vercel.app` with your real URL.

1. **Health**

   ```bash
   curl https://YOUR_DEPLOYMENT.vercel.app/api/health
   ```

2. **List reports** (may be empty)

   ```bash
   curl https://YOUR_DEPLOYMENT.vercel.app/api/reports
   ```

3. **Browser**
   - Open `/map` — map loads.
   - Open `/report` — submit a report with a small image (under size limits).
   - Open `/admin/login` — green “backend OK” banner if health passes; log in with seeded admin.

4. **If CORS errors appear**  
   Ensure `CORS_ORIGINS` includes the exact browser origin (scheme + host, no trailing slash unless you standardized that).

---

## 8. Part E — Mobile (Expo)

The app in `mobile/` cannot use “empty” API base. Set production API URL:

- **`mobile/app.json`** → `expo.extra.apiUrl` = `https://YOUR_DEPLOYMENT.vercel.app`  
  or use **EAS Secrets** / env in `eas.json`.

Rebuild the app after changing API URL.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build fails: cannot find module in `../backend` | Wrong Root Directory | Set Root Directory to **`hackthetrash/frontend`** |
| `500` on `/api/*` | Missing `DATABASE_URL` or invalid URL | Check Vercel env + logs (**Functions** / **Runtime Logs**) |
| Photo upload fails | Missing `BLOB_READ_WRITE_TOKEN` | Add Blob token; redeploy |
| `relation "reports" does not exist` | Migrations not run | Run `npm run db:migrate` against prod `DATABASE_URL` |
| PostGIS error on migrate | Extension not allowed | Use Neon/Vercel Postgres with PostGIS enabled |
| CORS error in browser | `CORS_ORIGINS` mismatch | Set to your exact `https://…` origin |
| Admin login works locally but not on Vercel | Admin user not seeded in prod DB | Run `db:seed-admin` against prod |
| **`GET /api/reports` is 404** while `/api/health` works | Request path not reaching Express routers (Next catch-all quirk) | Redeploy with latest code — the API normalizes paths; ensure **Root Directory** is `hackthetrash/frontend` so `pages/api/[[...slug]].ts` is included |

### 9.1 Read `/api/health` on production (configuration without secrets)

After deploy, open or `curl`:

```text
https://YOUR_PROJECT.vercel.app/api/health
```

You should see JSON like:

```json
{
  "status": "healthy",
  "checks": {
    "databaseUrl": true,
    "jwtSecret": true,
    "blobToken": true,
    "vercel": true
  }
}
```

Interpretation:

| `checks.*` | Meaning |
|------------|--------|
| **`databaseUrl`: false** | `DATABASE_URL` is missing in **Vercel → Settings → Environment Variables** for this environment, or the var name is wrong. Add it and **Redeploy**. |
| **`jwtSecret`: false** | `JWT_SECRET` not set — login and protected routes will fail. |
| **`blobToken`: false** | On Vercel, photo uploads need **`BLOB_READ_WRITE_TOKEN`** (Vercel Blob). Without it, `POST /api/reports` can error when saving images. |
| **`vercel`: true** | Request is running on Vercel (multer uses memory + Blob for uploads). |

`status` stays **`healthy`** as long as the Node process started — it does **not** prove the database TCP connection works. After env flags are true, hit **`GET /api/reports`**; a DB connection failure usually surfaces as **500** with a message in **Vercel → Deployment → Functions → Logs**.

---

## 10. Security checklist (before going wide)

- [ ] `JWT_SECRET` is long and random; not committed to git  
- [ ] `ADMIN_PASSWORD` changed from defaults after seed  
- [ ] `CORS_ORIGINS` not `*` in production  
- [ ] Database uses SSL (`sslmode=require`)  
- [ ] Preview deployments: use a **separate** DB or accept that previews share prod data (not recommended)

---

## 11. Further reading

- [VERCEL.md](./VERCEL.md) — short Vercel-focused checklist  
- [DATABASE.md](./DATABASE.md) — schema overview  
- [api/API.md](./api/API.md) — HTTP endpoints (paths are under `/api/...` on same host in production)  
- [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md) — system design

---

You now have: **local backend implementation**, **database migrations**, **frontend wiring**, and **step-by-step Vercel dashboard actions** end to end. If a menu name in Vercel changes, use this doc’s intent: **Root Directory = `hackthetrash/frontend`**, **Storage = Postgres + Blob**, **env = table in §6.4**, **migrate against prod DB before relying on admin UI**.
