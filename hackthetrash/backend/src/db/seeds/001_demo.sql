-- Demo seed data for Pristina, Kosovo
INSERT INTO users (id, email, password_hash, name, role, region)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@hackthetrash.org', 'replace_with_bcrypt', 'Admin', 'admin', 'global'),
  ('22222222-2222-2222-2222-222222222222', 'pristina@city.gov',      'replace_with_bcrypt', 'Komuna e Prishtines', 'authority', 'Pristina')
ON CONFLICT (email) DO NOTHING;

INSERT INTO reports (id, user_id, geom, latitude, longitude, description, severity, tags, status, anonymous)
VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001',
   NULL,
   ST_SetSRID(ST_MakePoint(21.1655, 42.6629), 4326),
   42.6629, 21.1655, 'Plastic bottles near Skanderbeg Square', 'medium', ARRAY['Plastic'], 'reported', TRUE),
  ('aaaaaaa1-0000-0000-0000-000000000002',
   NULL,
   ST_SetSRID(ST_MakePoint(21.1782, 42.6699), 4326),
   42.6699, 21.1782, 'Construction debris in Sunny Hill', 'large', ARRAY['Construction'], 'cleaned', TRUE),
  ('aaaaaaa1-0000-0000-0000-000000000003',
   NULL,
   ST_SetSRID(ST_MakePoint(21.1565, 42.6651), 4326),
   42.6651, 21.1565, 'E-waste pile near UCK Street', 'medium', ARRAY['E-waste'], 'verified', TRUE)
ON CONFLICT (id) DO NOTHING;
