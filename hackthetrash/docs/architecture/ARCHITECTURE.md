# 🏗️ Architecture

## High-level
```
Client (Next.js PWA)
   │  REST/JSON
   ▼
API (Express + TypeScript)
   │
   ├── PostgreSQL + PostGIS (reports, users, geo queries)
   ├── Object Storage (S3 / Cloudinary)
   └── Optional: AI service (image classification)
```

## Folder Layout
- `frontend/` — Next.js 14 App Router, Tailwind, Leaflet
- `backend/` — Express, multer (uploads), JWT auth
- `docs/` — wireframes, API docs, architecture
- `scripts/` — dev helpers

## Data Flow — Submit Report
1. User selects photos + location in browser.
2. Client `POST /api/reports` (multipart).
3. Backend validates, stores files (local for MVP), inserts row.
4. Response confirms; report appears on map after moderation.

## Future
- WebSockets for live map updates
- Background jobs (Bull/Redis) for AI image checks
- CDN in front of static assets
