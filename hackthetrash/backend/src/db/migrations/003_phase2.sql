-- HackTheTrash — Phase 2 schema additions (community features).
-- Safe to re-run: each statement uses IF NOT EXISTS guards.

-- Extend users with public-facing profile fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(60),
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT;

-- Extend flags with resolution + free-form notes
ALTER TABLE flags
  ADD COLUMN IF NOT EXISTS note     TEXT,
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_flags_resolved ON flags(resolved);

-- Badges awarded to users
CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code        VARCHAR(40) NOT NULL,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, code)
);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);

-- Email subscriptions: get notified when reports near you change status
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  region      VARCHAR(120),
  unsubscribe_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_email_subs_region ON email_subscriptions(region);
