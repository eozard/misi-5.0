import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function checkAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE nama = 'admin'");
    if (rows.length > 0) {
      console.log("Admin exists:", rows[0]);
    } else {
      console.log("Admin NOT found. Inserting admin...");
      await pool.query(
        "INSERT INTO users (nama, password, role) VALUES ('admin', 'admin123', 'admin')"
      );
      console.log("Admin inserted successfully.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
checkAdmin();
