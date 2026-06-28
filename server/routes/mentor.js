import express from "express";
import { pool } from "../config/db.js";
import multer from "multer";
import { uploadFile } from "../config/storage.js";

const router = express.Router();

// Multer config for certificate PDF upload
const certUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("File harus berformat PDF"), false);
    }
  },
});

/*
 * ============================================================================
 * GET /api/mentor/students
 * Ambil daftar mahasiswa bimbingan mentor berdasarkan kelompok
 * ============================================================================
 */
router.get('/students', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';
    console.log(`📋 GET mentor/students - mentor: ${nama}, kelompok: ${kelompok}`);
    const [rows] = await conn.query(
      "SELECT id, nama, role, kelompok FROM users WHERE role = 'mahasiswa' AND kelompok = ?",
      [kelompok]
    );
    console.log(`✅ Found ${rows.length} students`);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('GET mentor/students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
});

/*
 * ============================================================================
 * INDICATORS (CRUD)
 * ============================================================================
 */
router.get("/indicators", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';
    let [rows] = await conn.query(
      "SELECT * FROM grading_indicators WHERE mentor_nama = ? AND kelompok = ? ORDER BY urutan ASC, id ASC",
      [nama, kelompok]
    );

    // Jika belum ada indikator, tambahkan default indikator otomatis
    if (rows.length === 0) {
      const defaultIndicators = [
        { nama_indikator: 'Kedisiplinan & Kehadiran', bobot: 20, urutan: 1 },
        { nama_indikator: 'Tanggung Jawab & Komitmen', bobot: 20, urutan: 2 },
        { nama_indikator: 'Pemahaman & Keterampilan Teknis', bobot: 30, urutan: 3 },
        { nama_indikator: 'Kualitas Pekerjaan', bobot: 20, urutan: 4 },
        { nama_indikator: 'Kerja Sama & Komunikasi', bobot: 10, urutan: 5 }
      ];

      for (const ind of defaultIndicators) {
        await conn.query(
          "INSERT INTO grading_indicators (mentor_nama, kelompok, nama_indikator, bobot, urutan) VALUES (?, ?, ?, ?, ?)",
          [nama, kelompok, ind.nama_indikator, ind.bobot, ind.urutan]
        );
      }

      // Ambil ulang data setelah ditambahkan
      const [newRows] = await conn.query(
        "SELECT * FROM grading_indicators WHERE mentor_nama = ? AND kelompok = ? ORDER BY urutan ASC, id ASC",
        [nama, kelompok]
      );
      rows = newRows;
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET mentor/indicators error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

router.post("/indicators", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';
    const { nama_indikator, bobot, urutan } = req.body;

    if (!nama_indikator || bobot === undefined) {
      return res.status(400).json({ success: false, message: "Nama indikator dan bobot diperlukan" });
    }

    const [result] = await conn.query(
      "INSERT INTO grading_indicators (mentor_nama, kelompok, nama_indikator, bobot, urutan) VALUES (?, ?, ?, ?, ?)",
      [nama, kelompok, nama_indikator, bobot, urutan || 0]
    );

    res.json({ success: true, message: "Indikator berhasil ditambahkan", id: result.insertId });
  } catch (error) {
    console.error("POST mentor/indicators error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

router.put("/indicators/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { nama_indikator, bobot, urutan } = req.body;

    await conn.query(
      "UPDATE grading_indicators SET nama_indikator = ?, bobot = ?, urutan = ? WHERE id = ?",
      [nama_indikator, bobot, urutan || 0, id]
    );

    res.json({ success: true, message: "Indikator berhasil diupdate" });
  } catch (error) {
    console.error("PUT mentor/indicators error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

router.delete("/indicators/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.query("DELETE FROM grading_indicators WHERE id = ?", [id]);
    res.json({ success: true, message: "Indikator berhasil dihapus" });
  } catch (error) {
    console.error("DELETE mentor/indicators error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * ============================================================================
 * GRADES
 * ============================================================================
 */
router.get("/grades", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';

    const [rows] = await conn.query(
      `SELECT sg.* FROM student_grades sg 
       JOIN grading_indicators gi ON sg.indicator_id = gi.id 
       WHERE gi.mentor_nama = ? AND gi.kelompok = ?`,
      [nama, kelompok]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET mentor/grades error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

router.post('/grades', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grades } = req.body;
    console.log(`📝 POST mentor/grades - payload:`, JSON.stringify(grades));

    if (!Array.isArray(grades)) {
      return res.status(400).json({ success: false, message: 'Format grades harus berupa array' });
    }

    if (grades.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada nilai yang dikirim' });
    }

    await conn.beginTransaction();

    for (const grade of grades) {
      console.log(`  → Menyimpan: indicator_id=${grade.indicator_id}, student_nama=${grade.student_nama}, nilai=${grade.nilai}`);
      await conn.query(
        `INSERT INTO student_grades (indicator_id, student_nama, nilai) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
        [grade.indicator_id, grade.student_nama, grade.nilai]
      );
    }

    await conn.commit();
    console.log('✅ Nilai berhasil disimpan:', grades.length, 'rows');
    res.json({ success: true, message: 'Nilai berhasil disimpan' });
  } catch (error) {
    await conn.rollback();
    console.error('POST mentor/grades error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  } finally {
    conn.release();
  }
});

/*
 * ============================================================================
 * CERTIFICATES
 * ============================================================================
 */
router.get("/certificates", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';
    const [rows] = await conn.query(
      "SELECT * FROM certificates WHERE mentor_nama = ? AND kelompok = ?",
      [nama, kelompok]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET mentor/certificates error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

router.post("/certificates", certUpload.single("file"), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';
    const { student_nama, judul, catatan } = req.body;
    const file = req.file;

    if (!student_nama || !file) {
      return res.status(400).json({ success: false, message: "Nama mahasiswa dan file sertifikat wajib diisi" });
    }

    // Save file to disk
    const safeName = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const storagePath = `certificates/${timestamp}_${random}_${safeName(file.originalname)}`;

    const uploadResult = await uploadFile(storagePath, file.buffer, file.mimetype);
    if (!uploadResult.ok) {
      console.error("Upload sertifikat gagal:", uploadResult.error);
      return res.status(500).json({ success: false, message: "Gagal menyimpan file sertifikat" });
    }

    const [result] = await conn.query(
      `INSERT INTO certificates 
       (student_nama, mentor_nama, kelompok, file_url, judul, catatan) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_nama, nama, kelompok, storagePath, judul || "Sertifikat Praktik Kerja Lapangan", catatan]
    );

    res.json({ success: true, message: "Sertifikat berhasil diupload", id: result.insertId });
  } catch (error) {
    console.error("POST mentor/certificates error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  } finally {
    conn.release();
  }
});

router.delete("/certificates/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.query("DELETE FROM certificates WHERE id = ?", [id]);
    res.json({ success: true, message: "Sertifikat berhasil dihapus" });
  } catch (error) {
    console.error("DELETE mentor/certificates error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

/*
 * ============================================================================
 * TUGAS AKHIR
 * ============================================================================
 */
router.get("/tugas-akhir", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nama = req.user.nama;
    const kelompok = req.user.kelompok || '-';
    const [rows] = await conn.query(
      "SELECT * FROM tugas_akhir WHERE mentor_nama = ? AND kelompok = ? ORDER BY created_at DESC",
      [nama, kelompok]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET mentor/tugas-akhir error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

router.put("/tugas-akhir/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status, catatan_mentor } = req.body;
    
    await conn.query(
      "UPDATE tugas_akhir SET status = ?, catatan_mentor = ?, reviewed_at = NOW() WHERE id = ?",
      [status, catatan_mentor, id]
    );
    res.json({ success: true, message: "Status tugas akhir berhasil diupdate" });
  } catch (error) {
    console.error("PUT mentor/tugas-akhir error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
