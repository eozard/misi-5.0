import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

async function seedUsers() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  const usersToCreate = [
    { nama: "Mad", password: "123456", role: "mahasiswa", kelompok: "machine learning" },
    { nama: "Budi", password: "123456", role: "mahasiswa", kelompok: "machine learning" },
    { nama: "Siti", password: "123456", role: "mahasiswa", kelompok: "software engineering" },
    { nama: "Pak Mentor", password: "123456", role: "mentor", kelompok: "machine learning" },
  ];

  try {
    for (const u of usersToCreate) {
      // Check if already exists
      const [existing] = await pool.query("SELECT id FROM users WHERE nama = ?", [u.nama]);
      if (existing.length > 0) {
        console.log(`⏩ ${u.nama} (${u.role}) sudah ada, skip.`);
        continue;
      }

      const hashed = await bcrypt.hash(u.password, 10);
      const maxDevices = (u.role === "admin" || u.role === "mentor") ? 999 : 2;
      await pool.query(
        "INSERT INTO users (nama, password, role, kelompok, devices, max_devices) VALUES (?, ?, ?, ?, ?, ?)",
        [u.nama, hashed, u.role, u.kelompok, JSON.stringify([]), maxDevices]
      );
      console.log(`✅ ${u.nama} (${u.role}, kelompok: ${u.kelompok}) — dibuat! Password: ${u.password}`);
    }

    console.log("\n=== SEMUA AKUN SIAP ===");
    console.log("Login Mahasiswa → Nama: Mad  | Password: 123456");
    console.log("Login Mahasiswa → Nama: Budi | Password: 123456");
    console.log("Login Mentor    → Nama: Pak Mentor | Password: 123456");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
seedUsers();
