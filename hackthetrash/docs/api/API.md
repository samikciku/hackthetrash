# 📡 HackTheTrash API Reference

**Base URL**

- **Local (Express on port 4000):** `http://localhost:4000` — API routes are under `/api/...` (e.g. `http://localhost:4000/api/reports`).
- **Production (Vercel, same host as the site):** `https://your-deployment.vercel.app` — use **`/api/...`** on that same origin (do not set `NEXT_PUBLIC_API_URL` so the web app uses relative URLs).

This document uses path suffixes like `/reports`; the full path is **`/api/reports`** (Express mounts routers under `/api`).

## Reports

### `GET /reports`
List all reports.

**Response:**
```json
{ "reports": [ { "id": "...", "latitude": 45.46, "longitude": 9.19, "status": "reported", ... } ] }
```

### `GET /reports/:id`
Get a single report.

### `POST /reports`
Create a new report. **multipart/form-data**.

| Field        | Type       | Required | Notes                           |
|--------------|------------|----------|---------------------------------|
| photos       | File[]     | ✅       | up to 5 image files             |
| latitude     | number     | ✅       |                                 |
| longitude    | number     | ✅       |                                 |
| severity     | string     | ❌       | small / medium / large          |
| description  | string     | ❌       |                                 |
| tags         | JSON array | ❌       | e.g. `["Plastic","Hazardous"]`  |
| anonymous    | boolean    | ❌       |                                 |

### `PATCH /reports/:id/status`
Update status (admin/moderator). JSON body: `{ "status": "verified" }`.

Statuses: `reported | verified | cleaning | cleaned | rejected`

## Auth (stub)

### `POST /auth/register`
### `POST /auth/login`
