# Admin login on production (Vercel)

The **admin UI** (`/admin/login`) talks to **`POST /api/auth/login`**. Credentials are **not** your Vercel or Supabase account — they come from the **`users`** table in **Postgres**, created by the seed script.

## 1. Pick email + password

Choose values you will remember, e.g.:

- `ADMIN_EMAIL=you@yourdomain.com`
- `ADMIN_PASSWORD=YourLongRandomPassword`

Use at least **8 characters** for the password (enforced on password change; login accepts the hash you seeded).

## 2. Point at the **same** database Vercel uses

On your laptop (or CI), set `DATABASE_URL` to the **production** connection string (same value as in Vercel → Environment variables).

Example (PowerShell):

```powershell
cd hackthetrash/backend
$env:DATABASE_URL = "postgresql://postgres:...@db.xxx.supabase.co:5432/postgres?sslmode=require"
$env:ADMIN_EMAIL = "you@yourdomain.com"
$env:ADMIN_PASSWORD = "YourLongRandomPassword"
npm run db:seed-admin
```

The script **inserts or updates** that user with role **`admin`** and a bcrypt hash of your password.

## 3. Required Vercel env (auth + API)

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Same DB you migrated + seeded |
| `JWT_SECRET` | Must be set and stable — JWTs are signed with it. If it changes, existing tokens die. |

After changing `JWT_SECRET` or DB rows: redeploy if needed; users must **log in again**.

## 4. Log in

Open `https://<your-project>.vercel.app/admin/login` and use the **same** `ADMIN_EMAIL` / `ADMIN_PASSWORD` you seeded.

## 5. If login still fails

- **`/api/health`** — `checks.databaseUrl` and `checks.jwtSecret` should be true.
- Browser **Network** tab on `POST /api/auth/login` — read status and JSON `error`.
- Vercel **function logs** — DB connection errors, missing `JWT_SECRET`, or body parsing errors.

## Related files

- Seed script: `backend/src/db/seed-admin.ts`
- Auth route: `backend/src/routes/auth.ts`
- Example env: `backend/.env.example`
