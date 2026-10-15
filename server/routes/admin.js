/*
 * Admin routes: stats, users, devices, reports, izin approvals. (MySQL)
 */
import express from "express";
import bcrypt from "bcryptjs";
import { pool, parseDevices } from "../config/db.js";

const router = express.Router();

const todayWIB = () => {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
};

/*
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    console.log("📊 Get admin stats");

    const [mahasiswaRows] = await conn.query(
      "SELECT id FROM users WHERE role = 'mahasiswa'",
    );
    const [anakSmkRows] = await conn.query(
      "SELECT id FROM users WHERE role = 'anak_smk'",
    );
    const today = todayWIB();
    const [hadirRows] = await conn.query(
      "SELECT nama FROM attendances WHERE tanggal = ? AND status = 'hadir'",
      [today],
    );
    const [izinRows] = await conn.query(
      "SELECT nama FROM attendances WHERE tanggal = ? AND status = 'izin'",
      [today],
    );

    const hadirUnique = new Set(hadirRows.map((a) => a.nama));
    const izinUnique = new Set(izinRows.map((a) => a.nama));

    return res.json({
      success: true,
      stats: {
        totalMahasiswa: mahasiswaRows.length,
        totalAnakSmk: anakSmkRows.length,
        hadirToday: hadirUnique.size,
        izinToday: izinUnique.size,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/attendance-today
 */
export const getAttendanceToday = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const today = todayWIB();
    console.log(`📋 Get attendance untuk: ${today}`);

    const [rows] = await conn.query(
      "SELECT * FROM attendances WHERE tanggal = ? ORDER BY nama ASC",
      [today],
    );

    const result = {};
    rows.forEach((att) => {
      if (!result[att.nama]) {
        result[att.nama] = {
          nama: att.nama,
          kelompok: att.kelompok,
          pagi: null,
          sore: null,
        };
      }
      if (att.sesi === "pagi") {
        result[att.nama].pagi = { jam_masuk: att.jam_masuk, status: att.status };
      } else if (att.sesi === "sore") {
        result[att.nama].sore = { jam_masuk: att.jam_masuk, status: att.status };
      }
    });

    return res.json({ success: true, data: Object.values(result) });
  } catch (error) {
    console.error("Get attendance today error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/students
 */
export const getStudents = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    console.log("📋 Get all students");
    const [rows] = await conn.query(
      `SELECT nama, role, kelompok FROM users
       WHERE role IN ('mahasiswa','anak_smk')
       ORDER BY nama ASC`,
    );
    return res.json({ success: true, students: rows });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/attendance/:nama
 */
export const getStudentAttendance = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.params;
    console.log(`📖 Get attendance untuk: ${nama}`);

    const [rows] = await conn.query(
      "SELECT * FROM attendances WHERE nama = ? ORDER BY tanggal DESC",
      [nama],
    );

    let totalPagi = 0,
      totalSore = 0,
      totalAlpa = 0;
    rows.forEach((att) => {
      if (att.status === "hadir") {
        if (att.sesi === "pagi") totalPagi++;
        else if (att.sesi === "sore") totalSore++;
      } else if (att.status === "alpa") {
        totalAlpa++;
      }
    });

    return res.json({
      success: true,
      data: rows,
      summary: { totalPagi, totalSore, totalAlpa },
    });
  } catch (error) {
    console.error("Get student attendance error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/devices
 */
export const getDevices = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    console.log("📱 Get all devices");
    const [rows] = await conn.query(
      `SELECT device_id, user_name, kelompok, last_used
       FROM device_bindings ORDER BY last_used DESC`,
    );
    return res.json({ success: true, devices: rows });
  } catch (error) {
    console.error("Get devices error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * DELETE /api/admin/devices/:deviceId
 */
export const deleteDevice = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { deviceId } = req.params;
    console.log(`🗑️ Delete device: ${deviceId}`);

    // STEP 1: cari user pemilik
    const [bindingRows] = await conn.query(
      "SELECT user_name FROM device_bindings WHERE device_id = ? LIMIT 1",
      [deviceId],
    );
    if (bindingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device tidak ditemukan" });
    }
    const userName = bindingRows[0].user_name;

    // STEP 2: hapus dari device_bindings
    await conn.query("DELETE FROM device_bindings WHERE device_id = ?", [
      deviceId,
    ]);

    // STEP 3: bersihkan dari users.devices (JSON)
    const [userRows] = await conn.query(
      "SELECT devices FROM users WHERE nama = ? LIMIT 1",
      [userName],
    );
    if (userRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    const devices = parseDevices(userRows[0].devices);
    const updated = devices.filter((d) => d.deviceId !== deviceId);
    await conn.query("UPDATE users SET devices = ? WHERE nama = ?", [
      JSON.stringify(updated),
      userName,
    ]);

    console.log(
      `✅ Device ${deviceId} dihapus dari ${userName} (slot ${devices.length} → ${updated.length})`,
    );

    return res.json({ success: true, message: "Device berhasil dihapus" });
  } catch (error) {
    console.error("Delete device error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    console.log("👥 Get all users");
    const [users] = await conn.query(
      `SELECT id, nama, role, kelompok, devices, max_devices
       FROM users ORDER BY nama ASC`,
    );
    const [bindings] = await conn.query(
      "SELECT user_name FROM device_bindings",
    );

    const deviceCounts = bindings.reduce((acc, b) => {
      if (!b.user_name) return acc;
      acc[b.user_name] = (acc[b.user_name] || 0) + 1;
      return acc;
    }, {});

    const formatted = users.map((u) => ({
      ...u,
      devices: parseDevices(u.devices),
      devices_count: deviceCounts[u.nama] || 0,
    }));
    return res.json({ success: true, users: formatted });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * POST /api/admin/users/:id/reset-password
 */
export const resetUserPassword = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!id || !password) {
      return res
        .status(400)
        .json({ success: false, message: "User id dan password diperlukan" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password minimal 6 karakter" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [res1] = await conn.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, id],
    );
    if (res1.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    return res.json({ success: true, message: "Password user berhasil direset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User id diperlukan" });
    }

    const [userRows] = await conn.query(
      "SELECT id, nama, role FROM users WHERE id = ? LIMIT 1",
      [id],
    );
    if (userRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    const user = userRows[0];
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Tidak bisa hapus admin" });
    }

    await conn.query("DELETE FROM device_bindings WHERE user_name = ?", [
      user.nama,
    ]);
    await conn.query("DELETE FROM users WHERE id = ?", [id]);
    return res.json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * POST /api/admin/users
 */
export const createUser = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama, password, role, kelompok } = req.body;
    if (!nama || !password || !role || !kelompok) {
      return res.status(400).json({
        success: false,
        message: "Nama, password, role, dan kelompok diperlukan",
      });
    }
    console.log(`➕ Create user: ${nama} (${role})`);

    const [existing] = await conn.query(
      "SELECT id FROM users WHERE nama = ? LIMIT 1",
      [nama],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User sudah ada" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const maxDevices = role === "admin" ? 999 : 2;
    const [insertRes] = await conn.query(
      `INSERT INTO users (nama, password, role, kelompok, devices, max_devices)
       VALUES (?, ?, ?, ?, ? , ?)`,
      [nama, hashed, role, kelompok, JSON.stringify([]), maxDevices],
    );
    const [rows] = await conn.query(
      "SELECT id, nama, role, kelompok, max_devices FROM users WHERE id = ?",
      [insertRes.insertId],
    );
    console.log(`✅ User ${nama} berhasil dibuat`);
    return res.json({ success: true, message: "User berhasil dibuat", user: rows[0] });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/report
 */
export const getAttendanceReport = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { fromDate, toDate, kelompok, nama } = req.query;
    console.log(
      `📊 Get report: ${fromDate} to ${toDate}, kelompok: ${kelompok}, nama: ${nama}`,
    );

    const where = [];
    const params = [];
    if (fromDate) {
      where.push("tanggal >= ?");
      params.push(fromDate);
    }
    if (toDate) {
      where.push("tanggal <= ?");
      params.push(toDate);
    }
    if (kelompok && kelompok !== "all") {
      where.push("kelompok = ?");
      params.push(kelompok);
    }
    if (nama && nama !== "all") {
      where.push("nama = ?");
      params.push(nama);
    }

    const sql = `SELECT * FROM attendances
                 ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY tanggal DESC, jam_masuk DESC`;
    const [rows] = await conn.query(sql, params);

    return res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error("Get report error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/izin
 */
export const getAllIzin = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    console.log("📋 Get all izin requests");
    const [rows] = await conn.query(
      `SELECT id, nama, kelompok, tanggal, sesi, keterangan, bukti_url,
              status_approval, approved_by, approved_at, created_at
       FROM attendances WHERE status = 'izin'
       ORDER BY tanggal DESC`,
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * PUT /api/admin/izin/:id
 */
export const updateIzinStatus = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminName = req.user.nama;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status harus 'approved' atau 'rejected'" });
    }
    console.log(`✏️ Update izin ${id} to ${status} by ${adminName}`);

    const [res1] = await conn.query(
      `UPDATE attendances
       SET status_approval = ?, approved_by = ?, approved_at = NOW()
       WHERE id = ? AND status = 'izin'`,
      [status, adminName, id],
    );
    if (res1.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Izin tidak ditemukan" });
    }
    const [rows] = await conn.query(
      "SELECT * FROM attendances WHERE id = ?",
      [id],
    );
    console.log(
      `✅ Izin ${id} berhasil ${status === "approved" ? "disetujui" : "ditolak"}`,
    );
    return res.json({
      success: true,
      message: `Izin berhasil ${status === "approved" ? "disetujui" : "ditolak"}`,
      data: rows[0],
    });
  } catch (error) {
    console.error("Update izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * GET /api/admin/holidays
 */
export const getHolidays = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query("SELECT * FROM holidays ORDER BY tanggal ASC");
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get holidays error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * POST /api/admin/holidays
 */
export const addHoliday = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { tanggal, keterangan } = req.body;
    if (!tanggal || !keterangan) {
      return res.status(400).json({ success: false, message: "Tanggal dan Keterangan wajib diisi" });
    }
    
    // Validasi apakah tanggal sudah ada
    const [exist] = await conn.query("SELECT id FROM holidays WHERE tanggal = ?", [tanggal]);
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: "Tanggal libur tersebut sudah ada" });
    }

    const [result] = await conn.query(
      "INSERT INTO holidays (tanggal, keterangan) VALUES (?, ?)",
      [tanggal, keterangan]
    );

    const [newHoliday] = await conn.query("SELECT * FROM holidays WHERE id = ?", [result.insertId]);

    console.log(`✅ Tanggal merah ditambahkan: ${tanggal} - ${keterangan}`);
    return res.json({ success: true, message: "Tanggal libur berhasil ditambahkan", data: newHoliday[0] });
  } catch (error) {
    console.error("Add holiday error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * DELETE /api/admin/holidays/:id
 */
export const deleteHoliday = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const [result] = await conn.query("DELETE FROM holidays WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Tanggal libur tidak ditemukan" });
    }

    console.log(`✅ Tanggal merah dihapus: id ${id}`);
    return res.json({ success: true, message: "Tanggal libur berhasil dihapus" });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * DELETE /api/admin/attendance/:id
 */
export const deleteAttendance = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    console.log(`🗑️ Delete attendance id: ${id}`);
    
    const [result] = await conn.query("DELETE FROM attendances WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Data absensi tidak ditemukan" });
    }

    return res.json({ success: true, message: "Data absensi berhasil dihapus" });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

export default router;
