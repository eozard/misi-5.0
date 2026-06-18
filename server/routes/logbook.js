/*
 * ============================================================================
 * ROUTES: LOGBOOK (MySQL Version)
 * ============================================================================
 * Endpoint untuk logbook mahasiswa PKL.
 *
 * MAHASISWA ENDPOINTS (perlu token user biasa):
 * - GET    /api/logbook              List logbook milik sendiri
 * - GET    /api/logbook/today        Ambil/cek logbook hari ini (kalau ada)
 * - GET    /api/logbook/:id          Detail 1 logbook (milik sendiri)
 * - POST   /api/logbook              Create draft baru (1 per hari)
 * - PUT    /api/logbook/:id          Update draft (hanya kalau status draft)
 * - POST   /api/logbook/:id/submit   Submit logbook (status -> submitted, lock)
 * - DELETE /api/logbook/:id          Hapus draft sendiri
 *
 * ADMIN ENDPOINTS (perlu token admin):
 * - GET    /api/admin/logbook        List semua logbook, filter by nama/tanggal/status
 * - GET    /api/admin/logbook/:id    Detail 1 logbook (termasuk yang submitted)
 * - POST   /api/admin/logbook/:id/reset  Reset submitted -> draft (re-open edit)
 * - DELETE /api/admin/logbook/:id    Hapus logbook
 *
 * ATURAN BISNIS:
 * - 1 logbook per mahasiswa per hari (UNIQUE constraint)
 * - Hanya draft yang bisa diedit/dihapus oleh mahasiswa
 * - Setelah submit, logbook locked (admin yang bisa reset)
 * ============================================================================
 */

import express from "express";
import { pool } from "../config/db.js";
import { verifyToken, isMahasiswa, isAdmin } from "../middleware/auth.js";

const router = express.Router();

const todayDate = () => {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
};

const formatLogbook = (row) => ({
  id: row.id,
  user_id: row.user_id,
  nama: row.nama,
  kelompok: row.kelompok,
  tanggal: row.tanggal,
  kegiatan: row.kegiatan,
  kendala: row.kendala,
  status: row.status,
  submitted_at: row.submitted_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/*
 * GET /api/logbook - List logbook milik user yang login
 */
router.get("/logbook", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { from, to, status } = req.query;
    const where = ["nama = ?"];
    const params = [req.user.nama];

    if (from) {
      where.push("tanggal >= ?");
      params.push(from);
    }
    if (to) {
      where.push("tanggal <= ?");
      params.push(to);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }

    const [rows] = await conn.query(
      `SELECT * FROM logbook WHERE ${where.join(" AND ")}
       ORDER BY tanggal DESC`,
      params,
    );
    return res.json({
      success: true,
      data: rows.map(formatLogbook),
    });
  } catch (err) {
    console.error("Fetch logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * GET /api/logbook/today
 */
router.get("/logbook/today", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const today = todayDate();
    const [rows] = await conn.query(
      "SELECT * FROM logbook WHERE nama = ? AND tanggal = ? LIMIT 1",
      [req.user.nama, today],
    );
    const data = rows[0] ? formatLogbook(rows[0]) : null;
    return res.json({ success: true, data, tanggal: today });
  } catch (err) {
    console.error("Fetch today logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * GET /api/logbook/:id
 */
router.get("/logbook/:id", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }

    const [rows] = await conn.query(
      "SELECT * FROM logbook WHERE id = ? LIMIT 1",
      [id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    const data = rows[0];
    if (data.nama !== req.user.nama) {
      return res
        .status(403)
        .json({ success: false, message: "Anda tidak punya akses ke logbook ini" });
    }
    return res.json({ success: true, data: formatLogbook(data) });
  } catch (err) {
    console.error("Fetch logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * POST /api/logbook
 */
router.post("/logbook", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { kegiatan, kendala } = req.body;
    if (!kegiatan || !kegiatan.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Kegiatan wajib diisi" });
    }

    const tanggalFinal = todayDate();

    const [existingRows] = await conn.query(
      "SELECT id, status FROM logbook WHERE nama = ? AND tanggal = ? LIMIT 1",
      [req.user.nama, tanggalFinal],
    );
    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Sudah ada logbook untuk hari ini (status: ${existingRows[0].status})`,
        data: formatLogbook(existingRows[0]),
      });
    }

    const [insertRes] = await conn.query(
      `INSERT INTO logbook
        (user_id, nama, kelompok, tanggal, kegiatan, kendala, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      [
        req.user.id,
        req.user.nama,
        req.user.kelompok,
        tanggalFinal,
        kegiatan.trim(),
        kendala ? kendala.trim() : null,
      ],
    );
    const [rows] = await conn.query(
      "SELECT * FROM logbook WHERE id = ?",
      [insertRes.insertId],
    );
    return res.status(201).json({
      success: true,
      message: "Logbook berhasil dibuat",
      data: formatLogbook(rows[0]),
    });
  } catch (err) {
    console.error("Create logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * PUT /api/logbook/:id
 */
router.put("/logbook/:id", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }

    const { kegiatan, kendala } = req.body;
    if (!kegiatan || !kegiatan.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Kegiatan wajib diisi" });
    }

    const [existingRows] = await conn.query(
      "SELECT * FROM logbook WHERE id = ? LIMIT 1",
      [id],
    );
    if (existingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    const existing = existingRows[0];

    if (existing.nama !== req.user.nama) {
      return res
        .status(403)
        .json({ success: false, message: "Anda tidak punya akses ke logbook ini" });
    }
    if (existing.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Logbook yang sudah di-submit tidak bisa diedit",
      });
    }

    await conn.query(
      "UPDATE logbook SET kegiatan = ?, kendala = ? WHERE id = ?",
      [kegiatan.trim(), kendala ? kendala.trim() : null, id],
    );
    const [rows] = await conn.query("SELECT * FROM logbook WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: "Logbook berhasil diupdate",
      data: formatLogbook(rows[0]),
    });
  } catch (err) {
    console.error("Update logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * POST /api/logbook/:id/submit
 */
router.post("/logbook/:id/submit", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }

    const [existingRows] = await conn.query(
      "SELECT * FROM logbook WHERE id = ? LIMIT 1",
      [id],
    );
    if (existingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    const existing = existingRows[0];

    if (existing.nama !== req.user.nama) {
      return res
        .status(403)
        .json({ success: false, message: "Anda tidak punya akses ke logbook ini" });
    }
    if (existing.status === "submitted") {
      return res
        .status(400)
        .json({ success: false, message: "Logbook sudah submitted" });
    }

    await conn.query(
      "UPDATE logbook SET status = 'submitted', submitted_at = NOW() WHERE id = ?",
      [id],
    );
    const [rows] = await conn.query("SELECT * FROM logbook WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: "Logbook berhasil di-submit",
      data: formatLogbook(rows[0]),
    });
  } catch (err) {
    console.error("Submit logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * DELETE /api/logbook/:id
 */
router.delete("/logbook/:id", verifyToken, isMahasiswa, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }

    const [existingRows] = await conn.query(
      "SELECT * FROM logbook WHERE id = ? LIMIT 1",
      [id],
    );
    if (existingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    const existing = existingRows[0];

    if (existing.nama !== req.user.nama) {
      return res
        .status(403)
        .json({ success: false, message: "Anda tidak punya akses ke logbook ini" });
    }
    if (existing.status !== "draft") {
      return res
        .status(400)
        .json({ success: false, message: "Hanya draft yang bisa dihapus" });
    }

    await conn.query("DELETE FROM logbook WHERE id = ?", [id]);
    return res.json({ success: true, message: "Logbook berhasil dihapus" });
  } catch (err) {
    console.error("Delete logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/* ============================================================================
 * ADMIN ENDPOINTS
 * ========================================================================== */

/*
 * GET /api/admin/logbook
 */
router.get("/admin/logbook", verifyToken, isAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama, from, to, status, kelompok } = req.query;
    const where = [];
    const params = [];

    if (nama) {
      where.push("nama = ?");
      params.push(nama);
    }
    if (from) {
      where.push("tanggal >= ?");
      params.push(from);
    }
    if (to) {
      where.push("tanggal <= ?");
      params.push(to);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (kelompok) {
      where.push("kelompok = ?");
      params.push(kelompok);
    }

    const sql = `SELECT * FROM logbook
                 ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY tanggal DESC, created_at DESC`;
    const [rows] = await conn.query(sql, params);
    return res.json({
      success: true,
      data: rows.map(formatLogbook),
      total: rows.length,
    });
  } catch (err) {
    console.error("Admin fetch logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * GET /api/admin/logbook/:id
 */
router.get("/admin/logbook/:id", verifyToken, isAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }
    const [rows] = await conn.query(
      "SELECT * FROM logbook WHERE id = ? LIMIT 1",
      [id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    return res.json({ success: true, data: formatLogbook(rows[0]) });
  } catch (err) {
    console.error("Admin fetch logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * POST /api/admin/logbook/:id/reset
 */
router.post("/admin/logbook/:id/reset", verifyToken, isAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }
    await conn.query(
      "UPDATE logbook SET status = 'draft', submitted_at = NULL WHERE id = ?",
      [id],
    );
    const [rows] = await conn.query("SELECT * FROM logbook WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    return res.json({
      success: true,
      message: "Logbook di-reset ke draft",
      data: formatLogbook(rows[0]),
    });
  } catch (err) {
    console.error("Reset logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * DELETE /api/admin/logbook/:id
 */
router.delete("/admin/logbook/:id", verifyToken, isAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }
    const [res1] = await conn.query("DELETE FROM logbook WHERE id = ?", [id]);
    if (res1.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Logbook tidak ditemukan" });
    }
    return res.json({ success: true, message: "Logbook berhasil dihapus" });
  } catch (err) {
    console.error("Admin delete logbook error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
