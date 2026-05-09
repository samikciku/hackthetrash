-- HackTheTrash — Initial schema
-- Requires PostgreSQL 14+ with PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name         VARCHAR(120),
  role         VARCHAR(20) NOT NULL DEFAULT 'citizen',
  region       VARCHAR(120),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  geom         GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  description  TEXT,
  severity     VARCHAR(10) NOT NULL DEFAULT 'medium',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  status       VARCHAR(20) NOT NULL DEFAULT 'reported',
  anonymous    BOOLEAN NOT NULL DEFAULT TRUE,
  ai_score     NUMERIC(4,3),
  ai_label     VARCHAR(60),
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_geom   ON reports USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user   ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_tags   ON reports USING GIN(tags);

CREATE TABLE IF NOT EXISTS photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  width       INT,
  height      INT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_report ON photos(report_id);

CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id);

CREATE TABLE IF NOT EXISTS status_updates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_status_report ON status_updates(report_id);

CREATE TABLE IF NOT EXISTS flags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  reason     VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
