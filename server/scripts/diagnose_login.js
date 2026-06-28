import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

async function diagnose() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    // 1. List all users
    const [users] = await pool.query("SELECT id, nama, password, role, kelompok FROM users");
    console.log(`\n=== DAFTAR USERS (${users.length}) ===`);
    for (const u of users) {
      const isHashed = u.password.startsWith("$2a$") || u.password.startsWith("$2b$");
      console.log(`  ID:${u.id} | ${u.nama} | role:${u.role} | kelompok:${u.kelompok} | hashed:${isHashed} | pwd_preview:${u.password.substring(0,15)}...`);
    }

    // 2. Test login for each user with common passwords
    const testPasswords = ["admin123", "123456", "password", "rahasia123"];
    console.log("\n=== TES LOGIN ===");
    for (const u of users) {
      for (const pwd of testPasswords) {
        const match = await bcrypt.compare(pwd, u.password);
        if (match) {
          console.log(`  ✅ ${u.nama} (${u.role}) → password cocok dengan: "${pwd}"`);
          break;
        }
      }
    }

    // 3. Check tables exist
    const [tables] = await pool.query("SHOW TABLES");
    console.log("\n=== TABEL DATABASE ===");
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
diagnose();
