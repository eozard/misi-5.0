/*
 * ============================================================================
 * SEED SCRIPT - Inisialisasi data awal ke MySQL
 * ============================================================================
 * Cara pakai:  npm run seed
 *
 * Fungsi:
 * 1. Pastikan koneksi MySQL berhasil
 * 2. Insert admin default (username: admin, password: admin123)
 *    untuk halaman /admin (absensi) - TABEL users
 * 3. Insert admin_pendaftaran default (username: admin, password: admin123)
 *    untuk halaman /admin_pendaftaran - TABEL admin_pendaftaran
 * 4. Insert 1 user contoh: mahasiswa + 1 user contoh: anak_smk
 *    agar bisa langsung login & test
 * ============================================================================
 */

import bcrypt from "bcryptjs";
import { pool, testConnection } from "../config/db.js";

const DEFAULT_PASSWORD = "admin123";

async function seed() {
  console.log("\n🌱 SEED DATABASE\n" + "=".repeat(60));

  // 1. Test koneksi
  const db = await testConnection();
  if (!db.ok) {
    console.error(`❌ Database connection gagal: ${db.error}`);
    console.error(
      "   Pastikan MySQL XAMPP sudah nyala dan database 'pkl' sudah ada.",
    );
    process.exit(1);
  }
  console.log("✅ Database connected\n");

  const conn = await pool.getConnection();
  try {
    // 2. Admin default untuk tabel users (admin absensi)
    const [adminRows] = await conn.query(
      "SELECT id FROM users WHERE nama = ? LIMIT 1",
      ["admin"],
    );
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await conn.query(
        `INSERT INTO users (nama, password, role, kelompok, devices, max_devices)
         VALUES (?, ?, 'admin', NULL, ?, 999)`,
        ["admin", hash, JSON.stringify([])],
      );
      console.log("✅ User admin dibuat: nama=admin, password=admin123");
    } else {
      console.log("ℹ️  User admin sudah ada (skip)");
    }

    // 3. Admin default untuk tabel admin_pendaftaran
    const [apRows] = await conn.query(
      "SELECT id FROM admin_pendaftaran WHERE username = ? LIMIT 1",
      ["admin"],
    );
    if (apRows.length === 0) {
      const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await conn.query(
        "INSERT INTO admin_pendaftaran (username, password, nama) VALUES (?, ?, ?)",
        ["admin", hash, "Admin Pendaftaran"],
      );
      console.log(
        "✅ Admin pendaftaran dibuat: username=admin, password=admin123",
      );
    } else {
      console.log("ℹ️  Admin pendaftaran sudah ada (skip)");
    }

    // 4. Sample mahasiswa
    const [mhsRows] = await conn.query(
      "SELECT id FROM users WHERE nama = ? LIMIT 1",
      ["mahasiswa01"],
    );
    if (mhsRows.length === 0) {
      const hash = await bcrypt.hash("mahasiswa123", 10);
      await conn.query(
        `INSERT INTO users (nama, password, role, kelompok, devices, max_devices)
         VALUES (?, ?, 'mahasiswa', 'Kelompok 1', ?, 2)`,
        ["mahasiswa01", hash, JSON.stringify([])],
      );
      console.log(
        "✅ Sample mahasiswa dibuat: nama=mahasiswa01, password=mahasiswa123",
      );
    }

    // 5. Sample anak SMK
    const [smkRows] = await conn.query(
      "SELECT id FROM users WHERE nama = ? LIMIT 1",
      ["smk01"],
    );
    if (smkRows.length === 0) {
      const hash = await bcrypt.hash("smk123", 10);
      await conn.query(
        `INSERT INTO users (nama, password, role, kelompok, devices, max_devices)
         VALUES (?, ?, 'anak_smk', 'Kelompok 2', ?, 2)`,
        ["smk01", hash, JSON.stringify([])],
      );
      console.log(
        "✅ Sample anak SMK dibuat: nama=smk01, password=smk123",
      );
    }

    // 6. Sample Ahmad
    const [ahmadRows] = await conn.query(
      "SELECT id FROM users WHERE nama = ? LIMIT 1",
      ["Ahmad"],
    );
    if (ahmadRows.length === 0) {
      const hash = await bcrypt.hash("ahmad123", 10);
      await conn.query(
        `INSERT INTO users (nama, password, role, kelompok, devices, max_devices)
         VALUES (?, ?, 'mahasiswa', 'jaringan', ?, 2)`,
        ["Ahmad", hash, JSON.stringify([])],
      );
      console.log("✅ Sample Ahmad dibuat: nama=Ahmad, password=ahmad123");
    }

    // 7. Sample Jamilah (Mentor)
    const [jamilahRows] = await conn.query(
      "SELECT id FROM users WHERE nama = ? LIMIT 1",
      ["Jamilah"],
    );
    if (jamilahRows.length === 0) {
      const hash = await bcrypt.hash("jamilah123", 10);
      await conn.query(
        `INSERT INTO users (nama, password, role, kelompok, devices, max_devices)
         VALUES (?, ?, 'mentor', 'jaringan', ?, 999)`,
        ["Jamilah", hash, JSON.stringify([])],
      );
      console.log("✅ Sample Jamilah dibuat: nama=Jamilah, password=jamilah123");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Seed selesai!\n");
    console.log("Akun default:");
    console.log("  Admin absensi        : nama=admin     password=admin123");
    console.log("  Admin pendaftaran     : username=admin password=admin123");
    console.log("  Sample mahasiswa      : nama=mahasiswa01 password=mahasiswa123");
    console.log("  Sample anak SMK       : nama=smk01     password=smk123");
    console.log("  Sample Ahmad          : nama=Ahmad     password=ahmad123");
    console.log("  Sample Jamilah        : nama=Jamilah   password=jamilah123");
    console.log("=".repeat(60) + "\n");
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  } finally {
    conn.release();
    pool.end();
  }
}

seed();
