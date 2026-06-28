/*
 * ============================================================================
 * MAIN SERVER FILE - ENTRY POINT BACKEND (MySQL Version)
 * ============================================================================
 * File ini adalah entry point dari aplikasi backend.
 * Berisi konfigurasi Express server, middleware, routing, dan static file serving.
 *
 * PENGGANTI SUPABASE → MySQL:
 * - Semua query sekarang lewat server/config/db.js (mysql2/promise pool)
 * - File upload disimpan di folder server/uploads/ dan di-serve via /uploads
 * - Tidak butuh SUPABASE_URL/KEY lagi
 *
 * CARA SETUP LOKAL (XAMPP):
 * 1. Nyalakan MySQL di XAMPP
 * 2. Buat database `pkl` di phpMyAdmin
 * 3. Import file database_mysql.sql
 * 4. Set .env (lihat .env.example)
 * 5. npm install
 * 6. npm run seed   (opsional, untuk admin default)
 * 7. npm start
 * ============================================================================
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

// PENTING: Load .env SEBELUM import module lain
dotenv.config();

import { verifyToken, isMahasiswa, isAdmin, isMentor } from "./middleware/auth.js";
import { wifiKampus } from "./middleware/wifiKampus.js";
import { pool, testConnection } from "./config/db.js";
import { UPLOAD_ROOT } from "./config/storage.js";

import {
  login,
  absen,
  getRiwayat,
  submitIzin,
  getIzin,
  cancelIzin,
  getGrades,
  getCertificates,
  getTugasAkhir,
  submitTugasAkhir,
} from "./routes/auth.js";

import {
  getStats,
  getAttendanceToday,
  getStudents,
  getStudentAttendance,
  getDevices,
  deleteDevice,
  getUsers,
  createUser,
  resetUserPassword,
  deleteUser,
  getAttendanceReport,
  getAllIzin,
  updateIzinStatus,
  getHolidays,
  addHoliday,
  deleteHoliday,
  deleteAttendance,
  updateAttendance,
  getSettings,
  updateSettings,
} from "./routes/admin.js";

import pendaftaranRoutes from "./routes/pendaftaran.js";
import adminPendaftaranRoutes from "./routes/adminPendaftaran.js";
import logbookRoutes from "./routes/logbook.js";
import mentorRoutes from "./routes/mentor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

// ============================================================================
// STATIC FILES
// ============================================================================

// Frontend (React build output)
const clientPath = path.join(__dirname, "..", "client");
const publicPath = path.join(clientPath, "dist");
const indexPath = path.join(publicPath, "index.html");

app.use(express.static(publicPath));
if (!fs.existsSync(publicPath)) {
  app.use(express.static(path.join(clientPath, "public")));
}

// Uploaded files (PDF pendaftar, dll) - di-serve dari server/uploads/
app.use(
  "/uploads",
  express.static(UPLOAD_ROOT, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      // Paksa PDF dibuka di browser (inline), bukan di-download
      if (filePath.toLowerCase().endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
      }
    },
  }),
);

// ============================================================================
// HEALTH CHECK & DEBUG ENDPOINTS
// ============================================================================
app.get("/health", async (req, res) => {
  const db = await testConnection();
  res.json({
    status: "Server is running",
    database: db.ok ? "connected" : `error: ${db.error}`,
  });
});

app.get("/api/check-ip", (req, res) => {
  if (process.env.BYPASS_WIFI_CHECK === "true") {
    res.json({
      success: true,
      detectedIP: "bypassed",
      isWiFiKampus: true,
      message: "✅ WiFi check bypassed (development mode)",
      headers: {
        "x-forwarded-for": req.headers["x-forwarded-for"],
        "x-real-ip": req.headers["x-real-ip"],
      },
    });
    return;
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.connection.remoteAddress;

  const isWiFiKampus = /^103\.209\.9\.\d{1,3}$/.test(ip);

  res.json({
    success: true,
    detectedIP: ip,
    isWiFiKampus: isWiFiKampus,
    message: isWiFiKampus
      ? "✅ Anda terhubung ke WiFi Kampus"
      : "❌ Anda TIDAK terhubung ke WiFi Kampus",
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
    },
  });
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
app.post("/api/login", login);
app.use("/api", pendaftaranRoutes);
app.use("/api", adminPendaftaranRoutes);
app.use("/api", logbookRoutes);

// ============================================================================
// MAHASISWA ROUTES
// ============================================================================
app.post("/api/absen", verifyToken, isMahasiswa, wifiKampus, absen);
app.get("/api/riwayat", verifyToken, isMahasiswa, getRiwayat);
app.post("/api/izin", verifyToken, isMahasiswa, submitIzin);
app.get("/api/izin", verifyToken, isMahasiswa, getIzin);
app.delete("/api/izin/:id", verifyToken, isMahasiswa, cancelIzin);
app.get("/api/grades", verifyToken, isMahasiswa, getGrades);
app.get("/api/certificates", verifyToken, isMahasiswa, getCertificates);

const taUpload = multer({ storage: multer.memoryStorage() });
app.get("/api/tugas-akhir", verifyToken, isMahasiswa, getTugasAkhir);
app.post("/api/tugas-akhir", verifyToken, isMahasiswa, taUpload.single("file"), submitTugasAkhir);

// ============================================================================
// MENTOR ROUTES
// ============================================================================
app.use("/api/mentor", verifyToken, isMentor, mentorRoutes);

// ============================================================================
// ADMIN ROUTES
// ============================================================================
app.get("/api/admin/stats", verifyToken, isAdmin, getStats);
app.get(
  "/api/admin/attendance-today",
  verifyToken,
  isAdmin,
  getAttendanceToday,
);
app.get("/api/admin/students", verifyToken, isAdmin, getStudents);
app.get(
  "/api/admin/attendance/:nama",
  verifyToken,
  isAdmin,
  getStudentAttendance,
);
app.get("/api/admin/devices", verifyToken, isAdmin, getDevices);
app.delete(
  "/api/admin/devices/:deviceId",
  verifyToken,
  isAdmin,
  deleteDevice,
);
app.get("/api/admin/users", verifyToken, isAdmin, getUsers);
app.post("/api/admin/users", verifyToken, isAdmin, createUser);
app.post(
  "/api/admin/users/:id/reset-password",
  verifyToken,
  isAdmin,
  resetUserPassword,
);
app.delete("/api/admin/users/:id", verifyToken, isAdmin, deleteUser);
app.get("/api/admin/report", verifyToken, isAdmin, getAttendanceReport);
app.get("/api/admin/izin", verifyToken, isAdmin, getAllIzin);
app.put("/api/admin/izin/:id", verifyToken, isAdmin, updateIzinStatus);
app.put("/api/admin/attendance/:id", verifyToken, isAdmin, updateAttendance);
app.delete("/api/admin/attendance/:id", verifyToken, isAdmin, deleteAttendance);
app.get("/api/holidays", getHolidays); // Public route for holidays
app.post("/api/admin/holidays", verifyToken, isAdmin, addHoliday);
app.delete("/api/admin/holidays/:id", verifyToken, isAdmin, deleteHoliday);
app.get("/api/admin/settings", verifyToken, isAdmin, getSettings);
app.put("/api/admin/settings", verifyToken, isAdmin, updateSettings);

// ============================================================================
// SPA FALLBACK (harus di paling akhir)
// ============================================================================
app.get("*", (req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      res
        .status(404)
        .json({ success: false, message: "Route tidak ditemukan" });
    }
  });
});

app.use("/api/*", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: "API route tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// ============================================================================
// START SERVER
// ============================================================================
const start = async () => {
  const db = await testConnection();
  if (!db.ok) {
    console.error(`\n❌ Database connection gagal: ${db.error}`);
    console.error(
      `   Pastikan MySQL XAMPP sudah nyala, database '${process.env.DB_NAME || "pkl"}' sudah dibuat, dan .env sudah benar.\n`,
    );
    process.exit(1);
  }
  console.log(`✅ Database connected (${process.env.DB_NAME || "pkl"})`);

  app.listen(PORT, () => {
    console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(
      `⚙️  WiFi check: ${process.env.BYPASS_WIFI_CHECK === "true" ? "BYPASSED (dev)" : "ENABLED (prod)"}`,
    );
    console.log(`📂 Upload root: ${UPLOAD_ROOT}`);
  });
};

start();
