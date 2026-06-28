import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function checkDeviceBindings() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  try {
    // Check device_bindings table
    const [bindings] = await pool.query("SELECT * FROM device_bindings ORDER BY user_name");
    console.log(`\n=== DEVICE BINDINGS (${bindings.length} records) ===\n`);
    for (const b of bindings) {
      console.log(`Device: ${b.device_id}`);
      console.log(`  User: ${b.user_name} | Kelompok: ${b.kelompok}`);
      console.log(`  Bound at: ${b.bound_at} | Last used: ${b.last_used}`);
      console.log(`  Usage count: ${b.usage_count}`);
      console.log("");
    }

    // Check user devices JSON
    const [users] = await pool.query("SELECT id, nama, role, devices, max_devices FROM users");
    console.log(`\n=== USER DEVICES ===\n`);
    for (const u of users) {
      let devices = [];
      try {
        devices = typeof u.devices === "string" ? JSON.parse(u.devices) : (u.devices || []);
      } catch { devices = []; }
      console.log(`[${u.role}] ${u.nama} — ${devices.length}/${u.max_devices} devices`);
      for (const d of devices) {
        console.log(`  📱 ${d.deviceId} (usage: ${d.usageCount || 0})`);
      }
      console.log("");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

checkDeviceBindings();
