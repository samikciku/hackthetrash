-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS trigger AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS reports_updated_at ON reports;
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Helper: nearby reports within meters
CREATE OR REPLACE FUNCTION reports_within(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_meters INT DEFAULT 100
) RETURNS SETOF reports AS $func$
  SELECT *
  FROM reports
  WHERE ST_DWithin(
    geom,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_meters
  );
$func$ LANGUAGE sql STABLE;
