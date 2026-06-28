-- ============================================================================
-- DATABASE SCHEMA: Sistem Absensi PKL & Pendaftaran (MySQL/MariaDB)
-- ============================================================================
-- Database: pkl
-- Sesuaikan dengan kebutuhan XAMPP / phpMyAdmin.
--
-- CARA IMPORT:
--   1. Buka phpMyAdmin (http://localhost/phpmyadmin)
--   2. Buat database baru dengan nama: pkl
--   3. Klik tab "Import", pilih file ini, klik "Go"
--   ATAU klik tab "SQL", paste semua isi file ini, klik "Go"
--
-- ENGINE: InnoDB (mendukung transaction + foreign key)
-- CHARSET: utf8mb4 (mendukung emoji & karakter unicode)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- ============================================================================
-- TABLE: users
-- ============================================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'mahasiswa',
  kelompok VARCHAR(100) DEFAULT NULL,
  devices JSON DEFAULT NULL,
  max_devices INT NOT NULL DEFAULT 2,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: attendances
-- Berisi absensi (status='hadir') DAN pengajuan izin (status='izin').
-- ============================================================================
DROP TABLE IF EXISTS attendances;
CREATE TABLE attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100) DEFAULT NULL,
  tanggal DATE NOT NULL,
  sesi VARCHAR(20) NOT NULL,
  jam_masuk TIME NOT NULL,
  login_time DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'hadir',
  keterangan TEXT DEFAULT NULL,
  bukti_url VARCHAR(500) DEFAULT NULL,
  status_approval VARCHAR(50) DEFAULT 'pending',
  approved_by VARCHAR(255) DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendances_nama_tanggal_sesi (nama, tanggal, sesi),
  KEY idx_attendances_nama (nama),
  KEY idx_attendances_tanggal (tanggal),
  KEY idx_attendances_status (status),
  KEY idx_attendances_status_approval (status_approval),
  KEY idx_attendances_kelompok (kelompok)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: device_bindings
-- Setiap device (browser fingerprint) hanya bisa绑定 ke satu user.
-- ============================================================================
DROP TABLE IF EXISTS device_bindings;
CREATE TABLE device_bindings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100) DEFAULT NULL,
  bound_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usage_count INT NOT NULL DEFAULT 1,
  KEY idx_device_bindings_user (user_name),
  KEY idx_device_bindings_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: logbook
-- Catatan kegiatan harian mahasiswa (1 per hari per user).
-- ============================================================================
DROP TABLE IF EXISTS logbook;
CREATE TABLE logbook (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100) DEFAULT NULL,
  tanggal DATE NOT NULL,
  kegiatan TEXT NOT NULL,
  kendala TEXT DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  submitted_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_logbook_nama_tanggal (nama, tanggal),
  KEY idx_logbook_user_id (user_id),
  KEY idx_logbook_nama (nama),
  KEY idx_logbook_tanggal (tanggal),
  KEY idx_logbook_status (status),
  KEY idx_logbook_kelompok (kelompok),
  CONSTRAINT fk_logbook_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: pendaftar
-- Pendaftaran peserta PKL publik.
-- ============================================================================
DROP TABLE IF EXISTS pendaftar;
CREATE TABLE pendaftar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nim VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  divisi_pilihan VARCHAR(100) NOT NULL,
  divisi_assigned VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  urutan INT NOT NULL,
  assigned_at DATETIME DEFAULT NULL,
  assigned_by VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pendaftar_urutan (urutan),
  KEY idx_pendaftar_status (status),
  KEY idx_pendaftar_nim (nim),
  KEY idx_pendaftar_email (email),
  KEY idx_pendaftar_divisi_assigned (divisi_assigned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: pendaftar_files
-- Metadata file PDF (CV, transkrip, surat persetujuan).
-- File PDF disimpan di folder server/uploads/pendaftaran/<pendaftar_id>/...
-- ============================================================================
DROP TABLE IF EXISTS pendaftar_files;
CREATE TABLE pendaftar_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pendaftar_id INT NOT NULL,
  tipe VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INT DEFAULT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  storage_path VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pendaftar_files_pendaftar (pendaftar_id),
  CONSTRAINT fk_pendaftar_files_pendaftar
    FOREIGN KEY (pendaftar_id) REFERENCES pendaftar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: admin_pendaftaran
-- Akun admin untuk dashboard /admin_pendaftaran.
-- Terpisah dari tabel users (untuk absensi) demi keamanan.
-- ============================================================================
DROP TABLE IF EXISTS admin_pendaftaran;
CREATE TABLE admin_pendaftaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_admin_pendaftaran_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: holidays
-- Menyimpan data tanggal merah / libur nasional
-- ============================================================================
DROP TABLE IF EXISTS holidays;
CREATE TABLE holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL UNIQUE,
  keterangan VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_holidays_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: grading_indicators
-- Indikator penilaian dinamis buatan mentor
-- ============================================================================
DROP TABLE IF EXISTS grading_indicators;
CREATE TABLE grading_indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100) NOT NULL,
  nama_indikator VARCHAR(255) NOT NULL,
  bobot DECIMAL(5,2) NOT NULL DEFAULT 0,
  urutan INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_grading_indicators_mentor (mentor_nama),
  KEY idx_grading_indicators_kelompok (kelompok)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: student_grades
-- Nilai per mahasiswa per indikator
-- ============================================================================
DROP TABLE IF EXISTS student_grades;
CREATE TABLE student_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  indicator_id INT NOT NULL,
  student_nama VARCHAR(255) NOT NULL,
  nilai DECIMAL(5,2) DEFAULT NULL,
  catatan TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_grade (indicator_id, student_nama),
  KEY idx_student_grades_student (student_nama),
  CONSTRAINT fk_student_grades_indicator
    FOREIGN KEY (indicator_id) REFERENCES grading_indicators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: certificates
-- Data sertifikat per mahasiswa
-- ============================================================================
DROP TABLE IF EXISTS certificates;
CREATE TABLE certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_nama VARCHAR(255) NOT NULL,
  mentor_nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100) NOT NULL,
  nomor_sertifikat VARCHAR(100) NOT NULL UNIQUE,
  judul VARCHAR(255) NOT NULL DEFAULT 'Sertifikat Praktik Kerja Lapangan',
  periode_mulai DATE NOT NULL,
  periode_selesai DATE NOT NULL,
  tanggal_terbit DATE NOT NULL,
  catatan TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_certificates_student (student_nama),
  KEY idx_certificates_mentor (mentor_nama),
  KEY idx_certificates_kelompok (kelompok)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Setelah import SQL ini:
-- 1. Buat file .env di root project, isi konfigurasi MySQL XAMPP:
--      DB_HOST=localhost
--      DB_PORT=3306
--      DB_USER=root
--      DB_PASSWORD=
--      DB_NAME=pkl
--      JWT_SECRET=<random-min-32-chars>
-- 2. Jalankan: npm install
-- 3. Jalankan: npm run seed (untuk membuat admin default + sample data)
-- 4. Jalankan: npm run build
-- 5. Jalankan: npm start
-- 6. Buka http://localhost:5000
-- ============================================================================


CREATE TABLE tugas_akhir (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_nama VARCHAR(255) NOT NULL,
  mentor_nama VARCHAR(255) NOT NULL,
  kelompok VARCHAR(100) NOT NULL,
  judul VARCHAR(500) NOT NULL,
  deskripsi TEXT DEFAULT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  catatan_mentor TEXT DEFAULT NULL,
  submitted_at DATETIME DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_ta_student (student_nama),
  KEY idx_ta_mentor (mentor_nama),
  KEY idx_ta_kelompok (kelompok),
  KEY idx_ta_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
