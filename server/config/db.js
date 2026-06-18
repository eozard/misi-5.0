/*
 * ============================================================================
 * KONFIGURASI MYSQL CONNECTION POOL
 * ============================================================================
 * File ini menginisialisasi koneksi MySQL/MariaDB lokal (XAMPP) menggunakan
 * package mysql2/promise.
 *
 * Koneksi dibuat dengan connection pool agar request bersamaan tidak perlu
 * membuka koneksi baru setiap kali.
 *
 * ENV YANG DIBUTUHKAN:
 *   DB_HOST     default: localhost
 *   DB_PORT     default: 3306
 *   DB_USER     default: root
 *   DB_PASSWORD default: (kosong, default XAMPP)
 *   DB_NAME     default: pkl
 * ============================================================================
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");
const localEnvPath = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: false });
}

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pkl",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  dateStrings: true,
  timezone: "+07:00",
};

if (!process.env.DB_NAME) {
  // Tidak throw, biar server tetap bisa start untuk debugging .env
  console.warn("⚠️  DB_NAME tidak di-set, gunakan default: pkl");
}

export const pool = mysql.createPool(dbConfig);

/**
 * Test koneksi ke database. Berguna untuk startup check.
 */
export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

/**
 * Helper: parse kolom devices (JSON) ke array JS.
 * MySQL JSON type dikembalikan sebagai string/object tergantung driver.
 */
export const parseDevices = (val) => {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default pool;
