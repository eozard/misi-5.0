import dotenv from "dotenv";
dotenv.config();
import { pool } from "../config/db.js";

async function run() {
  const conn = await pool.getConnection();
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS tugas_akhir (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_nama VARCHAR(255) NOT NULL,
        mentor_nama VARCHAR(255) NOT NULL,
        kelompok VARCHAR(100) NOT NULL,
        judul VARCHAR(500) NOT NULL,
        deskripsi TEXT DEFAULT NULL,
        file_url VARCHAR(500) DEFAULT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        catatan_mentor TEXT DEFAULT NULL,
        submitted_at DATETIME DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_ta_student (student_nama),
        KEY idx_ta_mentor (mentor_nama),
        KEY idx_ta_kelompok (kelompok),
        KEY idx_ta_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await conn.query(query);
    console.log("✅ Table tugas_akhir created successfully.");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
