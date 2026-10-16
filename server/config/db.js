/* PostgreSQL connection to Supabase.
 * Existing route handlers keep their conn.query() API through this wrapper.
 * REST cannot execute the application's joins and transactions, so the
 * backend connects to Supabase PostgreSQL using its pooler URI.
 */
import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");
const localEnvPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(rootEnvPath)) dotenv.config({ path: rootEnvPath });
if (fs.existsSync(localEnvPath)) dotenv.config({ path: localEnvPath, override: false });

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!databaseUrl) console.warn("⚠️ SUPABASE_DB_URL belum di-set. Ambil URI dari Supabase Dashboard → Connect.");
const connectionString = databaseUrl?.replace(/[?&]sslmode=[^&]*/i, "").replace(/[?&]$/, "");

const pgPool = new Pool({
  connectionString,
  ssl: connectionString && !/localhost|127\.0\.0\.1/.test(connectionString)
    ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

const mysqlPlaceholdersToPg = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

const normalizeResult = (result, sql) => {
  const command = sql.trim().split(/\s+/)[0].toUpperCase();
  const rows = result.rows || [];
  const metadata = {
    affectedRows: result.rowCount || 0,
    insertId: rows[0]?.id ?? undefined,
    fieldCount: result.fields?.length || 0,
    command,
  };
  return command === "SELECT" || command === "WITH" ? [rows, metadata] : [metadata, rows];
};

const makeConnection = (client) => ({
  async query(sql, params = []) {
    let pgSql = mysqlPlaceholdersToPg(sql);
    if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/\bRETURNING\b/i.test(pgSql)) {
      pgSql = `${pgSql.trim().replace(/;$/, "")} RETURNING id`;
    }
    const result = await client.query(pgSql, params);
    return normalizeResult(result, pgSql);
  },
  async beginTransaction() { await client.query("BEGIN"); },
  async commit() { await client.query("COMMIT"); },
  async rollback() { await client.query("ROLLBACK"); },
  release() { client.release(); },
});

export const pool = {
  async getConnection() { return makeConnection(await pgPool.connect()); },
  async query(sql, params = []) {
    const client = await pgPool.connect();
    try { return await makeConnection(client).query(sql, params); }
    finally { client.release(); }
  },
};

export const testConnection = async () => {
  if (!databaseUrl) return { ok: false, error: "SUPABASE_DB_URL belum dikonfigurasi" };
  try {
    const client = await pgPool.connect();
    await client.query("SELECT 1");
    client.release();
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
};

export const parseDevices = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
};

export default pool;
