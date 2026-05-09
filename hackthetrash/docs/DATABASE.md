# Database Setup (PostgreSQL + PostGIS)

## Prerequisites
- PostgreSQL 14+
- PostGIS extension

## Quick Start (Docker)
```bash
docker run -d --name htt-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=hackthetrash \
  -p 5432:5432 \
  postgis/postgis:15-3.4
```

Then in `backend/.env`:
```
DATABASE_URL=postgresql://postgres:secret@localhost:5432/hackthetrash
```

## Run Migrations & Seed
```bash
cd backend
npm install
npm run db:migrate   # creates tables, indexes, functions
npm run db:seed      # inserts demo data
npm run dev
```

## Schema Overview

| Table         | Purpose                                          |
|---------------|--------------------------------------------------|
| users         | citizens / moderators / authorities / admins     |
| reports       | trash reports (geom = PostGIS POINT)             |
| photos        | photo URLs linked to reports                     |
| comments      | discussions on reports                           |
| status_updates| audit trail for status transitions               |
| flags         | user-submitted abuse reports                     |

## Geospatial Queries

```sql
-- All reports within 100m of a point
SELECT * FROM reports_within(45.4642, 9.19, 100);

-- Count reports per status
SELECT status, COUNT(*) FROM reports GROUP BY status;

-- Heatmap aggregation (hexbin example)
SELECT ST_AsGeoJSON(ST_SnapToGrid(geom::geometry, 0.01)) AS cell, COUNT(*)
FROM reports GROUP BY cell;
```
