import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

async function checkAllUsers() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    const [users] = await pool.query(
      "SELECT id, nama, password, role, kelompok, max_devices FROM users ORDER BY role, nama"
    );
    console.log(`\n=== FOUND ${users.length} USERS ===\n`);

    for (const u of users) {
      const isHashed = u.password.startsWith("$2a$") || u.password.startsWith("$2b$");
      const passPreview = isHashed
        ? `${u.password.substring(0, 20)}... (HASHED)`
        : `${u.password} (PLAIN TEXT!)`;

      // Test if "123456" works
      let testResult = "N/A";
      if (isHashed) {
        const match = await bcrypt.compare("123456", u.password);
        testResult = match ? "✅ 123456 works" : "❌ 123456 does NOT work";
      }

      console.log(`[${u.role.toUpperCase()}] ${u.nama}`);
      console.log(`  ID: ${u.id} | Kelompok: ${u.kelompok || "-"} | Max Devices: ${u.max_devices}`);
      console.log(`  Password: ${passPreview}`);
      console.log(`  Test login with '123456': ${testResult}`);
      console.log("");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

checkAllUsers();
