# 🏗️ Architecture

## High-level
```
Web (Next.js PWA)        Mobile (React Native + Expo)
      │                              │
      │  REST + multipart upload     │
      └─────────► API ◄──────────────┘
              (Express + TS)
                    │
   ┌────────────────┼────────────────────────┐
   ▼                ▼                        ▼
PostgreSQL +   Object Storage         AI Classifier
 PostGIS       (S3 / Cloudinary /     (Mock / HuggingFace)
 (geo)          local for dev)
```

## Folder Layout
- `frontend/` — Next.js 14 App Router, Tailwind, Leaflet
- `mobile/` — React Native (Expo) app, Leaflet via WebView
- `backend/` — Express, multer (uploads), JWT auth, PostGIS, AI
- `docs/` — wireframes, mockups, API docs, architecture
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
