import { pool } from '../config/db.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log("Creating holidays table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATE NOT NULL UNIQUE,
        keterangan VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'holidays' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
