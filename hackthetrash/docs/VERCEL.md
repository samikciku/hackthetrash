# Deploy HackTheTrash on Vercel (full stack)

**→ Step-by-step (local backend, DB, dashboard clicks): [FULL-STACK-IMPLEMENTATION.md](./FULL-STACK-IMPLEMENTATION.md)**  
**→ Admin email/password on Vercel: [ADMIN-LOGIN.md](./ADMIN-LOGIN.md)**

This page is a **short checklist**. The linked guide covers **Vercel UI in detail**, Neon/Postgres, Blob, migrations, and verification.

---

This app is a **Next.js 14 frontend** plus an **Express API** and **PostgreSQL with PostGIS**. On Vercel the API runs as a **single serverless function** via [`serverless-http`](https://github.com/dougmoscrop/serverless-http), mounted at `pages/api/[[...slug]].ts`, so the browser can call **`/api/*` on the same origin** as the site.

**Important:** **`POST /api/auth/login`** and **`GET`/`POST /api/reports`** are implemented as **App Router** routes (`src/app/api/.../route.ts`) so the body is read with the Web **`Request`** API (reliable on Vercel). Other `/api/*` paths still go through Express on the Pages catch-all.

## 1. Vercel project settings

| Setting | Value |
|--------|--------|
| **Root Directory** | `hackthetrash/frontend` |
| **Framework Preset** | Next.js (auto from `package.json`) |

The GitHub repo root is the **monorepo** (e.g. `samikciku/hackthetrash` or `samikciku/hackthetrash-2`); the deployable Next app always lives under **`hackthetrash/frontend`**. If Vercel says *Root Directory "frontend" does not exist*, change the setting from `frontend` → **`hackthetrash/frontend`**.

`frontend/vercel.json` installs backend deps and compiles the backend (`tsc`) before `next build`, so Express + DB code type-checks and any backend-only assets resolve correctly.

## 2. Database (PostGIS required)

Vercel does not host Postgres. Use a managed provider that supports **PostGIS** (same as local Docker `postgis/postgis`):

- **[Neon](https://neon.tech)** — create a project, enable PostGIS in the SQL editor: `CREATE EXTENSION IF NOT EXISTS postgis;`, then paste your connection string.
- **Vercel Postgres** (Neon-backed) — link storage in the Vercel project and use the provided `POSTGRES_URL` / pooled URL as `DATABASE_URL`.

Run migrations **once** against that database (from your machine or CI), **before** or right after first deploy:

```bash
cd hackthetrash/backend
export DATABASE_URL="postgresql://..."
npm run db:migrate
npm run db:seed-admin   # optional: creates admin user per your .env
```

SQL migrations live in `backend/src/db/migrations/`.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you want previews to work).

### Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (SSL usually required). |
| `JWT_SECRET` | Long random secret for JWT signing (e.g. `openssl rand -hex 64`). |
| `BLOB_READ_WRITE_TOKEN` | **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** — report photos are uploaded here on serverless (no durable local disk). Create a Blob store and add the read/write token. |

**Private Blob stores:** This repo uses **`@vercel/blob` ≥ 2.3** so uploads can use `access: 'private'` (required if the store is **Private** in the dashboard). Older SDKs only allowed `public` and failed with *“Cannot use public access on a private store”*. Private object URLs are served through **`/api/blob-image`** (same `BLOB_READ_WRITE_TOKEN` on the Next.js function).

### Strongly recommended

| Variable | Purpose |
|----------|---------|
| `CORS_ORIGINS` | Your production origin, e.g. `https://your-app.vercel.app` (comma-separated if several). Use `*` only for debugging. |
| `PUBLIC_URL` | Public site URL for links in emails (`https://your-app.vercel.app`). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used with `db:seed-admin` (not read on every request unless you re-seed). |

### Optional

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Leave **unset** for same-origin `/api` (recommended on Vercel). Set only if the API is on another host (e.g. local dev: `http://localhost:4000`). |
| `AI_PROVIDER` | `mock` (default) or `huggingface`. **Hugging Face calls only run if you also set `AI_USE_HUGGINGFACE=1`** plus `HF_API_TOKEN` / `HF_MODEL`. |
| `SMTP_*` | Outgoing email; see `backend/.env.example`. |
| `BLOB_PUT_ACCESS` | Optional: `public` or `private` to force upload access (skips auto-retry). Use **`private`** if your Blob store is private-only. |

Vercel sets `VERCEL=1` automatically — the backend uses that to switch multer to **memory** storage and **Blob** for photo persistence.

## 4. Local “all in Next” dev (optional)

If you run **only** `next dev` in `frontend/` (no separate Express on :4000), set in `frontend/.env.local`:

```env
HACKTHETRASH_INTEGRATED_API=1
```

Photos are then written under `../backend/uploads` (no Blob needed locally). Remove this on Vercel (or rely on `VERCEL=1` for Blob).

## 5. Mobile app

Expo / React Native still needs a **reachable API base URL** (e.g. your `https://…vercel.app`). Configure `extra.apiUrl` in `mobile/app.json` or EAS env — it cannot use “empty” same-origin like the web app.

## 6. Limits and caveats

- **App Router `route.ts` (preferred on Vercel)**: **`/api/auth/login`**, **`/api/auth/password`**, **`/api/reports`** (GET list + POST create), and **admin moderation** (**`/api/admin/reports`**, **`/api/admin/reports/[id]/[action]`**, **`/api/admin/users`**, **`/api/admin/users/[id]`**, **`/api/admin/users/[id]/role`**) use the Web **`Request`** API and shared backend services — same reason as login/reports (avoids **`serverless-http`** stream quirks and **504** timeouts on admin navigation). Other `/api/*` traffic still uses `pages/api/[[...slug]].ts` + Express. Express **`requireAuth` / `optionalAuth`** now catch DB errors so failed `pg` queries return **503 JSON** instead of hanging the lambda (**504**).
- **Report submit timeouts**: If Hugging Face is enabled (`AI_PROVIDER=huggingface` **and** `AI_USE_HUGGINGFACE=1`), inference can still be slow on cold models. The backend uses **HTTP timeouts** on HF (`AI_HF_FETCH_TIMEOUT_MS`), **parallel** image moderation + Blob uploads, and a **per-image budget** (`AI_MODERATION_PER_IMAGE_BUDGET_MS`). `frontend/vercel.json` sets **`maxDuration`: 120** for the catch-all API route (requires a Vercel plan that allows >60s if you raise it further).
- **Serverless timeouts**: long-running jobs or huge uploads may hit Vercel function limits; keep payloads reasonable.
- **Cold starts**: first request after idle can be slower.
- **Webhooks / long polling**: prefer external workers or Vercel Cron if you add them later.

## 7. Quick checklist

1. Create Neon (or other) Postgres + enable PostGIS.  
2. `DATABASE_URL` + run `npm run db:migrate` in `backend/`.  
3. Add Vercel Blob token → `BLOB_READ_WRITE_TOKEN`.  
4. Set `JWT_SECRET`, `CORS_ORIGINS`, `PUBLIC_URL`.  
5. Deploy with Root Directory **`hackthetrash/frontend`**.
