// Lightweight user store. Uses Postgres when DATABASE_URL is set,
// otherwise falls back to an in-memory store seeded from env vars.
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { query } from "../db/pool";

export type Role = "citizen" | "moderator" | "authority" | "admin";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: Role;
  region: string | null;
}

const USE_DB = !!process.env.DATABASE_URL;

// In-memory store with a default admin (password configurable via env).
// Only used when DATABASE_URL is not set, e.g. during local quick-demo.
const memUsers: User[] = (() => {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@hackthetrash.org").toLowerCase();
  const adminPlain = process.env.ADMIN_PASSWORD || "ChangeMe!2026";
  return [
    {
      id: "11111111-1111-1111-1111-111111111111",
      email: adminEmail,
      password_hash: bcrypt.hashSync(adminPlain, 10),
      name: "Admin",
      role: "admin",
      region: "Pristina"
    }
  ];
})();

export const Users = {
  async findByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    if (USE_DB) {
      const { rows } = await query<User>(
        `SELECT id, email, password_hash, name, role, region FROM users WHERE LOWER(email) = $1 LIMIT 1`,
        [lower]
      );
      return rows[0] ?? null;
    }
    return memUsers.find((u) => u.email === lower) ?? null;
  },

  async findById(id: string): Promise<User | null> {
    if (USE_DB) {
      const { rows } = await query<User>(
        `SELECT id, email, password_hash, name, role, region FROM users WHERE id = $1 LIMIT 1`,
        [id]
      );
      return rows[0] ?? null;
    }
    return memUsers.find((u) => u.id === id) ?? null;
  },

  async create(opts: {
    email: string;
    password: string;
    name?: string;
    role?: Role;
    region?: string;
  }): Promise<User> {
    const hash = await bcrypt.hash(opts.password, 12);
    const lower = opts.email.toLowerCase();
    if (USE_DB) {
      const { rows } = await query<User>(
        `INSERT INTO users (email, password_hash, name, role, region)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, password_hash, name, role, region`,
        [lower, hash, opts.name ?? null, opts.role ?? "citizen", opts.region ?? null]
      );
      return rows[0];
    }
    const u: User = {
      id: uuid(),
      email: lower,
      password_hash: hash,
      name: opts.name ?? null,
      role: opts.role ?? "citizen",
      region: opts.region ?? null
    };
    memUsers.push(u);
    return u;
  },

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },

  async updatePassword(id: string, newPlain: string): Promise<boolean> {
    const hash = await bcrypt.hash(newPlain, 12);
    if (USE_DB) {
      const { rows } = await query(
        `UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id`,
        [id, hash]
      );
      return rows.length > 0;
    }
    const u = memUsers.find((x) => x.id === id);
    if (!u) return false;
    u.password_hash = hash;
    return true;
  },

  async list(): Promise<User[]> {
    if (USE_DB) {
      const { rows } = await query<User>(
        `SELECT id, email, password_hash, name, role, region FROM users ORDER BY role, email`
      );
      return rows;
    }
    return [...memUsers];
  },

  async setRole(id: string, role: Role): Promise<boolean> {
    if (USE_DB) {
      const { rows } = await query(
        `UPDATE users SET role = $2 WHERE id = $1 RETURNING id`, [id, role]
      );
      return rows.length > 0;
    }
    const u = memUsers.find((x) => x.id === id);
    if (!u) return false;
    u.role = role;
    return true;
  },

  async remove(id: string): Promise<boolean> {
    if (USE_DB) {
      const { rows } = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
      return rows.length > 0;
    }
    const idx = memUsers.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    memUsers.splice(idx, 1);
    return true;
  }
};
