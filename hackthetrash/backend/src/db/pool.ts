import { Pool, QueryResultRow } from "pg";

let _pool: Pool | null = null;

/**
 * Single shared pool — created only when DATABASE_URL is set (avoids pg defaulting
 * to localhost on Vercel when env was missing during cold start).
 */
function getPool(): Pool {
  const conn = process.env.DATABASE_URL;
  if (!conn || !String(conn).trim()) {
    throw new Error("DATABASE_URL is not set or is empty");
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString: conn,
      max: Math.min(10, Math.max(1, Number(process.env.PG_POOL_MAX || 10))),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000
    });
  }
  return _pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  return getPool().query<T>(text, params);
}

export async function poolEnd(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/**
 * Minimal pool-like surface for migrate.ts / seed.ts / seed-admin.ts
 * (`pool.query`, `await pool.end()`).
 */
export const pool = {
  query(text: string, params?: any[]) {
    return getPool().query(text, params);
  },
  end: () => poolEnd()
};
