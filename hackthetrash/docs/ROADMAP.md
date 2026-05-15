# 🗺️ Roadmap

Status legend: ✅ shipped · 🚧 in progress · ⬜ planned

## Phase 1 — MVP (shipped in v0.1.0)

- [x] Project scaffold (frontend / backend / mobile / docs / CI)
- [x] Submission form (photo + GPS) — web + mobile
- [x] Public OpenStreetMap layer with color-coded markers
- [x] Database (PostgreSQL + PostGIS) with migrations and seeds
- [x] Auth (bcrypt + JWT, brute-force protection, role-based access)
- [x] Moderation panel (`/admin`) + Authority dashboard (`/dashboard`)
- [x] AI image verification (pluggable, Mock + HuggingFace)
- [x] HTML mockups + ASCII wireframes
- [x] Mobile app (Expo) with native camera, GPS and offline queue
- [x] Push notifications via Expo
- [x] i18n English + Albanian (Pristina-focused)

Released as `v0.1.0` on 2026-05-09 — see [CHANGELOG.md](../CHANGELOG.md).

## Phase 2 — Community

- [x] User profiles + badges (`/profile/:id`)
- [x] Comments on reports (`POST /api/reports/:id/comments`)
- [x] Flagging system (`POST /api/reports/:id/flags`) with admin queue
- [x] Email notifications (nodemailer, console transport in dev, SMTP in prod)
- [x] Email subscription endpoint (`POST /api/email-subscriptions`)
- [ ] Public profile pages with badge gallery polish
- [ ] Newsletter digest job (weekly cleanup summary)

## Phase 3 — Authority Tools

- [x] Municipal dashboard (queue, status filters)
- [x] Status workflow (reported → verified → cleaning → cleaned / rejected)
- [x] Audit trail (`status_updates`)
- [ ] CSV export of reports
- [ ] Public REST/GeoJSON export endpoint
- [ ] SLA dashboard (median time-to-clean per neighbourhood)

## Phase 4 — Smart

- [x] AI image verification (Mock + HuggingFace classifier, auto-moderation)
- [x] Mobile app (Expo)
- [x] i18n
- [ ] Duplicate auto-merge (PostGIS `ST_DWithin`)
- [ ] Computer-vision severity estimation
- [ ] Heatmap layer + cluster markers

## Phase 5 — Operations

- [x] Docker Compose for local Postgres + PostGIS + backend + frontend
- [x] Cross-platform dev scripts (bash + PowerShell + Node runner)
- [x] CI: lint, typecheck, build, tests
- [x] Test suites (backend Jest+Supertest, frontend Vitest)
- [ ] Production CD pipeline (Railway / Vercel deploy on tag)
- [ ] OpenTelemetry traces + Sentry error reporting
- [ ] Bun / pnpm workspace migration

