# Sistem Absensi PKL dan Pendaftaran (MySQL/XAMPP Version)

Aplikasi full-stack untuk mengelola absensi PKL, izin, logbook harian, dan pendaftaran peserta. Backend menggunakan Express.js + MySQL (XAMPP/phpMyAdmin), frontend menggunakan React + Vite + Tailwind CSS.

## Fitur Utama

- Login terpisah berbasis JWT untuk admin, mahasiswa/anak SMK, serta portal login khusus mentor (`/mentor-login`).
- Device binding berbasis fingerprint browser untuk membatasi perangkat user.
- Validasi absensi dari jaringan kampus dengan whitelist IP `103.209.9.*` (bisa di-bypass untuk development lokal).
- Absensi sesi pagi dan sore dengan aturan waktu, anti-duplikat, dan jeda minimal.
- Pengajuan izin oleh mahasiswa, lengkap dengan status approval admin.
- Logbook harian mahasiswa dengan status draft/submitted.
- **Tugas Mingguan PKL**:
  - Mentor dapat membuat tugas mingguan (minggu ke-X, deskripsi, deadline, lampiran).
  - Mahasiswa dapat mengumpulkan tugas mingguan (upload file PDF/ZIP/DOCX/dsb, link pengerjaan, dan catatan).
  - Mentor dapat mengevaluasi pengumpulan mahasiswa (skor nilai 0-100, catatan feedback, status approved/revisi/rejected).
- **Tugas Akhir PKL**: Pengajuan proposal TA oleh mahasiswa dan review/persetujuan oleh mentor.
- **Penilaian & Sertifikat**: Penilaian berbasis indikator bobot dinamis dan upload sertifikat oleh mentor.
- Dashboard admin untuk statistik, user, device, laporan absensi, izin, dan logbook.
- Form pendaftaran publik dengan upload PDF CV, transkrip, dan surat persetujuan.
- Dashboard admin pendaftaran untuk assign divisi dan mengelola akun admin pendaftaran.
- **Database**: MySQL/MariaDB lokal (XAMPP/phpMyAdmin).
- **Storage**: file PDF disimpan di folder lokal `server/uploads/pendaftaran/`, `server/uploads/certificates/`, `server/uploads/tugas_akhir/`, dan `server/uploads/tugas_mingguan/`.

## Teknologi

- Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React.
- Backend: Node.js, Express.js, JWT, bcryptjs, Multer.
- Database: MySQL / MariaDB (XAMPP).
- Storage: filesystem lokal.
- Runtime: Node.js 20+.

## Struktur Project

```text
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── db.js        # MySQL connection pool
│   │   └── storage.js   # Local filesystem storage
│   ├── middleware/
│   ├── routes/
│   ├── scripts/         # seed & migration scripts
│   ├── package.json
│   └── server.js
├── database_mysql.sql   # Schema MySQL (import ke phpMyAdmin)
├── package.json
└── README.md
```

## Halaman Aplikasi

- `/` - landing page.
- `/absen` - login user absensi (mahasiswa & admin).
- `/mentor-login` - portal login khusus mentor pembimbing.
- `/dashboard` - dashboard mahasiswa/anak SMK (absensi, tugas mingguan, logbook, izin, tugas akhir, penilaian, sertifikat).
- `/mentor` - dashboard mentor (data peserta, tugas mingguan, penilaian, tugas akhir, sertifikat).
- `/admin` - dashboard admin absensi.
- `/pendaftaran` - form pendaftaran publik.
- `/admin_pendaftaran` - dashboard admin pendaftaran.

## Cara Menjalankan Lokal (XAMPP + MySQL)

### 1. Persiapan XAMPP

1. Install [XAMPP](https://www.apachefriends.org/).
2. Start **Apache** dan **MySQL** dari XAMPP Control Panel.
3. Buka phpMyAdmin di <http://localhost/phpmyadmin>.
4. Buat database baru dengan nama: **`pkl`** (charset `utf8mb4_unicode_ci`).
5. Pilih database `pkl`, klik tab **Import**, upload file `database_mysql.sql`, klik **Go**.

### 2. Konfigurasi Environment

Buat file `.env` di root project (atau copy dari `.env.example`):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pkl
JWT_SECRET=<random-min-32-karakter>
PORT=5000
NODE_ENV=development
BYPASS_WIFI_CHECK=true
```

Untuk generate JWT_SECRET yang aman:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install Dependency & Build

```bash
npm install
npm run build
```

`npm run build` akan menginstall dependency server + client dan membangun frontend React.

### 4. Seed Data (Opsional tapi Disarankan)

```bash
npm run seed
```

Script ini akan membuat akun default:

| Akun                  | Username/Nama | Password      |
|-----------------------|---------------|---------------|
| Admin absensi         | `admin`       | `admin123`    |
| Admin pendaftaran     | `admin`       | `admin123`    |
| Mentor pembimbing     | `Pak Mentor`  | `123456`      |
| Sample mahasiswa      | `Mad`         | `123456`      |
| Sample mahasiswa 2    | `Budi`        | `123456`      |

### 5. Jalankan Aplikasi

```bash
npm start
```

Buka <http://localhost:5000> di browser.

Untuk development frontend (hot reload), buka terminal kedua:

```bash
npm run dev:frontend
```

Frontend dev berjalan di <http://localhost:5173> (proxy `/api` ke backend).

## Skrip NPM

| Script               | Fungsi                                                      |
|----------------------|-------------------------------------------------------------|
| `npm start`          | Jalankan backend (serve frontend build + API)              |
| `npm run dev`        | Sama dengan `npm start`                                    |
| `npm run dev:frontend` | Jalankan Vite dev server (port 5173)                     |
| `npm run build`      | Install deps + build frontend production                    |
| `npm run build:frontend` | Build frontend saja                                    |
| `npm run seed`       | Seed admin & sample user ke database MySQL                 |

## Endpoint Utama

Public:

- `GET /health` - cek status server + database.
- `GET /api/check-ip` - cek IP (untuk debug WiFi kampus).
- `POST /api/login` - login user.
- `POST /api/pendaftaran` - submit pendaftaran (upload PDF).
- `POST /api/admin-pendaftaran/login` - login admin pendaftaran.
- `GET /api/admin-pendaftaran/list` - list admin pendaftaran.
- `POST /api/admin-pendaftaran/seed` - seed admin default.

Mahasiswa/anak SMK:

- `POST /api/absen` - submit absensi (perlu token + WiFi kampus).
- `GET /api/riwayat` - lihat riwayat absensi sendiri.
- `POST /api/izin` - submit izin.
- `GET /api/izin` - lihat izin sendiri.
- `DELETE /api/izin/:id` - batalkan izin.
- `GET /api/tugas-mingguan` - daftar tugas mingguan kelompok & status pengumpulan.
- `POST /api/tugas-mingguan/:id/submit` - kumpulkan / revisi tugas mingguan.
- `GET /api/tugas-akhir` - lihat riwayat pengajuan tugas akhir.
- `POST /api/tugas-akhir` - ajukan judul tugas akhir (upload PDF proposal).
- `GET /api/grades` - lihat nilai dari mentor.
- `GET /api/certificates` - lihat & unduh sertifikat PKL.
- `GET /api/logbook` - list logbook sendiri.
- `GET /api/logbook/today` - logbook hari ini.
- `POST /api/logbook` - buat draft logbook.
- `PUT /api/logbook/:id` - update draft.
- `POST /api/logbook/:id/submit` - submit logbook.
- `DELETE /api/logbook/:id` - hapus draft.

Admin (absensi):

- `GET /api/admin/stats` - statistik dashboard.
- `GET /api/admin/attendance-today` - rekap absensi hari ini.
- `GET /api/admin/students` - list mahasiswa.
- `GET /api/admin/attendance/:nama` - detail absensi 1 mahasiswa.
- `GET /api/admin/devices` - list device terikat.
- `DELETE /api/admin/devices/:deviceId` - unbind device.
- `GET /api/admin/users` - list semua user.
- `POST /api/admin/users` - buat user baru.
- `POST /api/admin/users/:id/reset-password` - reset password.
- `DELETE /api/admin/users/:id` - hapus user.
- `GET /api/admin/report` - laporan absensi.
- `GET /api/admin/izin` - list semua izin.
- `PUT /api/admin/izin/:id` - approve/reject izin.
- `GET /api/admin/logbook` - list semua logbook.
- `POST /api/admin/logbook/:id/reset` - reset logbook ke draft.
- `DELETE /api/admin/logbook/:id` - hapus logbook.

Admin pendaftaran:

- `GET /api/pendaftaran` - list pendaftar.
- `PUT /api/pendaftaran/:id` - assign divisi.
- `DELETE /api/pendaftaran/:id` - hapus pendaftar + file.
- `GET /api/pendaftaran/file/:id/:type` - stream PDF untuk preview.
- `GET /api/pendaftaran/file-url/:id/:type` - URL publik file.
- `POST /api/admin-pendaftaran/create` - buat admin baru.
- `DELETE /api/admin-pendaftaran/:id` - hapus admin.

Mentor:

- `GET /api/mentor/students` - list mahasiswa bimbingan.
- `GET /api/mentor/tugas-mingguan` - list tugas mingguan & statistik pengumpulan.
- `POST /api/mentor/tugas-mingguan` - buat tugas mingguan baru (lampiran opsional).
- `PUT /api/mentor/tugas-mingguan/:id` - edit tugas mingguan.
- `DELETE /api/mentor/tugas-mingguan/:id` - hapus tugas mingguan.
- `GET /api/mentor/tugas-mingguan/:id/submissions` - lihat detail pengumpulan seluruh mahasiswa.
- `PUT /api/mentor/tugas-mingguan/submissions/:id` - nilai, feedback, dan verifikasi status tugas mahasiswa.
- `GET /api/mentor/indicators` - list indikator penilaian.
- `POST /api/mentor/indicators` - buat indikator baru.
- `GET /api/mentor/grades` - list penilaian mahasiswa.
- `POST /api/mentor/grades` - submit penilaian.
- `GET /api/mentor/certificates` - list sertifikat.
- `POST /api/mentor/certificates` - upload sertifikat (PDF).
- `GET /api/mentor/tugas-akhir` - list tugas akhir bimbingan.
- `PUT /api/mentor/tugas-akhir/:id` - review tugas akhir.
- `DELETE /api/mentor/tugas-akhir/:id` - hapus tugas akhir.

## Aturan Absensi

- Sesi pagi: 08:00-10:00.
- Sesi sore: 15:00-17:00.
- Sore hanya bisa dilakukan jika user sudah absen pagi.
- Jeda pagi ke sore minimal 6 jam, di luar waktu istirahat 12:00-13:00.
- User tidak bisa absen dua kali pada sesi yang sama.
- Device harus sudah terdaftar dan tidak boleh dipakai akun lain.
- Absensi wajib dari WiFi kampus kecuali `BYPASS_WIFI_CHECK=true`.

## Pendaftaran

Form pendaftaran menerima:

- Nama.
- NIM.
- Email.
- Divisi pilihan: Networking, Software Engineer, Multimedia, Artificial Intelligence, Data Analyst.
- File PDF CV.
- File PDF transkrip.
- File PDF surat persetujuan.

Pendaftar pertama sampai urutan ke-30 diberi status `priority`, sisanya `pending`. Admin pendaftaran dapat assign divisi dengan batas maksimal 6 peserta per divisi.

File PDF disimpan di `server/uploads/pendaftaran/<pendaftar_id>/` dan di-serve via `/uploads/...`.

## Catatan Keamanan

- Jangan commit file `.env` berisi kredensial asli.
- Gunakan `JWT_SECRET` kuat minimal 32 karakter.
- Untuk production non-lokal, set `BYPASS_WIFI_CHECK=false`.
- File upload tidak di-authenticate (preview publik); pastikan folder `server/uploads/` tidak terekspose langsung via web server lain.

## Migrasi dari Supabase

Jika sebelumnya project ini pakai Supabase, struktur tabel & API response identik sehingga frontend tidak perlu diubah. Yang berubah:

- `database.sql` (PostgreSQL) → `database_mysql.sql` (MySQL).
- Supabase client (`@supabase/supabase-js`) → `mysql2/promise` (lihat `server/config/db.js`).
- Supabase Storage → folder lokal `server/uploads/` (lihat `server/config/storage.js`).
- Environment variable `SUPABASE_URL/KEY` → `DB_HOST/USER/PASSWORD/NAME`.

---

# 🔎 Penjelasan Mendalam & Source Code Utama

Sesuai dengan permintaan, berikut adalah penjelasan mendalam (Deep Dive) berserta *source code* dari file-file paling krusial di dalam aplikasi ini agar Anda bisa memahami cara kerjanya baris-demi-baris.

## 1. Entry Point Backend (`server/server.js`)
File ini adalah gerbang utama dari aplikasi sisi server. Semua *request* dari browser akan masuk ke sini terlebih dahulu.

<details>
<summary><b>Klik untuk melihat kode `server.js`</b></summary>

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// ... imports lainnya

// 1. Inisialisasi Environment Variables
dotenv.config();

// 2. Inisialisasi Express App
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Setup Middleware Global
app.use(express.json()); // Agar bisa menerima request body berupa JSON
app.use(cors());         // Agar frontend (port 5173) bisa akses backend (port 5000) tanpa error CORS

// 4. Endpoint Bawaan (Health Check & IP Check)
// Digunakan frontend untuk mengecek apakah terhubung ke WiFi kampus (bisa di-bypass via .env)
app.get("/api/check-ip", (req, res) => {
  // ... logika pengecekan IP
});

// 5. Pendaftaran Rute-rute API
// Semua request berawalan /api/login akan dihandle fungsi login
app.post("/api/login", login); 

// Rute di bawah ini dilindungi oleh middleware verifyToken dan isMahasiswa
app.post("/api/absen", verifyToken, isMahasiswa, wifiKampus, absen);
app.get("/api/riwayat", verifyToken, isMahasiswa, getRiwayat);
// ... rute admin, mentor, pendaftaran, dll

// 6. Menjalankan Server
const start = async () => {
  const db = await testConnection(); // Cek koneksi MySQL dulu
  if (!db.ok) {
    console.error("Database connection gagal");
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  });
};

start();
```
</details>

**Penjelasan Alur `server.js`:**
- **Middleware**: Fungsi yang dijalankan di tengah-tengah (sebelum mencapai fungsi tujuan). Contoh: `verifyToken` mengecek apakah user mengirimkan token rahasia yang sah. Jika tidak, proses berhenti dan ditolak.
- **Routing**: `app.post('/api/absen', ...)` artinya jika ada yang mengirim data (POST) ke `/api/absen`, jalankan fungsi `absen`.

## 2. Logika Utama Autentikasi dan Absensi (`server/routes/auth.js`)
Di sinilah logika inti dari aplikasi ini berjalan (seperti pencocokan password, validasi waktu absen, dll).

<details>
<summary><b>Klik untuk melihat inti kode `auth.js`</b></summary>

```javascript
// --- FUNGSI LOGIN ---
export const login = async (req, res) => {
  const conn = await pool.getConnection(); // Buka koneksi ke MySQL
  try {
    const { nama, password, deviceId } = req.body;

    // 1. Cari user di database
    const [userRows] = await conn.query(
      "SELECT * FROM users WHERE nama = ? LIMIT 1",
      [nama]
    );

    // 2. Pengecekan Device Binding (Anti-Joki)
    // Jika user mahasiswa, cek apakah deviceId cocok dengan miliknya
    if (user.role !== "admin") {
      const [bindings] = await conn.query(
        "SELECT user_name FROM device_bindings WHERE device_id = ? LIMIT 1",
        [deviceId]
      );
      // Jika device ini sudah terdaftar atas nama orang lain -> Tolak
      if (bindings.length > 0 && bindings[0].user_name !== nama) {
        return res.status(403).json({ message: "Device sudah terikat untuk user lain" });
      }
    }

    // 3. Cek Password menggunakan bcrypt
    let passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Password salah" });

    // 4. Berikan JWT Token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    return res.json({ success: true, token, user });
  } finally {
    conn.release(); // Selalu tutup koneksi
  }
};

// --- FUNGSI ABSEN ---
export const absen = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // ... validasi IP dan WiFi
    
    // 1. Tentukan waktu login untuk melihat apakah ini absen PAGI atau SORE
    let sesi;
    if (waktu >= 08:00 && waktu <= 10:00) sesi = "pagi";
    else if (waktu >= 15:00 && waktu <= 17:00) sesi = "sore";
    else return res.status(403).json({ message: "Waktu tidak valid" });

    // 2. Aturan: Absen sore HARUS sudah absen pagi
    if (sesi === "sore") {
      const [pagiRows] = await conn.query("SELECT * FROM attendances WHERE sesi='pagi'");
      if (pagiRows.length === 0) return res.status(403).json({ message: "Harus absen pagi dulu!" });
      
      // Jeda 6 jam
      if (selisihJam < 6) return res.status(403).json({ message: "Jeda minimal 6 jam" });
    }

    // 3. Simpan Absensi
    await conn.query("INSERT INTO attendances (nama, sesi, status) VALUES (?, ?, 'hadir')", [nama, sesi]);
    return res.json({ success: true, message: "Absen berhasil" });
  } finally {
    conn.release();
  }
};
```
</details>

**Penjelasan Alur `auth.js`:**
- **Device Binding**: Fitur di mana saat mahasiswa pertama kali login, ID unik dari perangkat (HP/Laptop) mereka dikunci ke akun tersebut. Tujuannya agar mereka tidak bisa menitipkan absen ke HP temannya.
- **Bcrypt**: Password di database tidak disimpan mentah-mentah (misal: "12345"), melainkan diacak (`$2a$10$abcdef...`). `bcrypt.compare` bertugas mencocokkan teks mentah dengan teks acak tersebut.
- **Validasi Jeda Absen**: Program memaksa harus ada jeda 6 jam (diluar waktu istirahat) dari absen pagi hingga absen sore.

## 3. Frontend: Pengatur Halaman (`client/src/App.jsx`)
Kode ini bertugas layaknya "papan petunjuk jalan" (Router) yang mengarahkan user ke halaman yang tepat.

<details>
<summary><b>Klik untuk melihat kode `App.jsx`</b></summary>

```jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import MahasiswaDashboard from "./pages/MahasiswaDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Bebas (Bisa diakses siapa saja) */}
        <Route path="/absen" element={<LoginPage />} />
        
        {/* Rute Terlindungi (Harus Login sbg Mahasiswa) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["mahasiswa"]}>
              <MahasiswaDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
```
</details>

**Penjelasan `App.jsx`:**
- Ini menggunakan `react-router-dom`. URL browser tidak memuat ulang (*reload*) halaman penuh seperti website lama (PHP). Ia hanya mengganti komponen (UI) sesuai URL yang diketik.
- Komponen `<ProtectedRoute>` bertugas mengecek Token JWT di *Local Storage*. Jika token tidak ada atau rolenya bukan `mahasiswa`, ia akan mengembalikan user secara otomatis ke halaman `/absen` (Login).

## 4. Frontend: Halaman Login (`client/src/pages/LoginPage.jsx`)
Tempat di mana antarmuka pengguna berada dan bagaimana ia berkomunikasi dengan fungsi `login` di backend.

<details>
<summary><b>Klik untuk melihat kode `LoginPage.jsx`</b></summary>

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { getDeviceIdSync } from "../utils/fingerprint";

const LoginPage = () => {
  // State untuk menyimpan ketikan user di dalam kotak input
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();

  // Fungsi yang dijalankan saat tombol "Masuk" diklik
  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah browser reload

    try {
      // Mengambil ID unik perangkat komputer/hp ini
      const deviceId = getDeviceIdSync();

      // Mengirim POST request ke backend HTTP (Node.js/Express)
      const response = await axiosInstance.post("/login", {
        nama: nama,
        password: password,
        deviceId: deviceId,
      });

      if (response.data.success) {
        // Simpan token (kunci rahasia) ke browser
        localStorage.setItem("token", response.data.token);
        
        // Pindah halaman ke Dashboard sesuai perannya
        if (response.data.user.role === "admin") navigate("/admin");
        else navigate("/dashboard");
      }
    } catch (err) {
      alert("Login gagal: " + err.response.data.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input 
          value={nama} 
          onChange={(e) => setNama(e.target.value)} 
          placeholder="Nama Pengguna"
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Kata Sandi"
        />
        <button type="submit">Masuk</button>
      </form>
    </div>
  );
};
```
</details>

**Penjelasan `LoginPage.jsx`:**
- `useState`: Hook dari React untuk menyimpan memori sementara dari kotak input (seperti nama & sandi).
- `axiosInstance.post`: Pustaka Axios yang digunakan untuk mengirim data ke `http://localhost:5000/api/login`. Data yang dibawa berupa objek JSON: `{nama, password, deviceId}`.
- Jika berhasil login, server memberikan **Token** (`response.data.token`). Frontend menyimpan token ini di `localStorage` agar tidak terhapus walau browser ditutup. Token ini akan disisipkan setiap kali mahasiswa mau absen, sehingga server tahu identitasnya.

## 5. Komponen Keamanan Frontend (`client/src/components/ProtectedRoute.jsx`)
File ini berfungsi sebagai "Satpam" yang menjaga halaman-halaman tertentu (seperti dashboard mahasiswa) agar tidak bisa dibuka oleh sembarang orang yang belum login atau beda *role*.

<details>
<summary><b>Klik untuk melihat kode `ProtectedRoute.jsx`</b></summary>

```jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Mengambil token dan data user dari ingatan browser (Local Storage)
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Jika tidak ada token (belum login), kembalikan ke halaman absen/login
  if (!token || !user) {
    return <Navigate to="/absen" replace />;
  }

  // Jika user sudah login, tapi rolenya tidak diizinkan di halaman ini (contoh: admin mencoba masuk ke dashboard mahasiswa), tolak.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/absen" replace />;
  }

  // Jika aman, tampilkan halamannya
  return children;
};

export default ProtectedRoute;
```
</details>

**Penjelasan `ProtectedRoute.jsx`:**
- **`<Navigate to="/absen" />`**: Fungsi dari `react-router-dom` untuk memindahkan pengguna secara paksa. Jika sistem mendeteksi ada penyusup (tanpa token), komponen ini tidak akan merender halaman, melainkan langsung "melempar" pengguna kembali ke halaman Login.

## 6. Koneksi Database (`server/config/db.js`)
Di sinilah aplikasi Node.js terhubung ke **MySQL** (biasanya via XAMPP). File ini menciptakan sebuah "kolam koneksi" (*connection pool*).

<details>
<summary><b>Klik untuk melihat kode `db.js`</b></summary>

```javascript
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

// ... [Logika load .env]

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pkl",
  waitForConnections: true,
  connectionLimit: 10,   // Maksimal koneksi simultan
  queueLimit: 0,
  charset: "utf8mb4",
  dateStrings: true,     // Mengambil tanggal murni sebagai string dari MySQL
  timezone: "+07:00",    // Memaksa waktu sesuai Waktu Indonesia Barat (WIB)
};

export const pool = mysql.createPool(dbConfig);

// Helper function: untuk mengetes apakah DB menyala atau mati saat server baru jalan
export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

export default pool;
```
</details>

**Penjelasan `db.js`:**
- **`mysql2/promise`**: Pustaka konektor MySQL yang mendukung *async/await*. Artinya kode tidak perlu menggunakan sistem *callback* kuno.
- **`createPool`**: Mengapa pakai `Pool` dan tidak `createConnection`? Karena jika ada 50 mahasiswa absen bersamaan, aplikasi tidak membuka 50 koneksi baru yang memberatkan database. Ia membatasi koneksi aktif (contoh: 10) dan me-*reuse* (menggunakan ulang) koneksi yang sudah selesai.

## 7. Penanganan Upload File (`server/config/storage.js`)
File ini menggantikan layanan pihak ketiga (seperti Supabase Storage) dan mengatur bagaimana file yang diupload (contoh: PDF Transkrip, Surat Izin) disimpan di memori *hardisk* server.

<details>
<summary><b>Klik untuk melihat kode `storage.js`</b></summary>

```javascript
import fs from "fs/promises";
import path from "path";

// Direktori tempat penyimpanan (defaultnya folder server/uploads)
const UPLOAD_ROOT = path.resolve(__dirname, "..", process.env.UPLOAD_ROOT || "uploads");

// Fungsi untuk memastikan foldernya sudah ada. Kalau belum, Node.js disuruh buat.
const ensureDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
};

// Fungsi Utama: Menerima file dan menyimpannya
export const uploadFile = async (storagePath, buffer, mimetype = "application/pdf") => {
  try {
    const absPath = path.join(UPLOAD_ROOT, storagePath);
    await ensureDir(path.dirname(absPath)); // Buat foldernya dulu
    
    // Tulis/simpan isi file (buffer) ke hardisk
    await fs.writeFile(absPath, buffer);
    return { ok: true, path: storagePath };
  } catch (err) {
    return { ok: false, error: err };
  }
};

// Fungsi untuk membuat URL agar gambar/PDF bisa diakses di browser
export const getPublicUrl = (storagePath) => {
  if (!storagePath) return null;
  const cleanPath = storagePath.split(path.sep).join("/");
  return `/uploads/${cleanPath}`;
};
```
</details>

**Penjelasan `storage.js`:**
- **`buffer`**: Saat pengguna mengupload file dari website, Node.js menerimanya dalam bentuk kumpulan data biner mentah (*buffer*). Fungsi `fs.writeFile` bertugas mengubah data biner mentah ini kembali menjadi file fisik (misal: `.pdf`).
- **`getPublicUrl`**: Setelah disimpan di `/uploads`, URL ini dibuat agar browser bisa memanggil file tersebut kembali. Rute `/uploads` ini lalu diizinkan untuk diakses publik oleh Express di dalam `server.js` (`app.use("/uploads", express.static(...))`).

---

## 8. Changelog Perubahan Sistem

### [UPDATE] Format Upload Tugas Akhir: ZIP → PDF
**Tanggal:** 2026-07-03

#### Ringkasan
Format file pengajuan Tugas Akhir oleh mahasiswa diubah dari **ZIP** menjadi **PDF**. Perubahan ini mencakup 3 file sekaligus: satu di backend, dua di frontend.

#### Alasan Perubahan
| Sebelumnya (ZIP) | Sesudah (PDF) |
|---|---|
| Mentor harus download dan ekstrak ZIP | Mentor bisa buka PDF langsung di browser |
| Tidak bisa di-preview | Bisa di-preview inline oleh server |
| Tidak ada validasi tipe di backend | Backend menolak file non-PDF secara ketat |

#### Detail Perubahan Per File

**`server/server.js` — Validasi Backend (Paling Penting)**
```javascript
// SEBELUM: Tidak ada validasi sama sekali, semua tipe file diterima
const taUpload = multer({ storage: multer.memoryStorage() });

// SESUDAH: Ada 3 lapisan keamanan baru
const taUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Lapisan 1: Batasi maks 10MB
  fileFilter: (req, file, cb) => {         // Lapisan 2: Cek tipe MIME
    if (file.mimetype === "application/pdf") {
      cb(null, true);                      // → Izinkan
    } else {
      cb(new Error("File proposal harus berformat PDF"), false); // → Tolak
    }
  },
});
```
> **Penting:** Validasi di backend (`fileFilter`) ini adalah **garis pertahanan terakhir**. Walaupun seseorang menghapus batasan di browser, server tetap menolak file non-PDF. Ini jauh lebih aman dari hanya mengandalkan validasi di sisi frontend.

**`client/src/pages/MahasiswaDashboard.jsx` — Form Upload Mahasiswa**
```jsx
// SEBELUM
<label>File Proposal (ZIP) *</label>
<input accept=".zip,application/zip,application/x-zip-compressed" />

// SESUDAH  
<label>File Proposal (PDF) *</label>
<input accept="application/pdf,.pdf" />
```
> Atribut `accept` ini hanya menampilkan file `.pdf` pada dialog pilih file di browser.

**`client/src/pages/MentorDashboard.jsx` — Tombol Download Mentor**
```jsx
// SEBELUM
Download Proposal ZIP

// SESUDAH
Download Proposal PDF
```
> Label tombol diperbarui agar konsisten.

---

### [FITUR BARU] Hapus Pengajuan Tugas Akhir oleh Mentor
**Tanggal:** 2026-07-03

#### Ringkasan
Mentor kini dapat **menghapus** pengajuan Tugas Akhir dari mahasiswa yang sudah tidak relevan. Tombol **"Hapus"** (merah) ditambahkan di samping tombol "Review & Update Status" pada setiap kartu pengajuan.

#### File yang Diubah

**`server/routes/mentor.js` — Route Backend Baru**
```javascript
// DELETE /api/mentor/tugas-akhir/:id
router.delete("/tugas-akhir/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const mentorNama = req.user.nama; // Identitas mentor dari JWT

    // Validasi kepemilikan: mentor hanya bisa hapus data kelompoknya sendiri
    const [rows] = await conn.query(
      "SELECT id, judul FROM tugas_akhir WHERE id = ? AND mentor_nama = ? LIMIT 1",
      [id, mentorNama]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Tidak ditemukan atau akses ditolak" });
    }

    await conn.query("DELETE FROM tugas_akhir WHERE id = ?", [id]);
    res.json({ success: true, message: "Pengajuan berhasil dihapus" });
  } finally {
    conn.release();
  }
});
```

**`client/src/pages/MentorDashboard.jsx` — Fungsi & Tombol Baru**
```jsx
// Fungsi handleDeleteTA — konfirmasi lalu kirim DELETE request
const handleDeleteTA = async (id, judul) => {
  if (!window.confirm(`Hapus "${judul}"? Tidak bisa dibatalkan.`)) return;
  const res = await axiosInstance.delete(`/mentor/tugas-akhir/${id}`);
  if (res.data.success) {
    alert("✅ Berhasil dihapus!");
    fetchTugasAkhir(); // Refresh UI
  }
};

// Tombol Hapus (merah) di samping "Review & Update Status"
<button onClick={() => handleDeleteTA(ta.id, ta.judul)}
  className="... bg-red-500/20 text-red-300 ...">
  <Trash2 /> Hapus
</button>
```

#### Fitur Keamanan
| Lapisan | Mekanisme |
|---|---|
| Dialog konfirmasi | `window.confirm()` di browser mencegah penghapusan tidak sengaja |
| Validasi kepemilikan | Backend mengecek `mentor_nama = req.user.nama` sebelum menghapus |
| JWT Auth | Route dilindungi `verifyToken` + `isMentor` middleware |

---

### [BUGFIX] Perbaikan Teks Tidak Terlihat pada Modal Ajukan Izin
**Tanggal:** 2026-07-06

#### Ringkasan
Teks pada formulir "Ajukan Izin" (Dashboard Mahasiswa) sebelumnya tidak bisa dibaca karena menggunakan warna putih di atas *background* modal yang berwarna putih juga (efek tercampurnya komponen tema gelap dan terang).

#### File yang Diperbaiki
**`client/src/pages/MahasiswaDashboard.jsx`**
- Mengubah warna judul modal menjadi `text-gray-900`.
- Mengubah label inputan "Keterangan Izin" menjadi `text-gray-700`.
- Mengganti gaya *textarea* yang sebelumnya `bg-white/10 text-white` (transparan) menjadi `bg-gray-50 text-gray-900` (terang) sehingga pengguna kini bisa melihat teks yang mereka ketik.
Tidak ada perubahan pada logika *backend* atau alur database. Perbaikan berfokus hanya pada UI Tailwind CSS.

---

### [FITUR BARU] Tombol Login Khusus Mentor di Landing Page
**Tanggal:** 2026-07-18

#### Ringkasan
Tombol login terpisah khusus untuk **Mentor** telah ditambahkan di halaman utama (Landing Page), diletakkan tepat di sebelah kanan tombol "Absen". Tombol ini mengarahkan mentor ke rute baru `/mentor-login`.

#### File yang Diubah
**1. Frontend — `client/src/pages/LandingPage.jsx`**
- Mengubah layout grid dari 3 kolom (`md:grid-cols-3`) menjadi 4 kolom (`sm:grid-cols-2 lg:grid-cols-4`).
- Menambahkan komponen tombol "Mentor" dengan nuansa warna *amber* (kuning/oranye) dan ikon `GraduationCap` dari *Lucide React*. Tombol ini melakukan navigasi ke `/mentor-login`.

**2. Frontend — `client/src/App.jsx`**
- Menambahkan rute `<Route path="/mentor-login" element={<LoginPage />} />` agar `/mentor-login` menggunakan komponen *LoginPage* yang sama dengan `/absen`, namun di URL yang terpisah sesuai permintaan pengguna.

---

### [DOKUMENTASI] Penjelasan Alur Kode Detail (Line-by-Line)
**Ditambahkan pada:** 2026-07-06

Untuk memahami logika terdalam dari program ini secara teknis (termasuk *query* SQL, validasi logika, dan *middleware*), sebuah panduan mendalam **baris-demi-baris (Line-by-Line)** telah ditambahkan ke dalam file `ALUR_PROGRAM_README.md` pada bab **"7. Deep Dive: Analisis Kode Baris-demi-Baris"**.

Bab tersebut mengupas tuntas tiga alur utama beserta potongan kodenya:
1. **Alur Absensi Student (`server/routes/auth.js`)**: Membahas bagaimana server mengekstrak waktu, memvalidasi hari libur, melakukan *Device Binding* (mencegah titip absen HP), mengecek sesi pagi/sore, menghitung jeda wajib 6 jam, hingga eksekusi `INSERT INTO attendances`.
2. **Alur Pengaturan Libur oleh Admin (`server/routes/admin.js`)**: Membahas fungsi `addHoliday`, validasi duplikasi tanggal melalui query `SELECT`, dan eksekusi `INSERT INTO holidays` yang mana datanya akan langsung berefek pada validasi absensi mahasiswa di seluruh sistem.
3. **Alur Mentor (`server/routes/mentor.js`)**: Membahas 3 fungsi sekaligus, yaitu: 
    - *Grades* (Penilaian): menggunakan konsep *Transaction* (`conn.beginTransaction()`) dan *Upsert* (`ON DUPLICATE KEY UPDATE`).
    - *Tugas Akhir*: pengubahan status dari `pending` ke `approved` / `revision` menggunakan query `UPDATE`.
    - *Sertifikat*: integrasi library *Multer* untuk upload fisik, dan penyimpanan `file_url` (hanya alamat URL) ke dalam tabel MySQL.

> **Catatan:** Baca `ALUR_PROGRAM_README.md` Bab 7 untuk melihat *source code* asli dari *backend* beserta komentar penjelasannya untuk setiap baris!
