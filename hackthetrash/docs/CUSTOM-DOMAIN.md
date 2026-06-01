# Custom domain on Vercel (e.g. `hackthetrash.flossk.org`)

Use this when the site should be served on **`https://hackthetrash.flossk.org`** instead of (or in addition to) **`*.vercel.app`**. DNS stays on **Cloudflare**; Vercel only needs the hostname added to the project.

## 1. Vercel — add the hostname

1. Open the project → **Settings** → **Domains**.
2. Enter **`hackthetrash.flossk.org`** → **Add**.
3. Vercel shows the **exact** DNS record(s) to create (usually a **CNAME** for a subdomain). **Copy the target host** Vercel gives you (often `cname.vercel-dns.com` or a project-specific `….vercel-dns.com` host). Do not guess — use what the UI shows.

Optional: add a redirect so the old **`https://hackthetrash.vercel.app`** URL sends users to the new domain (**Domains** → configure redirect on the `.vercel.app` domain, or add a redirect rule in `next.config` / middleware if you prefer code-owned redirects).

Wait until the domain shows **Valid** in Vercel (can take a few minutes after DNS propagates).

## 2. Cloudflare — DNS for `flossk.org`

1. **DNS** → **Records** → **Add record**.
2. **Type:** `CNAME`  
   **Name:** `hackthetrash` (this creates `hackthetrash.flossk.org`; do not repeat the full domain in the name field).  
   **Target:** paste the **exact** value from Vercel (step 1).  
   **Proxy status:** for the **first** verification, set **DNS only** (grey cloud). After Vercel shows the domain as valid, you can try **Proxied** (orange cloud) if you want Cloudflare’s CDN/WAF — if anything breaks (SSL loops, 403s), switch back to DNS only or follow [Vercel + Cloudflare](https://vercel.com/docs/integrations/external-platforms/cloudflare).

Do **not** create a second conflicting `A`/`CNAME` for the same name.

## 3. Vercel — environment variables

After the custom domain works, update production env (and redeploy if needed):

| Variable | Example value |
|----------|----------------|
| **`CORS_ORIGINS`** | `https://hackthetrash.flossk.org` (include `https://hackthetrash.vercel.app` too only if you still load the API from that origin; comma-separated, **no trailing slash**) |
| **`PUBLIC_URL`** | `https://hackthetrash.flossk.org` (links in emails / absolute URLs) |

Redeploy or **Redeploy** latest production so serverless picks up the new env.

## 4. Mobile (Expo)

`mobile/app.json` → **`expo.extra.apiUrl`** must point at the **public API base** the device can reach, e.g. **`https://hackthetrash.flossk.org`**, then rebuild / publish the app.

## 5. Smoke test

- `https://hackthetrash.flossk.org/` loads.  
- `https://hackthetrash.flossk.org/api/health` returns JSON.  
- Admin login and report submit still work (same-origin `/api/*`).

## Troubleshooting

- **Invalid configuration** in Vercel for a long time: wrong CNAME target, typo in name, or Cloudflare proxy interfering — try **DNS only** on that record.  
- **SSL pending:** wait for Vercel to issue the cert after DNS is correct; can take up to an hour.  
- **CORS errors** in the browser: `CORS_ORIGINS` must include the **exact** origin you use in the address bar (scheme + host, no path).
