# Changelog

All notable changes to **HackTheTrash** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Phase 2 (community, ops, testing)

#### Community features
- **Comments on reports**: `GET/POST /api/reports/:id/comments` with public
  read access, signed-in or anonymous post (with optional display name).
  Wired into the public map's marker popup as a `CommentThread` component.
- **Flagging system**: `POST /api/reports/:id/flags` with reasons
  (`spam`, `duplicate`, `inaccurate`, `offensive`, `other`) plus a
  per-marker `FlagButton`. Admins/moderators can browse open flags via
  `GET /api/admin/flags?resolved=false` and resolve them with
  `PATCH /api/admin/flags/:id/resolve`. Open-flag count surfaces in
  `/api/admin/stats`.
- **User profiles**: `GET /api/profile/:id` (public view) and
  `GET /api/profile/me` (full view). New web page `/profile/[id]` with
  avatar bubble, role chip, total/verified/cleaning/cleaned stats,
  badge gallery, and a recent-reports list.
- **Badge engine**: `backend/src/models/Badge.ts` with a shared catalog
  (`first_report`, `five_reports`, `twentyfive`, `hundred`,
  `verified`, `cleaned`). Re-evaluated automatically when a logged-in
  citizen submits a report or when an admin changes a report's status.
  Catalog exposed at `GET /api/profile/badges`.
- **Email notifications**: `services/email.ts` with two transports —
  `console` (default in dev/test) and `smtp` (nodemailer). Public sign-up
  at `POST /api/email-subscriptions`, token-based unsubscribe at
  `GET /api/email-subscriptions/unsubscribe/:token`. Status-change emails
  fan out to subscribers in the same region.
- **Email subscribe widget** on the home page (`<EmailSubscribe />`).

#### Schema
- New migration `003_phase2.sql`:
  - extends `users` with `display_name`, `bio`, `avatar_url`
  - extends `flags` with `note` and `resolved` (+ index)
  - new `badges` table with a unique `(user_id, code)` constraint
  - new `email_subscriptions` table with a UUID `unsubscribe_token`

#### Reports controller
- Reports submitted by an authenticated, non-anonymous citizen now record
  `user_id` (via the new `optionalAuth` middleware on `POST /api/reports`).
- Successful submissions return `badges_awarded: string[]` so the client
  can celebrate freshly earned badges.

#### Testing
- **Backend**: Jest + `ts-jest` + Supertest. New `tests/` suite covers
  health, auth (login / `/me` / hardening headers), reports (public list +
  admin gate), AI mock classifier + `autoModerate`, comments, flags
  (incl. admin resolve), profile catalog/me, email subscribe + unsubscribe.
- **Frontend**: Vitest + React Testing Library + jsdom. Initial suite
  covers `Footer` and the `I18nProvider` (English fallback + missing-key
  behaviour).

#### Operations
- **Docker Compose** stack at the repo root: `postgis/postgis:16-3.4-alpine`
  with the migrations mounted into `docker-entrypoint-initdb.d`, plus
  multi-stage Dockerfiles for the backend and frontend (`dev`, `build`,
  `prod` targets).
- **Cross-platform dev scripts**: `scripts/dev.mjs` and `scripts/setup.mjs`
  (Node, work on macOS / Linux / Windows with prefixed `[backend]` /
  `[frontend]` log streams), plus `scripts/dev.ps1` and `scripts/setup.ps1`
  for PowerShell.
- **CI overhaul** (`.github/workflows/ci.yml`): three parallel jobs —
  `backend` (typecheck + jest + build), `frontend` (typecheck + lint +
  vitest + build), `mobile` (typecheck) — all with `npm ci` caching.

#### Refactors
- Backend `src/index.ts` split: HTTP wiring lives in a new
  `src/app.ts` `createApp()` factory so Supertest can mount the same
  app without `app.listen()`. `index.ts` now only loads dotenv and starts
  the listener.
- New `optionalAuth` middleware: populates `req.auth` if a valid token is
  present but does not reject anonymous requests. Used by reports/comments/
  flags/email-subscriptions endpoints.

#### Documentation
- `docs/ROADMAP.md` rewritten to reflect the shipped 0.1.0 baseline and
  to track the new Phase 2 / Phase 5 items as `[x]` or `[ ]`.
- README dev section updated with Docker Compose and cross-platform
  Node-based instructions.

### Fixed
- Backend `tsc --noEmit`: `pool.query<T>()` return typing and `JWT_EXPIRES`
  cast for `jsonwebtoken` v9 `SignOptions`.
- Frontend ESLint: added `frontend/.eslintrc.json` (non-interactive
  `next lint`), disabled `@next/next/no-img-element` for dynamic map /
  API image URLs, and fixed `react-hooks/exhaustive-deps` in
  `LatestPictures` (`withinDays` in the effect dependency list).
- `scripts/dev.ps1` now runs `cmd.exe /c npm run dev` so `npm` resolves
  correctly when spawned from PowerShell.
- Frontend `npm test` defaults to `vitest run` (no watch mode hang); CI
  frontend job calls `npm test` without extra flags.

## [0.1.0] - 2026-05-09

First public release. End-to-end MVP of the HackTheTrash platform for the
city of Pristina: citizens can report illegal dumps with photo + GPS, the
report appears as a pin on a public OpenStreetMap layer, and a hardened
admin panel lets moderators approve / reject every submission.

### Added

#### Platform scaffold
- Repository layout under `hackthetrash/` with `frontend/`, `backend/`,
  `mobile/`, `docs/`, `scripts/`, `.github/workflows/`, `README.md`,
  `CONTRIBUTING.md`, `LICENSE` (MIT) and the original civic-tech
  precedents / Pristina dossier kept at the repo root.
- GitHub Actions CI workflow that builds the backend and frontend on
  every push to `main`.

#### Web app (Next.js 14 + TypeScript + TailwindCSS + Leaflet)
- Landing page with hero, Pristina pilot banner, "How it works" section
  and primary CTAs.
- `/report` page: drag-and-drop multi-photo upload, browser geolocation,
  Leaflet click-to-pin location picker, trash-type chips, severity
  selector, optional anonymous toggle, success screen that deep-links
  to the freshly placed pin on the public map.
- `/map` page: full-screen interactive map using OpenStreetMap raster
  tiles, color-coded markers per status (reported / verified / cleaning
  / cleaned / rejected), photo gallery in marker popups, refresh
  button, legend, 30-second polling so newly submitted reports appear
  automatically, deep-link `?lat=&lng=&id=` for fly-to + highlight.
- Map always starts on Prishtina city centre with `maxBounds` covering
  greater Prishtina, sensible `minZoom` / `maxZoom`, and a floating
  **Pristina** home button to recentre at any time.
- `/dashboard` page: status counts and a tabular list of reports for
  authority users.
- Pages, layout, header, language switcher and html `lang` synchronised
  with the active locale.

#### Mobile app (React Native + Expo)
- New `mobile/` workspace with Expo 51, TypeScript, navigation
  (`@react-navigation/native-stack`), gesture-handler, safe-area-context.
- Screens: **Home**, **Report**, **Map**, **Success**, **Settings**.
- Native camera capture and photo library selection via
  `expo-image-picker`; high-accuracy GPS via `expo-location`.
- OpenStreetMap layer rendered with Leaflet inside `react-native-webview`
  (no API keys required); same Pristina default centre, bounds, zoom
  limits and Home control as the web client; auto fly-to a freshly
  submitted report on success.
- Brand assets generated programmatically: `icon.png` (1024x1024),
  `splash.png` (1242x2436), `adaptive-icon.png`, `favicon.png`,
  `notification-icon.png`.
- `eas.json` with **development**, **preview** and **production** build
  profiles; `npm run build:android|ios` shortcuts in `package.json`.
- **Push notifications** via `expo-notifications`: device token
  registration on boot, push channel for Android, deep-link on tap to
  the related report's coordinates.
- **Offline submission queue**: `submitOrQueue()` falls back to an
  AsyncStorage-backed queue when offline, photos persisted to
  `FileSystem.documentDirectory/htt-queue/` so they survive a process
  restart, automatic flush on app start and on `AppState` foreground.

#### Backend (Node.js + Express + TypeScript)
- REST API with `/api/reports`, `/api/auth`, `/api/devices` and
  `/api/admin` routers, multer-based photo uploads served from `/uploads`.
- Quick-start in-memory store seeded with Pristina demo reports (so the
  app runs without a database) and a full PostgreSQL + PostGIS layer
  for production.
- Database migrations: `users`, `reports` (PostGIS `GEOGRAPHY(POINT)`),
  `photos`, `comments`, `status_updates`, `flags`, plus auto
  `updated_at` triggers and a `reports_within(lat,lng,m)` helper.
- Seed scripts: `db:seed` (demo reports near Skanderbeg Square, Sunny
  Hill and UCK Street) and `db:seed-admin` (bcrypt-hashed admin user).
- Pluggable AI image classifier under `backend/src/ai/`:
  `MockClassifier` for local dev, `HuggingFaceClassifier` calling
  `api-inference.huggingface.co`. Auto-moderation drives status to
  `verified` / `rejected` / `queue_for_review` based on confidence.
- Devices registry (`/api/devices`) and Expo push service that fans out
  notifications to every device when a report changes status.

#### Authentication, admin panel and hardening
- bcrypt password hashing (cost 12) via `services/users.ts`.
- JWT auth with `JWT_SECRET` and configurable `JWT_EXPIRES`
  (default 12h). Tokens are re-validated against the user store on
  every request so role changes / revocations take effect immediately.
- `requireRole(...)` middleware for fine-grained access control.
- Per-IP brute-force protection: 5 failed `/auth/login` attempts in a
  15-minute window trigger a 15-minute lockout.
- CORS allowlist via `CORS_ORIGINS`.
- Hardening headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`.
- Express body limit reduced to 1 MB; `trust proxy` enabled.
- New protected admin endpoints under `/api/admin`:
  `GET /reports?status=`, `GET /stats`,
  `PATCH /reports/:id/{approve|reject|cleaning|cleaned}`. Each decision
  is written to the `status_updates` audit trail and triggers a push.
- New web pages `/admin/login` and `/admin` with photo cards, AI score,
  status filter chips, four-action moderation buttons, and an
  `?next=` deep-link redirect after sign-in. Wrapped in a
  `RequireAuth` component that redirects unauthenticated users.

#### Internationalisation
- Shared locale JSON files under `/locales` consumed by both the web
  client (`I18nProvider` in `frontend/src/lib/i18n.tsx`) and the mobile
  client (`mobile/src/lib/i18n.ts` using `i18n-js` +
  `expo-localization`).
- 111 keys covering navigation, home, report form, map, dashboard,
  admin, queue, settings and common strings.
- English and Albanian (Shqip) with full UTF-8 diacritics (e.g. ë, Ë, ç, Ç). HTML `lang`
  and `document.title` automatically follow the active locale.
- Language switcher rendered as a flag button group (EN / SQ).

#### Documentation
- `docs/architecture/ARCHITECTURE.md`, `docs/api/API.md`,
  `docs/DATABASE.md`, `docs/AI.md`, `docs/MOBILE.md`, `docs/ADMIN.md`,
  `docs/ROADMAP.md`.
- `docs/wireframes/WIREFRAMES.md` with three user flows and four
  ASCII wireframes.
- `docs/mockups/index.html` + `styles.css`: standalone HTML/CSS
  mockups of the four key screens with a colour palette section.

### Changed
- Project scope narrowed from "any city" to **Pristina only** -
  hero tagline, Pristina pilot banner, default map centre
  (`42.6629, 21.1655`) and demo data updated accordingly.
- i18n reduced from English / Albanian / Italian to **English +
  Albanian** in line with the Pristina-only focus; Italian locale
  removed.
- Auth route replaced from a stub to a real bcrypt + JWT flow with
  brute-force protection.
- Backend seed reorganised to insert demo reports around Skanderbeg
  Square, Sunny Hill and UÇK Street, with Komuna e Prishtinës as the
  authority user.
- Header now shows an **Admin** + **Logout** link when signed in,
  otherwise a **Sign in** link.

### Fixed
- Submitted reports now appear as a pin on the OpenStreetMap layer
  immediately and survive across reloads (photos persisted server-side
  via multer, fetched in popups).
- Map popup status names, severity labels and the "your report" badge
  now use the active locale instead of raw English.

### Project history (pre-platform, kept for context)
- The initial repository was a research dossier on Pristina trash
  management: civic-tech precedents survey, presentation links,
  on-site trash photographs (Sunny Hill, UÇK Street), structured
  extraction of INDEP / KAS / GIZ / MMPHI documents, RACI suites
  for operational / policy / enforcement actors, master timeline
  2010-2027, system-map JSON, old-law-vs-new-law diff and tensions
  notes. The platform under `hackthetrash/` was added on top of that
  body of work.

[0.1.0]: https://github.com/flosskosova/trash/releases/tag/v0.1.0
[Unreleased]: https://github.com/flosskosova/trash/compare/v0.1.0...HEAD
