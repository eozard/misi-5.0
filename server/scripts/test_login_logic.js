import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

const parseDevices = (val) => {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

async function testLoginRoute() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pkl",
  });

  const conn = await pool.getConnection();
  try {
    const nama = "Mad";
    const password = "123456";
    const deviceId = "test_device_123";

    console.log("1. Get user");
    const [userRows] = await conn.query(
      "SELECT id, nama, password, role, kelompok, devices, max_devices FROM users WHERE nama = ? LIMIT 1",
      [nama],
    );
    if (userRows.length === 0) throw new Error("User not found");
    const userRow = userRows[0];
    const user = { ...userRow, devices: parseDevices(userRow.devices) };

    console.log("2. Device binding check");
    if (user.role !== "admin" && user.role !== "mentor") {
      const [bindings] = await conn.query(
        "SELECT user_name FROM device_bindings WHERE device_id = ? LIMIT 1",
        [deviceId],
      );
    }

    console.log("3. Password check");
    let passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", passwordMatch);

    console.log("4. Device update");
    if (user.role !== "admin" && user.role !== "mentor") {
      const existingDevices = user.devices || [];
      const deviceExists = existingDevices.some((d) => d.deviceId === deviceId);
      
      if (!deviceExists) {
        if (existingDevices.length >= user.max_devices) {
            throw new Error("Max devices reached");
        }

        const newDevice = {
          deviceId,
          firstSeen: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 1,
        };
        const updatedDevices = [...existingDevices, newDevice];

        await conn.query("UPDATE users SET devices = ? WHERE id = ?", [
          JSON.stringify(updatedDevices),
          user.id,
        ]);

        console.log("5. Insert device_bindings");
        await conn.query(
          `INSERT INTO device_bindings
            (device_id, user_name, kelompok, bound_at, last_used, usage_count)
           VALUES (?, ?, ?, NOW(), NOW(), 1)`,
          [deviceId, nama, user.kelompok],
        );
      }
    }
    
    console.log("Login logic completed successfully");
  } catch (err) {
    console.error("Login logic failed:", err);
  } finally {
    conn.release();
    await pool.end();
  }
}
testLoginRoute();
