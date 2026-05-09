# Admin Panel

A protected web interface where moderators can review and decide on every
report submitted by citizens.

## Login

URL: `/admin/login`

The default admin credentials (in-memory mode, no database) are read from the
backend `.env` file:

```
ADMIN_EMAIL=admin@hackthetrash.org
ADMIN_PASSWORD=ChangeMe!2026
```

Change them before any deploy.

When running with PostgreSQL, seed an admin via:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=SuperSecret npm run db:seed-admin
```

## Hardening

- **Bcrypt** password hashing (cost 12) - never store plaintext.
- **JWT** access tokens, signed with `JWT_SECRET`, default 12h lifetime.
- **Brute-force protection**: per-IP sliding window. 5 failed attempts in
  15 minutes -> 15 minute lockout. Implemented in
  `backend/src/middleware/auth.ts`.
- **Role-aware middleware**: `requireRole("admin", "moderator", "authority")`
  guards every admin endpoint.
- **Token rotation on role change**: if a user is downgraded, their existing
  token is rejected on the next request.
- **CORS allowlist** via `CORS_ORIGINS` env var.
- **Security headers**: X-Content-Type-Options, X-Frame-Options DENY,
  Referrer-Policy, Permissions-Policy.
- **Body size limit**: JSON requests limited to 1 MB.
- **Trust proxy**: enabled so `req.ip` works behind reverse proxies.

## API

All admin endpoints require `Authorization: Bearer <token>`.

| Method | Path                                  | Action / role           |
|--------|---------------------------------------|-------------------------|
| GET    | `/api/admin/stats`                    | Counts per status       |
| GET    | `/api/admin/reports?status=reported`  | Filtered list           |
| PATCH  | `/api/admin/reports/:id/approve`      | -> verified             |
| PATCH  | `/api/admin/reports/:id/reject`       | -> rejected             |
| PATCH  | `/api/admin/reports/:id/cleaning`     | -> cleaning             |
| PATCH  | `/api/admin/reports/:id/cleaned`      | -> cleaned              |
| PATCH  | `/api/auth/password`                  | Self-serve change pwd   |
| GET    | `/api/admin/users`                    | List users (admin only) |
| POST   | `/api/admin/users`                    | Invite user (admin only)|
| PATCH  | `/api/admin/users/:id/role`           | Change role (admin only)|
| DELETE | `/api/admin/users/:id`                | Remove user (admin only)|

Each status change:
- writes a row to `status_updates` (audit trail)
- fires an Expo push notification to all registered devices via
  `services/push.ts -> notifyStatusChange`

## UI

`/admin` shows one card per report:

- Photo strip (clickable to view full size)
- Status badge (translated)
- AI confidence score and label
- Description, tags, severity, GPS, created date
- Four action buttons: Approve / Reject / Cleaning / Cleaned
- Quick "Open on map" link

Filters at the top let you switch between **All / Reported / Verified / Cleaning / Cleaned / Rejected**.

The whole panel is i18n-aware: switch SQ in the header and the entire admin
UI flips to Albanian.
