import fs from "fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    const sql = fs.readFileSync("database_mysql.sql", "utf-8");
    const statements = sql.split(";").filter(s => s.trim() !== "");
    for (let s of statements) {
      if (s.trim().length > 0) {
        await pool.query(s);
      }
    }
    console.log("Database schema imported successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
