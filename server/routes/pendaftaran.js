/*
 * ============================================================================
 * ROUTES: PENDAFTARAN (PUBLIK + ADMIN) - MySQL Version
 * ============================================================================
 * File PDF pendaftar disimpan di disk lokal (folder server/uploads/pendaftaran/),
 * bukan di Supabase Storage.
 *
 * ENDPOINT:
 * - POST   /api/pendaftaran                  Submit pendaftar + 3 file PDF
 * - GET    /api/pendaftaran                  List pendaftar (admin)
 * - PUT    /api/pendaftaran/:id              Update assigned_divisi (admin)
 * - DELETE /api/pendaftaran/:id              Hapus pendaftar + file (admin)
 * - GET    /api/pendaftaran/file/:id/:type   Stream file PDF (untuk inline preview)
 * - GET    /api/pendaftaran/file-url/:id/:type Direct public URL
 * ============================================================================
 */

import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { pool } from "../config/db.js";
import {
  uploadFile,
  deleteFile,
  getPublicUrl,
  BUCKET_NAME,
  getAbsolutePath,
} from "../config/storage.js";

const router = express.Router();

const DIVISI_OPTIONS = [
  "Networking",
  "Software Engineer",
  "Multimedia",
  "Artificial Intelligence",
  "Data Analyst",
];

const JWT_SECRET = () =>
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_ADMIN_PENDAFTARAN ||
  "your-super-secret-jwt-key-min-32-characters-long-here";

const verifyAdminPendaftaran = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Token tidak ditemukan" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    if (decoded.type !== "admin_pendaftaran") {
      return res
        .status(403)
        .json({ success: false, message: "Token bukan admin pendaftaran" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Token tidak valid" });
  }
};

// Pakai memory storage supaya bisa dapat buffer untuk tulis ke disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("File harus berformat PDF"), false);
    }
  },
});

/**
 * Bangun object pendaftar dengan URL untuk file.
 */
const buildPendaftarResponse = (p, files = []) => {
  const findFile = (tipe) => files.find((f) => f.tipe === tipe);
  const cv = findFile("cv");
  const transkrip = findFile("transkrip");
  const surat = findFile("surat");
  return {
    id: p.id,
    nama: p.nama,
    nim: p.nim,
    email: p.email,
    divisi: p.divisi_pilihan,
    assigned_divisi: p.divisi_assigned || null,
    assigned_by: p.assigned_by || null,
    assigned_at: p.assigned_at || null,
    urutan: p.urutan,
    status: p.status,
    created_at: p.created_at,
    cv_url: cv ? getPublicUrl(cv.storage_path) : null,
    transkrip_url: transkrip ? getPublicUrl(transkrip.storage_path) : null,
    surat_persetujuan_url: surat ? getPublicUrl(surat.storage_path) : null,
  };
};

/*
 * ENDPOINT: POST /api/pendaftaran
 * Public: form submit pendaftaran
 */
router.post(
  "/pendaftaran",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "transkrip", maxCount: 1 },
    { name: "surat_persetujuan", maxCount: 1 },
  ]),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      const { nama, nim, divisi, email } = req.body;
      const files = req.files || {};

      if (!nama || !nim || !divisi || !email) {
        return res.status(400).json({
          success: false,
          message: "Nama, NIM, divisi, dan email wajib diisi",
        });
      }
      if (!DIVISI_OPTIONS.includes(divisi)) {
        return res.status(400).json({
          success: false,
          message: `Divisi tidak valid. Pilihan: ${DIVISI_OPTIONS.join(", ")}`,
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Format email tidak valid" });
      }
      if (!files.cv || !files.transkrip || !files.surat_persetujuan) {
        return res.status(400).json({
          success: false,
          message: "File CV, transkrip, dan surat persetujuan wajib diupload",
        });
      }

      // Cek duplikat NIM/email
      const [dupRows] = await conn.query(
        "SELECT id, nim, email FROM pendaftar WHERE nim = ? OR email = ? LIMIT 1",
        [nim, email],
      );
      if (dupRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "NIM atau email sudah pernah digunakan untuk pendaftaran",
        });
      }

      // Hitung urutan (auto increment sederhana: COUNT + 1)
      const [countRows] = await conn.query(
        "SELECT COUNT(*) AS total FROM pendaftar",
      );
      const urutan = (countRows[0]?.total || 0) + 1;
      const status = urutan <= 30 ? "priority" : "pending";

      const [insertRes] = await conn.query(
        `INSERT INTO pendaftar
          (nama, nim, email, divisi_pilihan, urutan, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nama, nim, email, divisi, urutan, status],
      );
      const pendaftarId = insertRes.insertId;

      // Upload 3 file ke disk
      const safeName = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");
      const tasks = [
        { tipe: "cv", field: "cv" },
        { tipe: "transkrip", field: "transkrip" },
        { tipe: "surat", field: "surat_persetujuan" },
      ];
      const fileRows = [];

      for (const task of tasks) {
        const fileObj = files[task.field][0];
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const storagePath = `pendaftaran/${pendaftarId}/${task.tipe}_${timestamp}_${random}_${safeName(fileObj.originalname)}`;

        const result = await uploadFile(storagePath, fileObj.buffer, fileObj.mimetype);
        if (!result.ok) {
          console.error(`Upload ${task.tipe} gagal:`, result.error);
        }
        fileRows.push({
          pendaftar_id: pendaftarId,
          tipe: task.tipe,
          filename: storagePath,
          original_name: fileObj.originalname,
          file_size: fileObj.size,
          mime_type: fileObj.mimetype,
          storage_path: storagePath,
        });
      }

      await conn.query(
        `INSERT INTO pendaftar_files
          (pendaftar_id, tipe, filename, original_name, file_size, mime_type, storage_path)
         VALUES ?`,
        [
          fileRows.map((r) => [
            r.pendaftar_id,
            r.tipe,
            r.filename,
            r.original_name,
            r.file_size,
            r.mime_type,
            r.storage_path,
          ]),
        ],
      );

      // Ambil data pendaftar final
      const [finalRows] = await conn.query(
        "SELECT * FROM pendaftar WHERE id = ?",
        [pendaftarId],
      );

      return res.status(201).json({
        success: true,
        message: "Pendaftaran berhasil dikirim",
        data: buildPendaftarResponse(finalRows[0], fileRows),
      });
    } catch (err) {
      console.error("Pendaftaran error:", err);
      return res
        .status(500)
        .json({ success: false, message: err.message || "Terjadi kesalahan server" });
    } finally {
      conn.release();
    }
  },
);

/*
 * ENDPOINT: GET /api/pendaftaran
 * Admin: list semua pendaftar
 */
router.get("/pendaftaran", verifyAdminPendaftaran, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [pendaftarRows] = await conn.query(
      "SELECT * FROM pendaftar ORDER BY urutan ASC",
    );
    if (pendaftarRows.length === 0) {
      return res.json({ success: true, data: [], total: 0 });
    }

    const ids = pendaftarRows.map((p) => p.id);
    // Buat placeholder ?,?,?...
    const placeholders = ids.map(() => "?").join(",");
    const [files] = await conn.query(
      `SELECT * FROM pendaftar_files WHERE pendaftar_id IN (${placeholders})`,
      ids,
    );

    const filesByPendaftar = (files || []).reduce((acc, f) => {
      if (!acc[f.pendaftar_id]) acc[f.pendaftar_id] = [];
      acc[f.pendaftar_id].push(f);
      return acc;
    }, {});

    const data = pendaftarRows.map((p) =>
      buildPendaftarResponse(p, filesByPendaftar[p.id] || []),
    );

    return res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error("Fetch pendaftar error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * ENDPOINT: PUT /api/pendaftaran/:id
 * Admin: update assigned_divisi
 */
router.put("/pendaftaran/:id", verifyAdminPendaftaran, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const pendaftarId = parseInt(req.params.id, 10);
    if (isNaN(pendaftarId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }
    const { assigned_divisi, admin_nama } = req.body;
    if (!assigned_divisi) {
      return res
        .status(400)
        .json({ success: false, message: "assigned_divisi wajib diisi" });
    }
    if (!DIVISI_OPTIONS.includes(assigned_divisi)) {
      return res.status(400).json({
        success: false,
        message: `Divisi tidak valid. Pilihan: ${DIVISI_OPTIONS.join(", ")}`,
      });
    }

    const [existingRows] = await conn.query(
      "SELECT * FROM pendaftar WHERE id = ? LIMIT 1",
      [pendaftarId],
    );
    if (existingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pendaftar tidak ditemukan" });
    }
    const existing = existingRows[0];

    const MAX_PER_DIVISI = 6;
    if (existing.divisi_assigned !== assigned_divisi) {
      const [countRows] = await conn.query(
        "SELECT COUNT(*) AS total FROM pendaftar WHERE divisi_assigned = ? AND id <> ?",
        [assigned_divisi, pendaftarId],
      );
      if ((countRows[0]?.total || 0) >= MAX_PER_DIVISI) {
        return res.status(400).json({
          success: false,
          message: `Divisi ${assigned_divisi} sudah penuh (maksimal ${MAX_PER_DIVISI} peserta)`,
        });
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.query(
      `UPDATE pendaftar
       SET divisi_assigned = ?, status = 'assigned', assigned_at = ?, assigned_by = ?
       WHERE id = ?`,
      [assigned_divisi, now, admin_nama || req.admin.username, pendaftarId],
    );

    const [updatedRows] = await conn.query(
      "SELECT * FROM pendaftar WHERE id = ?",
      [pendaftarId],
    );
    return res.json({ success: true, data: updatedRows[0] });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * ENDPOINT: DELETE /api/pendaftaran/:id
 * Admin: hapus pendaftar + file
 */
router.delete("/pendaftaran/:id", verifyAdminPendaftaran, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const pendaftarId = parseInt(req.params.id, 10);
    if (isNaN(pendaftarId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }

    const [files] = await conn.query(
      "SELECT storage_path FROM pendaftar_files WHERE pendaftar_id = ?",
      [pendaftarId],
    );

    // Hapus file di disk (best effort)
    for (const f of files) {
      if (f.storage_path) {
        await deleteFile(f.storage_path);
      }
    }

    // Hapus pendaftar (ON DELETE CASCADE hapus pendaftar_files)
    await conn.query("DELETE FROM pendaftar WHERE id = ?", [pendaftarId]);

    return res.json({ success: true, message: "Pendaftar berhasil dihapus" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * ENDPOINT: GET /api/pendaftaran/file/:id/:type
 * Stream file PDF (untuk inline preview)
 * type: 'cv' | 'transkrip' | 'surat_persetujuan'
 */
router.get("/pendaftaran/file/:id/:type", async (req, res) => {
  try {
    const pendaftarId = parseInt(req.params.id, 10);
    const { type } = req.params;

    const tipeMap = {
      cv: "cv",
      transkrip: "transkrip",
      surat_persetujuan: "surat",
    };
    const dbTipe = tipeMap[type];
    if (!dbTipe) {
      return res
        .status(400)
        .json({ success: false, message: "Tipe file tidak valid" });
    }

    const conn = await pool.getConnection();
    let file;
    try {
      const [rows] = await conn.query(
        "SELECT * FROM pendaftar_files WHERE pendaftar_id = ? AND tipe = ? LIMIT 1",
        [pendaftarId, dbTipe],
      );
      file = rows[0];
    } finally {
      conn.release();
    }

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File metadata tidak ditemukan di database" });
    }
    if (!file.storage_path) {
      return res.status(404).json({
        success: false,
        message: "File belum ada di storage (data lama)",
      });
    }

    const absPath = getAbsolutePath(file.storage_path);
    if (!fs.existsSync(absPath)) {
      return res
        .status(404)
        .json({ success: false, message: "File tidak ada di disk" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${file.original_name}"`);
    res.setHeader("Cache-Control", "public, max-age=300");
    fs.createReadStream(absPath).pipe(res);
  } catch (err) {
    console.error("Serve file error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error: " + err.message });
  }
});

/*
 * ENDPOINT: GET /api/pendaftaran/file-url/:id/:type
 * Return direct public URL
 */
router.get("/pendaftaran/file-url/:id/:type", async (req, res) => {
  try {
    const pendaftarId = parseInt(req.params.id, 10);
    const { type } = req.params;

    const tipeMap = { cv: "cv", transkrip: "transkrip", surat_persetujuan: "surat" };
    const dbTipe = tipeMap[type];
    if (!dbTipe) {
      return res
        .status(400)
        .json({ success: false, message: "Tipe file tidak valid" });
    }

    const conn = await pool.getConnection();
    let file;
    try {
      const [rows] = await conn.query(
        "SELECT * FROM pendaftar_files WHERE pendaftar_id = ? AND tipe = ? LIMIT 1",
        [pendaftarId, dbTipe],
      );
      file = rows[0];
    } finally {
      conn.release();
    }

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File tidak ditemukan" });
    }

    const publicUrl = file.storage_path ? getPublicUrl(file.storage_path) : null;
    return res.json({
      success: true,
      data: {
        id: file.id,
        tipe: file.tipe,
        original_name: file.original_name,
        storage_path: file.storage_path,
        public_url: publicUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
