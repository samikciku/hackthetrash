# Troubleshooting admin login & report submit (Vercel)

Both features need a **working Postgres** connection in production. `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Vercel **do not** create an admin user by themselves — they are only used when you run **`npm run db:seed-admin`** against the same database.

## 1. Admin login fails (`/admin/login`)

### A. `Invalid credentials` (401)

The **`users`** row for that email is missing, or the password does not match.

1. Set `DATABASE_URL` locally to the **same** value as Vercel (Production).
2. From `hackthetrash/backend`:

   ```bash
   export DATABASE_URL="postgresql://...?sslmode=require"
   export ADMIN_EMAIL="you@example.com"
   export ADMIN_PASSWORD="YourStrongPassword"
   npm run db:seed-admin
   ```

3. Log in with **exactly** that email and password.

See **[ADMIN-LOGIN.md](./ADMIN-LOGIN.md)** for the full checklist.

### B. `Cannot reach the database` (503)

`DATABASE_URL` is wrong, the DB blocks Vercel’s IPs, SSL is misconfigured, or the DB is down.

- Use a URL that works from the internet (Neon / Supabase pooler, not `localhost`).
- Append **`?sslmode=require`** (or your provider’s required SSL params) if connections fail without SSL.
- Run **`npm run db:migrate`** against that database at least once.

### C. `Too many attempts` (429)

Wait for the lockout window, or try from another network if you were rate-limited by IP.

### D. `JWT signing failed` (503)

Set **`JWT_SECRET`** on the Vercel project (long random string), then redeploy.

### E. Browser shows “Cannot reach the backend…”

Usually **`NEXT_PUBLIC_API_URL`** points at the wrong host, or **CORS** blocks the browser.

- On Vercel, **leave `NEXT_PUBLIC_API_URL` unset** so the app uses same-origin `/api/*`.
- If you must set it, include **`CORS_ORIGINS`** with your real site origin (comma-separated), not only `*`.

---

## 2. Report submit fails (`/report`)

### A. Alert with “No image files were received…”

Every selected file was **rejected** as a non-image (bad MIME type and filename doesn’t look like `.jpg`, `.png`, `.heic`, etc.). Try exporting as JPEG or rename so the extension is visible.

### B. Alert with “latitude & longitude required”

Pick a location (map / “Use my current location” / EXIF GPS).

### C. Blob / upload errors

- Set **`BLOB_READ_WRITE_TOKEN`** on the **same** Vercel project as the Next app.
- **Private** Blob stores need **`@vercel/blob` ≥ 2.3** (this repo) and optionally **`BLOB_PUT_ACCESS=private`**. See **[VERCEL.md](./VERCEL.md)**.

### D. Generic 500 / database message

Same as login **§1.B** — fix `DATABASE_URL`, PostGIS, and migrations. Reports insert into **`reports`** / **`photos`** and require PostGIS (`ST_MakePoint`, `geography`).

---

## 3. Quick diagnostics

| Check | What to do |
|--------|------------|
| Env vars present | Open **`/api/health`** — `checks.databaseUrl`, `checks.jwtSecret`, `checks.blobToken` should be `true` on Vercel. |
| DB actually reachable | Open **`/api/health?probe=db`** (one-off). You should see **`databaseReachable: true`**. If `false`, read `databaseError` (truncated) and fix connectivity/SSL. |
| Login response | Browser **Network** tab → **`POST /api/auth/login`** → status + JSON `error`. |
| Report response | **Network** → **`POST /api/reports`** → status + JSON `error`. |
| Function logs | Vercel → Project → Deployment → **Functions** / **Logs**. |

---

## 4. Still stuck

Capture **status code**, **JSON body**, and whether **`/api/health?probe=db`** passes, then open an issue with those three (redact secrets).
