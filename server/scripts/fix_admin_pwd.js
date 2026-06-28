import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

async function updateAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    
    await pool.query(
      "UPDATE users SET password = ? WHERE nama = 'admin'",
      [hashedPassword]
    );
    console.log("Admin password hashed successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
updateAdmin();
