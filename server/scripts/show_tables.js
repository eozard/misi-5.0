import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function showTables() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });
  
  try {
    const [rows] = await pool.query("SHOW TABLES");
    console.log("Tables:");
    console.log(rows.map(r => Object.values(r)[0]).join(", "));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
showTables();
