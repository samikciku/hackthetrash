// Seed an admin user into Postgres using bcrypt-hashed password.
// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=SuperSecret npm run db:seed-admin
import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool, query } from "./pool";

async function run() {
  const email = (process.env.ADMIN_EMAIL || "admin@hackthetrash.org").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe!2026";
  const name = process.env.ADMIN_NAME || "Admin";
  const region = process.env.ADMIN_REGION || "Prishtina";

  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (email, password_hash, name, role, region)
     VALUES ($1, $2, $3, 'admin', $4)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   role = 'admin',
                   name = EXCLUDED.name,
                   region = EXCLUDED.region`,
    [email, hash, name, region]
  );
  console.log("Admin user seeded:", email);
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
