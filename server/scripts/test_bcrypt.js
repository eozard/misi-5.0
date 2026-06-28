import bcrypt from "bcryptjs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("bcryptjs/package.json");

console.log("bcryptjs version:", pkg.version);

// Test hash and compare
const hash = bcrypt.hashSync("123456", 10);
console.log("Hash:", hash);
const match = bcrypt.compareSync("123456", hash);
console.log("Compare sync:", match);

// Test async compare
const matchAsync = await bcrypt.compare("123456", hash);
console.log("Compare async:", matchAsync);

// Test with existing hashed password from DB
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pkl",
});

const [users] = await pool.query("SELECT nama, password, role FROM users WHERE role IN ('mahasiswa', 'mentor') LIMIT 2");
for (const u of users) {
  try {
    const m = await bcrypt.compare("123456", u.password);
    console.log(`${u.nama} (${u.role}): compare result = ${m}`);
  } catch (err) {
    console.error(`${u.nama} (${u.role}): ERROR - ${err.message}`);
  }
}

await pool.end();
