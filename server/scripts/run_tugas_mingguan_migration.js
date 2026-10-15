import dotenv from "dotenv";
dotenv.config();
import { pool } from "../config/db.js";

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log("🚀 Starting database migration for Tugas Mingguan...");

    // 1. Table tugas_mingguan (Dibuat oleh Mentor)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tugas_mingguan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_nama VARCHAR(255) NOT NULL,
        kelompok VARCHAR(100) NOT NULL,
        minggu_ke INT NOT NULL,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT NOT NULL,
        file_attachment VARCHAR(500) DEFAULT NULL,
        deadline DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_tm_mentor (mentor_nama),
        KEY idx_tm_kelompok (kelompok)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'tugas_mingguan' ready.");

    // 2. Table tugas_mingguan_submissions (Dikumpulkan oleh Mahasiswa)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tugas_mingguan_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tugas_id INT NOT NULL,
        student_nama VARCHAR(255) NOT NULL,
        kelompok VARCHAR(100) NOT NULL,
        catatan_mahasiswa TEXT DEFAULT NULL,
        file_url VARCHAR(500) DEFAULT NULL,
        link_url VARCHAR(500) DEFAULT NULL,
        nilai DECIMAL(5,2) DEFAULT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'submitted',
        catatan_mentor TEXT DEFAULT NULL,
        submitted_at DATETIME NOT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tugas_student (tugas_id, student_nama),
        KEY idx_tms_tugas (tugas_id),
        KEY idx_tms_student (student_nama),
        CONSTRAINT fk_tms_tugas FOREIGN KEY (tugas_id) REFERENCES tugas_mingguan(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ Table 'tugas_mingguan_submissions' ready.");

  } catch (err) {
    console.error("❌ Error during migration:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
