import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

async function fixAllPasswords() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    const [users] = await pool.query("SELECT id, nama, password, role FROM users");
    console.log(`Found ${users.length} users to check.\n`);

    for (const user of users) {
      // bcrypt hashes always start with $2a$ or $2b$ — if not, it's plain text
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        console.log(`✅ ${user.nama} (${user.role}) — already hashed, skipping.`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(user.password, salt);
      await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
      console.log(`🔧 ${user.nama} (${user.role}) — password hashed successfully.`);
    }

    console.log("\n✅ All passwords have been processed.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

fixAllPasswords();
