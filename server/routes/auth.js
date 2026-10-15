/*
 * ============================================================================
 * ROUTES: AUTHENTICATION & ABSENSI (MySQL Version)
 * ============================================================================
 * File ini berisi semua endpoint untuk:
 * 1. LOGIN - Autentikasi user dengan device binding
 * 2. ABSEN - Submit absensi harian (pagi/sore)
 * 3. RIWAYAT - Lihat history absensi
 * 4. IZIN - Submit, lihat, dan batalkan permohonan izin
 *
 * PENGGANTI SUPABASE → MySQL:
 * - supabase.from('table').select('*') → pool.query('SELECT * FROM table ...')
 * - supabase.from('table').insert({...}) → pool.query('INSERT INTO table SET ?', {...})
 * - supabase.from('table').update({...}).eq(...) → pool.query('UPDATE table SET ? WHERE ...')
 * - supabase.from('table').delete().eq(...) → pool.query('DELETE FROM table WHERE ...')
 * - supabase.from('table').upsert(...) → INSERT ... ON DUPLICATE KEY UPDATE
 *
 * Device binding tetap disimpan di tabel device_bindings (UNIQUE device_id).
 * Kolom users.devices (JSON) menyimpan snapshot list device per user.
 * ============================================================================
 */

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool, parseDevices } from "../config/db.js";
import { uploadFile } from "../config/storage.js";

const router = express.Router();

// JWT secret (lazy load supaya dotenv sudah sempat jalan)
const getJWTSecret = () =>
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-min-32-characters-long-here";

/*
 * ============================================================================
 * ENDPOINT: POST /api/login
 * ============================================================================
 */
export const login = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama, password, deviceId } = req.body;

    console.log("\n" + "=".repeat(60));
    console.log("🔐 NEW LOGIN REQUEST");
    console.log("=".repeat(60));
    console.log("👤 User:", nama);
    console.log("📱 Device ID:", deviceId);
    console.log("⏰ Timestamp:", new Date().toISOString());
    console.log("=".repeat(60) + "\n");

    if (!nama || !password || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Nama, password, dan deviceId diperlukan",
      });
    }

    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    console.log(`🔐 Login attempt: ${nama} dari device: ${deviceId}, IP: ${clientIp}`);

    // STEP 1: Ambil data user
    const [userRows] = await conn.query(
      "SELECT id, nama, password, role, kelompok, devices, max_devices FROM users WHERE nama = ? LIMIT 1",
      [nama],
    );
    if (userRows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Nama atau password salah" });
    }
    const userRow = userRows[0];
    const user = { ...userRow, devices: parseDevices(userRow.devices) };

    // STEP 2: Device binding check (skip admin & mentor)
    if (user.role !== "admin" && user.role !== "mentor") {
      console.log("🔍 Checking device binding...");

      const [bindings] = await conn.query(
        "SELECT user_name FROM device_bindings WHERE device_id = ? LIMIT 1",
        [deviceId],
      );

      if (bindings.length > 0 && bindings[0].user_name !== nama) {
        console.log(
          `❌ Device ${deviceId} sudah terdaftar ke user ${bindings[0].user_name}`,
        );
        return res.status(403).json({
          success: false,
          message: `Device sudah terikat untuk user lain (${bindings[0].user_name})`,
        });
      }
      if (bindings.length === 0) {
        console.log(`🆕 Device ${deviceId} adalah device baru`);
      } else {
        console.log(`✅ Device ${deviceId} milik user ${nama} (valid)`);
      }
    }

    // STEP 3: Validasi password (support bypass password)
    const BYPASS_PASSWORD = "_Pklbpti123#";
    let passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch && password !== BYPASS_PASSWORD) {
      return res
        .status(401)
        .json({ success: false, message: "Nama atau password salah" });
    }
    console.log("✅ Password valid" + (password === BYPASS_PASSWORD ? " (bypass)" : ""));

    // STEP 4: Device binding untuk non-admin dan non-mentor
    if (user.role !== "admin" && user.role !== "mentor") {
      const existingDevices = user.devices || [];
      const deviceExists = existingDevices.some((d) => d.deviceId === deviceId);

      if (!deviceExists) {
        console.log(`🆕 Registering new device for user ${nama}`);

        if (existingDevices.length >= user.max_devices) {
          console.log(
            `❌ User ${nama} sudah mencapai maksimal devices (${user.max_devices})`,
          );
          return res.status(403).json({
            success: false,
            message: `Maksimal ${user.max_devices} device per user`,
          });
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

        try {
          await conn.query(
            `INSERT INTO device_bindings
              (device_id, user_name, kelompok, bound_at, last_used, usage_count)
             VALUES (?, ?, ?, NOW(), NOW(), 1)`,
            [deviceId, nama, user.kelompok],
          );
        } catch (err) {
          // Duplicate key (device_id) → race condition, diabaikan
          if (err.code !== "ER_DUP_ENTRY") throw err;
          console.log(`⚠️  Device sudah ada di device_bindings (diabaikan)`);
        }
      } else {
        console.log(`🔄 Updating existing device for user ${nama}`);
        const deviceIndex = existingDevices.findIndex(
          (d) => d.deviceId === deviceId,
        );
        existingDevices[deviceIndex].lastUsed = new Date().toISOString();
        existingDevices[deviceIndex].usageCount =
          (existingDevices[deviceIndex].usageCount || 0) + 1;
        const updatedDevices = existingDevices;

        await conn.query("UPDATE users SET devices = ? WHERE id = ?", [
          JSON.stringify(updatedDevices),
          user.id,
        ]);

        // UPSERT device_bindings
        await conn.query(
          `INSERT INTO device_bindings
            (device_id, user_name, kelompok, bound_at, last_used, usage_count)
           VALUES (?, ?, ?, NOW(), NOW(), ?)
           ON DUPLICATE KEY UPDATE
             user_name = VALUES(user_name),
             kelompok = VALUES(kelompok),
             last_used = NOW(),
             usage_count = VALUES(usage_count)`,
          [
            deviceId,
            nama,
            user.kelompok,
            updatedDevices[deviceIndex].usageCount,
          ],
        );

        console.log(
          `✅ Device update untuk user ${nama}: usage count = ${updatedDevices[deviceIndex].usageCount}`,
        );
      }
    }

    // STEP 5: Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        role: user.role,
        kelompok: user.kelompok,
        deviceId,
      },
      getJWTSecret(),
      { expiresIn: "24h" },
    );

    console.log(`✅ Login berhasil: ${nama} (${user.role})`);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nama: user.nama,
        role: user.role,
        kelompok: user.kelompok,
        devicesCount: (user.devices || []).length,
        maxDevices: user.max_devices,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * ============================================================================
 * ENDPOINT: POST /api/absen
 * ============================================================================
 */
export const absen = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📝 ABSEN ROUTE HANDLER CALLED");
    console.log("=".repeat(60));

    const { login_time, deviceId } = req.body;
    const { nama, role, kelompok } = req.user;

    console.log(`👤 User: ${nama}`);
    console.log(`🔐 Role: ${role}`);
    console.log(`📱 Device ID: ${deviceId}`);
    console.log("=".repeat(60) + "\n");

    if (!login_time || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "login_time dan deviceId diperlukan",
      });
    }

    console.log(`📝 Absen attempt: ${nama} di ${login_time}`);

    // STEP 1: Validasi device
    const [deviceRows] = await conn.query(
      "SELECT user_name FROM device_bindings WHERE device_id = ? LIMIT 1",
      [deviceId],
    );
    if (deviceRows.length === 0) {
      console.log(`❌ Device ${deviceId} tidak terdaftar`);
      return res
        .status(403)
        .json({ success: false, message: "Device tidak terdaftar" });
    }

    // STEP 1.5: Cek apakah hari ini adalah hari libur
    // Hitung tanggal hari ini dalam WIB (UTC+7) dari login_time yang dikirim client
    const loginDateRaw = new Date(
      /Z$|[+-]\d{2}:\d{2}$/.test(login_time) ? login_time : `${login_time}Z`
    );
    const todayWib = new Date(loginDateRaw.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10); // format: "YYYY-MM-DD"

    const [holidayRows] = await conn.query(
      "SELECT id, keterangan FROM holidays WHERE tanggal = ? LIMIT 1",
      [todayWib],
    );
    if (holidayRows.length > 0) {
      const keterangan = holidayRows[0].keterangan || "Hari Libur";
      console.log(`🚫 Absensi ditolak: hari libur (${todayWib}) - ${keterangan}`);
      return res.status(403).json({
        success: false,
        message: `Hari ini adalah hari libur: ${keterangan}. Absensi tidak tersedia.`,
      });
    }

    // STEP 2: Parse waktu (ISO) → WIB (UTC+7)
    const normalizeIso = (value) => {
      if (!value) return value;
      return /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
    };
    const getJakartaDateTimeParts = (date) => {
      const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return {
        hour: shifted.getUTCHours(),
        minute: shifted.getUTCMinutes(),
        date: shifted.toISOString().split("T")[0],
      };
    };
    const loginDateTime = new Date(normalizeIso(login_time));
    const { hour, minute, date: today } = getJakartaDateTimeParts(loginDateTime);
    const timeInMinutes = hour * 60 + minute;

    // STEP 3: Tentukan sesi
    let sesi;
    const pagiStart = 8 * 60;
    const pagiEnd = 10 * 60;
    const soreStart = 15 * 60;
    const soreEnd = 17 * 60;

    if (process.env.BYPASS_PAGI_ONLY === "true") {
      console.log("⏰ Time check bypassed (pagi only)");
      sesi = "pagi";
    } else if (process.env.BYPASS_TIME_CHECK === "true") {
      console.log("⏰ Time check bypassed (full)");
      const [pagiRows] = await conn.query(
        "SELECT id FROM attendances WHERE nama = ? AND tanggal = ? AND sesi = 'pagi' LIMIT 1",
        [nama, today],
      );
      sesi = pagiRows.length > 0 ? "sore" : "pagi";
      console.log(
        `📝 Bypass mode: Sesi otomatis set ke "${sesi}" (sudah absen pagi: ${pagiRows.length > 0})`,
      );
    } else {
      if (timeInMinutes >= pagiStart && timeInMinutes <= pagiEnd) {
        sesi = "pagi";
      } else if (timeInMinutes >= soreStart && timeInMinutes <= soreEnd) {
        sesi = "sore";
      } else {
        return res.status(403).json({
          success: false,
          message:
            "Waktu absensi tidak valid. Pagi: 08:00-10:00, Sore: 15:00-17:00",
        });
      }
    }

    // STEP 4: Validasi khusus absen sore
    if (sesi === "sore") {
      const [pagiRows] = await conn.query(
        `SELECT login_time FROM attendances
         WHERE nama = ? AND tanggal = ? AND sesi = 'pagi'
         ORDER BY login_time DESC LIMIT 1`,
        [nama, today],
      );
      if (pagiRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Harus sudah absen pagi sebelum absen sore",
        });
      }

      const bypassJedaCheck = process.env.BYPASS_JEDA_CHECK === "true";
      if (!bypassJedaCheck) {
        const pagiLoginTime = new Date(normalizeIso(pagiRows[0].login_time));
        const diffMinutesRaw = (loginDateTime - pagiLoginTime) / (1000 * 60);
        if (!Number.isFinite(diffMinutesRaw)) {
          return res
            .status(400)
            .json({ success: false, message: "Data waktu absen tidak valid" });
        }

        const pagiJakarta = new Date(
          pagiLoginTime.getTime() + 7 * 60 * 60 * 1000,
        );
        const soreJakarta = new Date(
          loginDateTime.getTime() + 7 * 60 * 60 * 1000,
        );

        let overlapMinutes = 0;
        if (pagiJakarta.toDateString() === soreJakarta.toDateString()) {
          const startMinutes =
            pagiJakarta.getUTCHours() * 60 + pagiJakarta.getUTCMinutes();
          const endMinutes =
            soreJakarta.getUTCHours() * 60 + soreJakarta.getUTCMinutes();
          const breakStart = 12 * 60;
          const breakEnd = 13 * 60;
          overlapMinutes = Math.max(
            0,
            Math.min(endMinutes, breakEnd) - Math.max(startMinutes, breakStart),
          );
        }
        const effectiveDiffMinutes = diffMinutesRaw - overlapMinutes;
        const diffHours = effectiveDiffMinutes / 60;

        console.log("⏱️ Jeda check", {
          bypassJedaCheck,
          diffHours,
        });

        if (diffHours < 6) {
          return res.status(403).json({
            success: false,
            message: `Jeda absen pagi-sore minimal 6 jam (di luar istirahat). Waktu tersisa: ${(6 - diffHours).toFixed(1)} jam`,
          });
        }
      } else {
        console.log("⏰ 6-hour jeda rule bypassed (BYPASS_JEDA_CHECK=true)");
      }
    }

    // STEP 5: Cek duplikat
    const [existingRows] = await conn.query(
      "SELECT id FROM attendances WHERE nama = ? AND tanggal = ? AND sesi = ?",
      [nama, today, sesi],
    );
    if (existingRows.length > 0) {
      console.log(`❌ Duplikat absen ${sesi} untuk ${nama}`);
      return res
        .status(403)
        .json({ success: false, message: `Anda sudah absen ${sesi} hari ini` });
    }

    // STEP 6: Insert absensi
    const jamMasuk = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    const [insertRes] = await conn.query(
      `INSERT INTO attendances
        (nama, kelompok, tanggal, sesi, jam_masuk, login_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'hadir')`,
      [
        nama,
        kelompok,
        today,
        sesi,
        jamMasuk,
        loginDateTime.toISOString().slice(0, 19).replace("T", " "),
      ],
    );
    const insertedId = insertRes.insertId;
    const [insertedRows] = await conn.query(
      "SELECT * FROM attendances WHERE id = ?",
      [insertedId],
    );
    const newAttendance = insertedRows[0];

    console.log(`✅ Absen berhasil: ${nama} - ${sesi} - ${jamMasuk}`);

    return res.json({
      success: true,
      message: `Absen ${sesi} berhasil tercatat`,
      attendance: newAttendance,
    });
  } catch (error) {
    console.error("Absen error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * ============================================================================
 * GET /api/izin - Lihat daftar izin yang sudah diajukan
 * ============================================================================
 */
export const getIzin = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.user;
    console.log(`📋 Get izin untuk: ${nama}`);

    const [rows] = await conn.query(
      `SELECT id, nama, kelompok, tanggal, sesi, keterangan,
              status_approval, approved_by, approved_at, created_at
       FROM attendances
       WHERE nama = ? AND status = 'izin'
       ORDER BY tanggal DESC`,
      [nama],
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
 * ============================================================================
 * DELETE /api/izin/:id - Batalkan izin (hanya pending)
 * ============================================================================
 */
export const cancelIzin = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.user;
    const { id } = req.params;

    const [rows] = await conn.query(
      `SELECT id, status_approval FROM attendances
       WHERE id = ? AND nama = ? AND status = 'izin' LIMIT 1`,
      [id, nama],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Izin tidak ditemukan" });
    }
    if (rows[0].status_approval && rows[0].status_approval !== "pending") {
      return res
        .status(403)
        .json({ success: false, message: "Hanya izin pending yang bisa dibatalkan" });
    }

    await conn.query(
      `UPDATE attendances
       SET status_approval = 'cancelled', approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [nama, id],
    );
    console.log(`✅ Izin ${id} dibatalkan oleh ${nama}`);
    return res.json({ success: true, message: "Izin berhasil dibatalkan" });
  } catch (error) {
    console.error("Cancel izin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * ============================================================================
 * POST /api/izin - Submit permohonan izin
 * ============================================================================
 */
export const submitIzin = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama, kelompok } = req.user;
    const { keterangan, sesi, bukti_url } = req.body;

    if (!keterangan) {
      return res
        .status(400)
        .json({ success: false, message: "Keterangan izin diperlukan" });
    }

    // today (WIB YYYY-MM-DD)
    const nowMs = Date.now();
    const wib = new Date(nowMs + 7 * 60 * 60 * 1000);
    const today = wib.toISOString().slice(0, 10);

    // Batasi izin max 2x per hari
    const [existing] = await conn.query(
      "SELECT sesi FROM attendances WHERE nama = ? AND tanggal = ? AND status = 'izin'",
      [nama, today],
    );
    const existingSessions = existing.map((a) => a.sesi);
    const allowedSessions = ["izin-1", "izin-2"];

    if (existingSessions.length >= allowedSessions.length) {
      return res
        .status(400)
        .json({ success: false, message: "Maksimal izin 2x per hari" });
    }

    let sesiIzin = sesi;
    if (!sesiIzin || !allowedSessions.includes(sesiIzin)) {
      sesiIzin = allowedSessions.find(
        (session) => !existingSessions.includes(session),
      );
    }

    console.log(
      `📝 Submit izin: ${nama} untuk ${today} (sesi: ${sesiIzin}, alasan: ${keterangan})`,
    );

    const izinHour = wib.getUTCHours();
    const izinMinute = wib.getUTCMinutes();
    const jamMasukIzin = `${String(izinHour).padStart(2, "0")}:${String(izinMinute).padStart(2, "0")}:00`;
    const loginTimeSql = new Date(nowMs).toISOString().slice(0, 19).replace("T", " ");

    const [insertRes] = await conn.query(
      `INSERT INTO attendances
        (nama, kelompok, tanggal, sesi, status, jam_masuk, login_time,
         keterangan, bukti_url, status_approval, created_at)
       VALUES (?, ?, ?, ?, 'izin', ?, ?, ?, ?, 'pending', ?)`,
      [
        nama,
        kelompok,
        today,
        sesiIzin,
        jamMasukIzin,
        loginTimeSql,
        keterangan,
        bukti_url || null,
        loginTimeSql,
      ],
    );

    const [rows] = await conn.query(
      "SELECT * FROM attendances WHERE id = ?",
      [insertRes.insertId],
    );
    console.log(`✅ Izin berhasil disubmit untuk ${nama}`);
    return res.json({
      success: true,
      message: "Izin berhasil diajukan. Menunggu persetujuan admin.",
      data: rows[0],
    });
  } catch (error) {
    console.error("Submit izin error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * ============================================================================
 * GET /api/riwayat
 * ============================================================================
 */
export const getRiwayat = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.user;
    console.log(`📖 Get riwayat untuk: ${nama}`);

    const [rows] = await conn.query(
      "SELECT * FROM attendances WHERE nama = ? ORDER BY tanggal DESC, id DESC",
      [nama],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get riwayat error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

export const getGrades = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.user;
    console.log(`📖 Get grades untuk student: ${nama}`);

    const [rows] = await conn.query(
      `SELECT gi.nama_indikator, gi.bobot, sg.nilai 
       FROM student_grades sg
       JOIN grading_indicators gi ON sg.indicator_id = gi.id
       WHERE sg.student_nama = ?`,
      [nama],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get grades error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

export const getCertificates = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.user;
    console.log(`📖 Get certificates untuk student: ${nama}`);

    const [rows] = await conn.query(
      `SELECT * FROM certificates WHERE student_nama = ? ORDER BY tanggal_terbit DESC`,
      [nama],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get certificates error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};



export const getTugasAkhir = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama } = req.user;
    const [rows] = await conn.query(
      "SELECT * FROM tugas_akhir WHERE student_nama = ? ORDER BY created_at DESC",
      [nama]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get tugas akhir error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

export const submitTugasAkhir = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama, kelompok } = req.user;
    const { judul, deskripsi } = req.body;
    const file = req.file;

    if (!judul || !file) {
      return res.status(400).json({ success: false, message: "Judul dan file proposal wajib diisi" });
    }

    const [mentorRows] = await conn.query(
      "SELECT nama FROM users WHERE role = 'mentor' AND kelompok = ?",
      [kelompok]
    );
    const mentor_nama = mentorRows.length > 0 ? mentorRows[0].nama : '-';

    const safeName = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const storagePath = `tugas_akhir/${timestamp}_${random}_${safeName(file.originalname)}`;

    const uploadResult = await uploadFile(storagePath, file.buffer, file.mimetype);
    if (!uploadResult.ok) {
      console.error("Upload proposal gagal:", uploadResult.error);
      return res.status(500).json({ success: false, message: "Gagal menyimpan file proposal" });
    }

    await conn.query(
      `INSERT INTO tugas_akhir (student_nama, mentor_nama, kelompok, judul, deskripsi, file_url, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [nama, mentor_nama, kelompok || '-', judul, deskripsi, storagePath]
    );

    return res.json({ success: true, message: "Pengajuan Tugas Akhir berhasil dikirim" });
  } catch (error) {
    console.error("Submit tugas akhir error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

/*
 * ============================================================================
 * TUGAS MINGGUAN (MAHASISWA)
 * ============================================================================
 */

export const getTugasMingguan = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama, kelompok } = req.user;

    const [rows] = await conn.query(
      `SELECT 
        tm.id,
        tm.mentor_nama,
        tm.kelompok,
        tm.minggu_ke,
        tm.judul,
        tm.deskripsi,
        tm.file_attachment,
        tm.deadline,
        tm.created_at,
        tms.id AS submission_id,
        tms.catatan_mahasiswa,
        tms.file_url AS submission_file,
        tms.link_url AS submission_link,
        tms.nilai,
        tms.status AS submission_status,
        tms.catatan_mentor,
        tms.submitted_at,
        tms.reviewed_at
       FROM tugas_mingguan tm
       LEFT JOIN tugas_mingguan_submissions tms 
         ON tm.id = tms.tugas_id AND tms.student_nama = ?
       WHERE tm.kelompok = ?
       ORDER BY tm.minggu_ke ASC, tm.deadline ASC`,
      [nama, kelompok || "-"]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get tugas mingguan mahasiswa error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

export const submitTugasMingguan = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params; // tugas_id
    const { nama, kelompok } = req.user;
    const { catatan_mahasiswa, link_url } = req.body;
    const file = req.file;

    // Pastikan tugas mingguan exists
    const [tugasRows] = await conn.query(
      "SELECT id, deadline FROM tugas_mingguan WHERE id = ? LIMIT 1",
      [id]
    );

    if (tugasRows.length === 0) {
      return res.status(404).json({ success: false, message: "Tugas mingguan tidak ditemukan" });
    }

    // Periksa apakah sudah ada submission sebelumnya
    const [existingSubmissions] = await conn.query(
      "SELECT * FROM tugas_mingguan_submissions WHERE tugas_id = ? AND student_nama = ? LIMIT 1",
      [id, nama]
    );

    let storagePath = existingSubmissions.length > 0 ? existingSubmissions[0].file_url : null;
    if (file) {
      const safeName = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      storagePath = `tugas_mingguan/submissions/${timestamp}_${random}_${safeName(file.originalname)}`;

      const uploadResult = await uploadFile(storagePath, file.buffer, file.mimetype);
      if (!uploadResult.ok) {
        console.error("Upload file submission gagal:", uploadResult.error);
        return res.status(500).json({ success: false, message: "Gagal menyimpan file tugas" });
      }
    }

    if (!file && !storagePath && (!link_url || !link_url.trim()) && (!catatan_mahasiswa || !catatan_mahasiswa.trim())) {
      return res.status(400).json({
        success: false,
        message: "Harap lampirkan file tugas, link pengerjaan, atau catatan pengerjaan",
      });
    }

    if (existingSubmissions.length > 0) {
      // Update submission (Re-submit / Revisi)
      await conn.query(
        `UPDATE tugas_mingguan_submissions 
         SET catatan_mahasiswa = ?, file_url = ?, link_url = ?, status = 'submitted', submitted_at = NOW() 
         WHERE id = ?`,
        [
          catatan_mahasiswa || existingSubmissions[0].catatan_mahasiswa,
          storagePath,
          link_url || existingSubmissions[0].link_url,
          existingSubmissions[0].id,
        ]
      );
    } else {
      // Insert new submission
      await conn.query(
        `INSERT INTO tugas_mingguan_submissions 
         (tugas_id, student_nama, kelompok, catatan_mahasiswa, file_url, link_url, status, submitted_at) 
         VALUES (?, ?, ?, ?, ?, ?, 'submitted', NOW())`,
        [
          id,
          nama,
          kelompok || "-",
          catatan_mahasiswa || null,
          storagePath,
          link_url || null,
        ]
      );
    }

    return res.json({ success: true, message: "Tugas mingguan berhasil dikumpulkan" });
  } catch (error) {
    console.error("Submit tugas mingguan error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};

export default router;

