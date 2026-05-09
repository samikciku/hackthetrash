-- Demo seed data
INSERT INTO users (id, email, password_hash, name, role, region)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@hackthetrash.org', 'replace_with_bcrypt', 'Admin', 'admin', 'global'),
  ('22222222-2222-2222-2222-222222222222', 'milano@city.gov',         'replace_with_bcrypt', 'Comune Milano', 'authority', 'Milano')
ON CONFLICT (email) DO NOTHING;

INSERT INTO reports (id, user_id, geom, latitude, longitude, description, severity, tags, status, anonymous)
VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001',
   NULL,
   ST_SetSRID(ST_MakePoint(9.19, 45.4642), 4326),
   45.4642, 9.19, 'Pile of plastic bottles near the park', 'medium', ARRAY['Plastic'], 'reported', TRUE),
  ('aaaaaaa1-0000-0000-0000-000000000002',
   NULL,
   ST_SetSRID(ST_MakePoint(9.20, 45.4700), 4326),
   45.47, 9.20, 'Construction debris dumped on roadside', 'large', ARRAY['Construction'], 'cleaned', TRUE)
ON CONFLICT (id) DO NOTHING;
