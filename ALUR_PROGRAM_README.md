# Dokumentasi Alur Program (Sistem Absensi PKL BPTI)

Dokumen ini menjelaskan alur program secara detail dari segi arsitektur, struktur direktori, hingga alur pada baris kode penting di aplikasi ini. Aplikasi ini dibangun dengan arsitektur **Client-Server**.

---

## 1. Arsitektur Utama

Aplikasi ini terbagi menjadi dua bagian utama:
1. **Client (Frontend)**: Dibangun menggunakan **React.js** (dengan Vite) dan Tailwind CSS untuk tampilan antarmuka. Bertugas menampilkan UI, menerima input pengguna, dan berkomunikasi dengan server melalui REST API.
2. **Server (Backend)**: Dibangun menggunakan **Node.js** dan framework **Express.js**. Bertugas memproses logika bisnis (autentikasi, absensi, pengolahan data admin), validasi, serta terhubung dengan database **MySQL**.

---

## 2. Struktur Direktori dan File Penting

Di dalam direktori utama `c:\pkl-bpti-app-main`, terdapat dua folder penting: `client` dan `server`. Berikut penjelasannya:

### 📁 Bagian `server/` (Backend Node.js)
Folder ini mengelola semua permintaan API dari frontend ke database.

- **`server/server.js`**
  **Fungsi:** Ini adalah **Entry Point** (gerbang utama) backend. Semua konfigurasi awal terjadi di sini.
  **Alur Baris Kode Penting:**
  - `Baris 24-33`: Mengimpor library seperti `express`, `cors` (untuk izin domain), dan `dotenv` (untuk membaca file `.env`).
  - `Baris 35-38`: Mengimpor *middleware* buatan sendiri seperti `verifyToken` (cek login) dan koneksi database (`pool`).
  - `Baris 81-89`: Membuat instance Express server (`const app = express()`) dan mengaktifkan JSON body parser dan CORS.
  - `Baris 124-167`: Endpoint `/health` dan `/api/check-ip` untuk mengecek koneksi WiFi kampus (validasi IP mahasiswa saat absen).
  - `Baris 172-241`: **Definisi Routing API**. Di sinilah rute didaftarkan. Contoh: `app.post("/api/login", login)` mengarahkan permintaan login ke fungsi login. Rute dilindungi middleware khusus (seperti `isMahasiswa`, `isAdmin`).
  - `Baris 270-291`: Fungsi `start()` yang menghubungkan ke MySQL dan menjalankan server di port tertentu (5000).

- **`server/config/db.js`**
  **Fungsi:** Mengatur koneksi ke database MySQL menggunakan library `mysql2/promise`.

- **`server/routes/`**
  **Fungsi:** Folder ini berisi pemisahan endpoint API agar tidak menumpuk di `server.js`.
  - `auth.js`: Rute untuk login mahasiswa, submit absensi, dll.
  - `admin.js`: Rute untuk operasi admin (CRUD user, melihat rekap absensi).
  - `pendaftaran.js`, `logbook.js`, dll: Rute khusus fitur pendaftaran & jurnal.

- **`server/middleware/auth.js`**
  **Fungsi:** Menjaga keamanan API. Middleware seperti penjaga pintu; sebelum request masuk ke fungsi utama, token (JWT) akan dicek di sini.

### 📁 Bagian `client/` (Frontend React)
Folder ini mengelola tampilan di browser.

- **`client/src/main.jsx`**
  **Fungsi:** Titik masuk React. Memasukkan seluruh aplikasi ke dalam tag div HTML yang ada di `index.html`.

- **`client/src/App.jsx`**
  **Fungsi:** Mengatur **Routing Tampilan (URL navigasi)** frontend.
  **Alur Baris Kode Penting:**
  - `Baris 6`: Menggunakan library `react-router-dom` untuk sistem pindah halaman tanpa *reload* (SPA - Single Page Application).
  - `Baris 19-48`: Definisi `Route`. 
    - `<Route path="/" element={<LandingPage />} />` berarti jika user ke URL `/`, tampilkan komponen `LandingPage`.
    - `<Route path="/mentor-login" element={<MentorLoginPage />} />` memisahkan login mentor dari absensi reguler, mengarah ke halaman login khusus mentor.
    - `<ProtectedRoute allowedRoles={["mahasiswa"]}>` berarti halaman tersebut tidak bisa dibuka tanpa login sebagai mahasiswa. Jika belum login, akan dilempar kembali ke halaman login.

- **`client/src/pages/`**
  **Fungsi:** Kumpulan halaman utuh yang terlihat oleh user.
  - `LoginPage.jsx`: Halaman login untuk mahasiswa & admin absensi (`/absen`). Jika akun dengan role mentor mencoba login di sini, sistem akan memblokir dan mengarahkan pengguna untuk login melalui `/mentor-login`.
  - `MentorLoginPage.jsx`: Halaman login khusus untuk Mentor (`/mentor-login`). Terpisah dari login absensi, memiliki antarmuka khusus (Portal Mentor) dan memvalidasi bahwa hanya akun Mentor atau Admin yang berhak masuk.
  - `MahasiswaDashboard.jsx`: Menampilkan absensi (pagi/sore), menu tugas mingguan (lihat deadline & kumpulkan tugas), logbook harian, izin, proposal tugas akhir, nilai indikator dari mentor, dan sertifikat kelulusan.
  - `AdminDashboard.jsx`: Menampilkan dashboard untuk Admin melihat statistik, laporan, dan mengatur pengguna.
  - `MentorDashboard.jsx`: Halaman khusus untuk pembimbing (data peserta kelompok, manajemen tugas mingguan & review submission, penilaian bobot, review tugas akhir, dan upload sertifikat). Ketika mentor logout, sistem secara otomatis mengalihkan navigasi kembali ke `/mentor-login`.

- **`client/src/components/ProtectedRoute.jsx`**
  **Fungsi:** Komponen logika keamanan frontend yang mengecek apakah user diizinkan melihat halaman yang sedang diakses berdasarkan role ("admin", "mahasiswa", "mentor", dll). Mendukung parameter `redirectTo` dinamis (misal rute `/mentor` mengarahkan fallback ke `/mentor-login`).

---

## 3. Alur Skenario Contoh: Mahasiswa Melakukan Absensi

Untuk lebih memahami bagaimana baris kode saling berkomunikasi, berikut adalah alur dari saat mahasiswa mengeklik tombol absen hingga data tersimpan:

1. **Frontend (Browser)**
   - User berada di halaman `MahasiswaDashboard.jsx`.
   - User menekan tombol "Absen Masuk".
   - Fungsi di dalam `MahasiswaDashboard.jsx` memanggil library (seperti `fetch` atau `axios`) untuk menembak API backend. Request ini dikirim ke alamat: `POST http://localhost:5000/api/absen` dengan menyertakan *Token* login di header.

2. **Backend Entry (server.js)**
   - Request tiba di `server.js`.
   - Express melihat baris: `app.post("/api/absen", verifyToken, isMahasiswa, wifiKampus, absen);`
   - Express menjalankan 3 **middleware** secara berurutan:
     1. `verifyToken`: Memastikan token login mahasiswa sah.
     2. `isMahasiswa`: Memastikan role di token adalah "mahasiswa".
     3. `wifiKampus`: Mengecek apakah IP yang menembak API sesuai dengan IP Kampus (jika disetel harus via WiFi Kampus).
   - Jika ketiga middleware tersebut sukses (`next()`), barulah diarahkan ke fungsi utama `absen` (di dalam `server/routes/auth.js`).

3. **Backend Logic & Database (routes & db)**
   - Di dalam fungsi `absen`, backend akan menulis query SQL. Contoh: `INSERT INTO attendance (user_id, status, time) VALUES (...)`.
   - Menggunakan `pool.query(...)` dari `server/config/db.js`, query dikirimkan ke **MySQL**.
   - MySQL menyimpan data dan membalas pesan sukses.

4. **Response ke Frontend**
   - Fungsi backend mengembalikan pesan JSON: `{ success: true, message: "Absen berhasil" }`.
   - Frontend `MahasiswaDashboard.jsx` menerima respon tersebut.
   - Frontend memunculkan popup notifikasi "Absen Berhasil" dan me-refresh tabel riwayat absensi di layar user.

---

## 4. Alur Memulai Aplikasi (Local Development)

Berdasarkan package.json dan server.js, urutan menjalankannya adalah:
1. Menjalankan database MySQL (misal via XAMPP).
2. Membuka terminal pada root folder, jalankan backend: `npm run dev` (atau `npm start`). Ini mengeksekusi `node server/server.js`. Backend menyala di Port 5000.
3. Membuka terminal kedua, masuk ke frontend `cd client`, jalankan frontend: `npm run dev` atau `npm run dev:frontend` dari root. Ini mengeksekusi Vite. Frontend menyala (biasanya di Port 5173).
4. User membuka `http://localhost:5173` di browser.

Demikian alur program aplikasi Absensi PKL BPTI. Setiap request dari client akan melewati *server.js* (routing), divalidasi oleh *middleware*, dieksekusi logikanya (controllers/routes), dan disimpan ke *MySQL* via *db.js*.

---

## 5. Bedah Kode (Deep Dive) Alur Spesifik

Sesuai dengan permintaan Anda, berikut adalah pembedahan kode baris-demi-baris untuk 3 alur spesifik tanpa terkecuali.

### A. Alur Absensi Mahasiswa (Student)
Ketika mahasiswa mengeklik tombol absen, data dikirim ke server. Server melakukan pengecekan ketat (waktu, lokasi, joki) sebelum menyimpannya ke MySQL.

<details>
<summary><b>Lihat Source Code `server/routes/auth.js` (Fungsi Absen)</b></summary>

```javascript
export const absen = async (req, res) => {
  const conn = await pool.getConnection(); // 1. Buka koneksi database
  try {
    const { login_time, deviceId } = req.body;
    const { nama, role, kelompok } = req.user; // Dari token JWT

    // 2. Validasi Anti-Joki (Device Binding)
    const [deviceRows] = await conn.query(
      "SELECT user_name FROM device_bindings WHERE device_id = ? LIMIT 1",
      [deviceId],
    );
    // Jika device ID dari browser tidak ada di database, tolak!
    if (deviceRows.length === 0) {
      return res.status(403).json({ success: false, message: "Device tidak terdaftar" });
    }

    // 3. Validasi Hari Libur
    // Jika hari ini tanggal merah, mahasiswa tidak boleh absen
    const todayWib = new Date().toISOString().slice(0, 10);
    const [holidayRows] = await conn.query(
      "SELECT id, keterangan FROM holidays WHERE tanggal = ? LIMIT 1",
      [todayWib]
    );
    if (holidayRows.length > 0) {
      return res.status(403).json({ success: false, message: "Hari Libur" });
    }

    // 4. Penentuan Sesi (Pagi/Sore) berdasarkan jam
    let sesi;
    const timeInMinutes = hour * 60 + minute; 
    if (timeInMinutes >= 8 * 60 && timeInMinutes <= 10 * 60) sesi = "pagi";
    else if (timeInMinutes >= 15 * 60 && timeInMinutes <= 17 * 60) sesi = "sore";
    else return res.status(403).json({ message: "Di luar waktu absen" });

    // 5. Aturan Absen Sore: Harus ada jeda 6 jam dari absen pagi
    if (sesi === "sore") {
      const [pagiRows] = await conn.query(
        "SELECT login_time FROM attendances WHERE nama = ? AND tanggal = ? AND sesi = 'pagi'",
        [nama, today]
      );
      if (pagiRows.length === 0) return res.status(403).json({ message: "Harus absen pagi dulu" });
      
      const diffHours = (waktuSore - waktuPagi) / 1000 / 3600;
      if (diffHours < 6) return res.status(403).json({ message: "Jeda harus 6 jam" });
    }

    // 6. Simpan ke database jika semua lolos
    await conn.query(
      `INSERT INTO attendances (nama, kelompok, tanggal, sesi, jam_masuk, login_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'hadir')`,
      [nama, kelompok, today, sesi, jamMasuk, loginTime]
    );

    return res.json({ success: true, message: `Absen ${sesi} berhasil` });
  } finally {
    conn.release(); // 7. Tutup koneksi
  }
};
```
</details>

**Penjelasan Alur Absensi:**
- **Baris 8-15**: Server mengecek tabel `device_bindings`. Jika mahasiswa mencoba login dari laptop/HP yang belum pernah didaftarkan (milik temannya), absen akan ditolak.
- **Baris 18-25**: Server mengecek tabel `holidays`. Jika hari ini diset sebagai hari libur oleh Admin, absen tidak bisa dilakukan.
- **Baris 35-43**: Validasi wajib absen pagi. Mahasiswa tidak bisa tiba-tiba absen sore jika pagi bolos. Server juga menghitung selisih waktu (`diffHours`) minimal 6 jam dari absen pagi.

---

### B. Alur Pengaturan Hari Libur oleh Admin
Admin bisa menambahkan tanggal merah melalui dashboard. Jika ditambahkan, semua mahasiswa dilarang absen di hari tersebut.

<details>
<summary><b>Lihat Source Code `server/routes/admin.js` (Fungsi Libur)</b></summary>

```javascript
// POST /api/admin/holidays - Menambahkan hari libur
export const addHoliday = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { tanggal, keterangan } = req.body;
    
    // 1. Cek apakah tanggal tersebut sudah pernah dijadikan hari libur
    const [exist] = await conn.query("SELECT id FROM holidays WHERE tanggal = ?", [tanggal]);
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: "Tanggal libur sudah ada" });
    }

    // 2. Masukkan ke tabel holidays
    const [result] = await conn.query(
      "INSERT INTO holidays (tanggal, keterangan) VALUES (?, ?)",
      [tanggal, keterangan]
    );

    return res.json({ success: true, message: "Tanggal libur ditambahkan" });
  } finally {
    conn.release();
  }
};

// DELETE /api/admin/holidays/:id - Menghapus hari libur
export const deleteHoliday = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params; // Mengambil ID dari URL (/api/admin/holidays/5)
    
    // Hapus baris dari tabel holidays yang ID nya cocok
    await conn.query("DELETE FROM holidays WHERE id = ?", [id]);
    return res.json({ success: true, message: "Libur dihapus" });
  } finally {
    conn.release();
  }
};
```
</details>

**Penjelasan Alur Libur:**
- Admin mengetikkan tanggal (contoh: "2024-08-17") dan keterangan ("Hari Kemerdekaan") di Frontend.
- Frontend mengirimkan request HTTP POST ke `/api/admin/holidays`.
- Di Backend (`admin.js`), fungsi `addHoliday` dijalankan. MySQL mengecek dengan perintah `SELECT` apakah tanggal itu sudah ada. Jika belum, data dimasukkan (`INSERT INTO`).
- Efek domino: Karena tanggal ini kini ada di database `holidays`, fungsi `absen` (di poin A baris 18) akan otomatis menolak absen di tanggal tersebut.

---

### C. Alur Mentor (Penilaian, Tugas Akhir, Sertifikat)
Mentor memiliki Dashboard tersendiri (`MentorDashboard.jsx`) untuk memantau mahasiswa, memberi nilai, dan mengunggah sertifikat kelulusan.

#### 1. Pemberian Nilai (Grades)
Mentor memasukkan nilai di kolom tabel (Frontend). Saat menekan tombol simpan, nilai dikirim ke backend secara kolektif (sebagai kumpulan *array*).

<details>
<summary><b>Lihat Source Code Frontend & Backend Penilaian</b></summary>

**Frontend (`client/src/pages/MentorDashboard.jsx`)**
```jsx
const handleSaveGrades = async (studentNama) => {
  // 1. Mengumpulkan semua nilai dari kotak input ke dalam bentuk array (daftar)
  const userGrades = gradesForm[studentNama] || {};
  const gradesArray = Object.keys(userGrades).map(indId => ({
    indicator_id: Number(indId),
    student_nama: studentNama,
    nilai: Number(userGrades[indId])
  }));

  // 2. Menembak API backend dengan array nilai tersebut
  await axiosInstance.post('/mentor/grades', { grades: gradesArray });
  alert("Nilai berhasil disimpan!");
};
```

**Backend (`server/routes/mentor.js`)**
```javascript
router.post('/grades', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grades } = req.body; // Menerima array dari frontend
    await conn.beginTransaction(); // Memulai transaksi (agar aman)

    // 3. Melakukan perulangan (loop) untuk menyimpan setiap nilai ke database
    for (const grade of grades) {
      await conn.query(
        `INSERT INTO student_grades (indicator_id, student_nama, nilai) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
        [grade.indicator_id, grade.student_nama, grade.nilai]
      );
    }
    await conn.commit(); // Mengesahkan penyimpanan permanen
    res.json({ success: true, message: 'Nilai disimpan' });
  } catch (error) {
    await conn.rollback(); // Batalkan semua jika ada 1 yang error
  } finally {
    conn.release();
  }
});
```
</details>

**Penjelasan:**
- Fungsi `ON DUPLICATE KEY UPDATE` di SQL sangat penting di sini. Jika mentor sebelumnya sudah memberi nilai "80" lalu mengubahnya jadi "90", SQL tidak akan membuat data ganda, melainkan sekadar menimpa (mengupdate) nilai lama dengan yang baru.
- `beginTransaction` dan `commit`: Memastikan tidak ada data yang masuk separuh. Jika server tiba-tiba mati saat *looping* penyimpanan, semua proses dibatalkan (`rollback`) sehingga data tetap utuh seperti sebelumnya.

#### 2. Sertifikat Kelulusan
Mentor mengunggah file PDF, backend menyimpannya di hardisk (`server/config/storage.js`) dan mencatat jejaknya (URL) di MySQL.

<details>
<summary><b>Lihat Source Code Sertifikat (`server/routes/mentor.js`)</b></summary>

```javascript
// Middleware: certUpload membatasi ukuran maksimal 10MB dan harus berformat PDF
router.post("/certificates", certUpload.single("file"), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const file = req.file; // Menangkap file yang dikirim
    
    // 1. Membuat nama file unik (gabungan jam, teks acak, dan nama asli)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const storagePath = `certificates/${timestamp}_${random}_${file.originalname}`;

    // 2. Menyimpan file fisik ke folder komputer server (uploads/)
    await uploadFile(storagePath, file.buffer, file.mimetype);

    // 3. Mencatat jejak file (alamat/URL nya) di database MySQL
    await conn.query(
      `INSERT INTO certificates (student_nama, mentor_nama, kelompok, file_url, judul, catatan) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.body.student_nama, req.user.nama, req.user.kelompok, storagePath, req.body.judul, req.body.catatan]
    );

    res.json({ success: true, message: "Sertifikat diupload" });
  } finally {
    conn.release();
  }
});
```
</details>

**Penjelasan:**
- File **tidak pernah disimpan di dalam MySQL**. Yang disimpan di database hanyalah kolom `file_url` (contoh: `certificates/169123_abc_sertif.pdf`). File fisiknya dikelola oleh komponen *Storage* lokal. Saat mahasiswa melihat aplikasinya, browser akan memuat file PDF tersebut langsung dari alamat folder `/uploads`.

#### 3. Review Tugas Akhir
Mahasiswa mengupload proposal (yang alurnya persis seperti sertifikat di atas). Mentor lalu bisa mengeklik tombol **Revisi**, **Tolak**, atau **Setujui**.

<details>
<summary><b>Lihat Source Code Review Tugas Akhir (`server/routes/mentor.js`)</b></summary>

```javascript
router.put("/tugas-akhir/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params; // ID tugas akhir
    const { status, catatan_mentor } = req.body; 
    
    // Update tabel tugas_akhir
    await conn.query(
      "UPDATE tugas_akhir SET status = ?, catatan_mentor = ?, reviewed_at = NOW() WHERE id = ?",
      [status, catatan_mentor, id] // status bisa berisi 'approved', 'revision', atau 'rejected'
    );
    
    res.json({ success: true, message: "Status tugas akhir diupdate" });
  } finally {
    conn.release();
  }
});
```
</details>

**Penjelasan:**
- Di Frontend, saat mentor menekan tombol "Revisi", aplikasi mengirimkan string teks `"revision"` dan kolom catatan (yang diketik mentor) ke fungsi `PUT` di atas. Status di database berubah.
- Di Dashboard Mahasiswa, baris kode akan mengecek status ini. Jika berubah menjadi `"revision"`, tampilan UI bagi mahasiswa akan berubah merah dan menampilkan tombol "Kirim Ulang Proposal". 

#### 4. Fitur Tugas Mingguan (Weekly Tasks)
Fitur ini memfasilitasi penugasan berkala per minggu yang dibuat oleh mentor khusus untuk mahasiswa kelompoknya.

**Alur Tugas Mingguan:**
1. **Mentor Membuat Tugas**: Mentor menentukan minggu ke-X, judul, instruksi/deskripsi, tenggat waktu (deadline), dan mengunggah dokumen panduan/modul (opsional) via `POST /api/mentor/tugas-mingguan`.
2. **Mahasiswa Menerima & Mengumpulkan Tugas**: Di dashboard mahasiswa (`/dashboard`), daftar tugas mingguan tampil dengan indikator waktu sisa / status deadline. Mahasiswa mengumpulkan pengerjaan via `POST /api/tugas-mingguan/:id/submit` (dapat berupa file dokumen/zip, link pengerjaan online seperti GitHub/Figma/Drive, dan catatan).
3. **Mentor Mengevaluasi**: Mentor melihat daftar siapa saja yang sudah mengumpulkan (`GET /api/mentor/tugas-mingguan/:id/submissions`), memeriksa file/link tugas, lalu menginput nilai (0-100), feedback/catatan, serta status persetujuan (`approved`, `revision`, `rejected`) via `PUT /api/mentor/tugas-mingguan/submissions/:id`.
4. **Notifikasi & Nilai Mahasiswa**: Mahasiswa secara real-time dapat melihat status persetujuan, nilai skor, dan catatan saran perbaikan dari mentor langsung di card tugas mingguan mereka.

---

## 6. Changelog Perubahan Sistem

### [UPDATE] Fitur Tugas Mingguan & Isolasi Login Portal Mentor
**Tanggal perubahan:** 2026-08-23

#### 1. Fitur Tugas Mingguan (Mahasiswa & Mentor)
- **Database**: Penambahan tabel `tugas_mingguan` (master tugas per kelompok) dan `tugas_mingguan_submissions` (pengumpulan & penilaian mahasiswa).
- **Backend API**:
  - Endpoint Mahasiswa: `GET /api/tugas-mingguan` dan `POST /api/tugas-mingguan/:id/submit`.
  - Endpoint Mentor: CRUD tugas `GET/POST/PUT/DELETE /api/mentor/tugas-mingguan`, list pengumpulan `GET /api/mentor/tugas-mingguan/:id/submissions`, dan evaluasi nilai `PUT /api/mentor/tugas-mingguan/submissions/:id`.
- **Frontend UI**:
  - Mahasiswa Dashboard (`/dashboard`): Menu tab Tugas Mingguan, status deadline, form pengumpulan (upload file, link repository/drive, catatan ringkasan), dan card feedback evaluasi mentor.
  - Mentor Dashboard (`/mentor`): Menu tab Tugas Mingguan, form modal tambah/edit tugas mingguan, panel review pengumpulan mahasiswa, dan modal penilaian skor (0-100) + feedback mentor.

#### 2. Isolasi Login Portal Mentor (`/mentor-login`) & Navigasi Logout
- Login halaman `/absen` sekarang **hanya untuk Mahasiswa dan Admin**. Jika akun dengan role `mentor` mencoba login di `/absen`, sistem akan menolak dan memberikan pesan instruksi untuk login melalui portal khusus `/mentor-login`.
- Di footer halaman `/absen`, ditambahkan link langsung *"Anda seorang Mentor? Login Mentor di sini"*.
- Tombol **Logout** pada Mentor Dashboard (`/mentor`) sekarang mengarahkan kembali ke portal `http://localhost:5000/mentor-login`.
- Rute `/mentor` pada `ProtectedRoute` diatur dengan fallback redirect khusus ke `/mentor-login`.

---

### [UPDATE] Format Upload Tugas Akhir: ZIP → PDF
**Tanggal perubahan:** 2026-07-03

#### Latar Belakang
Sebelumnya, mahasiswa diwajibkan mengupload proposal Tugas Akhir dalam format **ZIP**. Format ini diubah menjadi **PDF** agar:
- File proposal dapat dibuka langsung di browser tanpa perlu diekstrak
- Server sudah mengkonfigurasi PDF untuk ditampilkan *inline* (terbuka di tab baru)
- Mempermudah mentor dalam mereview proposal tanpa perlu download dan ekstrak terlebih dahulu

#### File yang Diubah

**1. Frontend — `client/src/pages/MahasiswaDashboard.jsx` (Form Upload Mahasiswa)**
```jsx
// SEBELUM (baris ~1346-1350):
<label>File Proposal (ZIP) *</label>
<input
  type="file"
  accept=".zip,application/zip,application/x-zip-compressed"
/>

// SESUDAH:
<label>File Proposal (PDF) *</label>
<input
  type="file"
  accept="application/pdf,.pdf"
/>
```
> Atribut `accept` di elemen `<input type="file">` mengontrol filter dialog pemilihan file di browser. Dengan nilai `"application/pdf,.pdf"`, browser hanya menampilkan file berekstensi `.pdf` saat mahasiswa menekan tombol pilih file.

---

**2. Backend — `server/server.js` (Middleware Validasi Upload)**
```javascript
// SEBELUM (tidak ada validasi tipe file):
const taUpload = multer({ storage: multer.memoryStorage() });

// SESUDAH (validasi MIME type + batas ukuran 10MB):
const taUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Maks 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);   // Lolos: izinkan file masuk
    } else {
      cb(new Error("File proposal harus berformat PDF"), false); // Tolak
    }
  },
});
```
> `fileFilter` adalah callback dari library **Multer** yang dijalankan SEBELUM file tersimpan ke memory/disk.
> - `cb(null, true)` → file diterima dan diproses
> - `cb(new Error(...), false)` → file ditolak, server mengirim error 400 ke frontend
> 
> Ini berarti walau ada pengguna yang mencoba "menipu" dengan mengirim file ZIP langsung via API (misal dengan *Postman*), server tetap akan menolaknya karena pengecekan dilakukan di backend, bukan hanya di UI browser.

---

**3. Frontend — `client/src/pages/MentorDashboard.jsx` (Tombol Download Mentor)**
```jsx
// SEBELUM:
<FileCheck className="w-4 h-4" /> Download Proposal ZIP

// SESUDAH:
<FileCheck className="w-4 h-4" /> Download Proposal PDF
```
> Label tombol di halaman mentor diperbarui agar konsisten dan tidak membingungkan.

#### Alur Baru Setelah Perubahan
```
Mahasiswa memilih file .pdf
       ↓
Browser memfilter (hanya tampilkan .pdf)
       ↓
Frontend mengirim FormData ke POST /api/tugas-akhir
       ↓
Multer fileFilter di server.js mengecek mimetype
   → Bukan PDF? → Error 400 "File harus PDF"
   → PDF?       → Lanjut ke fungsi submitTugasAkhir
       ↓
File disimpan di server/uploads/tugas_akhir/
       ↓
Path file disimpan di database tabel tugas_akhir
       ↓
Mentor buka tab "Tugas Akhir" → klik "Download Proposal PDF"
       ↓
Browser membuka PDF langsung secara inline (tab baru)
```

---

### [FITUR BARU] Hapus Pengajuan Tugas Akhir oleh Mentor
**Tanggal:** 2026-07-03

#### Latar Belakang
Sebelumnya mentor hanya bisa mereview dan mengubah status pengajuan (Revisi/Tolak/Setujui), namun tidak bisa menghapus data pengajuan yang sudah tidak relevan atau salah kirim. Fitur hapus ditambahkan agar mentor dapat membersihkan data.

#### File yang Diubah

**1. Backend — `server/routes/mentor.js` (Route Baru)**
```javascript
// DELETE /api/mentor/tugas-akhir/:id
router.delete("/tugas-akhir/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;         // ID TA dari URL
    const mentorNama = req.user.nama;  // Dari JWT token (siapa yang login)

    // KEAMANAN: Pastikan TA ini memang milik mentor yang sedang login
    // Jika mentor A mencoba hapus data kelompok B → ditolak 404
    const [rows] = await conn.query(
      "SELECT id, judul, student_nama FROM tugas_akhir WHERE id = ? AND mentor_nama = ? LIMIT 1",
      [id, mentorNama]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Tidak ditemukan atau akses ditolak" });
    }

    // Hapus dari database
    await conn.query("DELETE FROM tugas_akhir WHERE id = ?", [id]);
    res.json({ success: true, message: "Pengajuan berhasil dihapus" });
  } finally {
    conn.release();
  }
});
```
> **Keamanan penting:** Sebelum menghapus, server mengecek kolom `mentor_nama` di tabel `tugas_akhir`. Ini memastikan seorang mentor tidak bisa menghapus data milik kelompok mentor lain, meskipun mereka mengetahui ID-nya.

**2. Frontend — `client/src/pages/MentorDashboard.jsx`**
```jsx
// Fungsi baru handleDeleteTA (ditambahkan setelah handleUpdateTA)
const handleDeleteTA = async (id, judul) => {
  // Tampilkan dialog konfirmasi sebelum benar-benar menghapus
  if (!window.confirm(`Hapus "${judul}"? Tidak bisa dibatalkan.`)) return;

  const res = await axiosInstance.delete(`/mentor/tugas-akhir/${id}`);
  if (res.data.success) {
    alert("✅ Berhasil dihapus!");
    fetchTugasAkhir(); // Refresh daftar
  }
};

// Tombol hapus baru di UI (di samping tombol "Review & Update Status")
<button
  onClick={() => handleDeleteTA(ta.id, ta.judul)}
  className="... bg-red-500/20 text-red-300 ..."
>
  <Trash2 className="w-3.5 h-3.5" /> Hapus
</button>
```

#### Alur Hapus Tugas Akhir
```
Mentor klik tombol merah "Hapus" pada kartu TA
       ↓
browser.confirm() → Dialog "Yakin hapus?"
   → Batal? → Tidak ada yang terjadi
   → OK?    → Lanjut
       ↓
DELETE /api/mentor/tugas-akhir/{id}  (dengan JWT token)
       ↓
Backend cek: apakah TA ini mentor_nama = nama mentor yang login?
   → Tidak cocok → Error 404 "Akses ditolak"
   → Cocok       → DELETE FROM tugas_akhir WHERE id = ?
       ↓
Frontend: alert sukses → fetchTugasAkhir() → daftar diperbarui
```

---

### [BUGFIX] Perbaikan Warna Teks pada Modal Ajukan Izin
**Tanggal:** 2026-07-06

#### Akar Masalah
Pada Dashboard Mahasiswa (`client/src/pages/MahasiswaDashboard.jsx`), saat menekan tombol "Ajukan Izin", modal yang muncul menggunakan background putih (`bg-white`). Namun, komponen-komponen di dalam modal tersebut menggunakan style Tailwind yang ditujukan untuk tema gelap (misalnya `text-white`, `bg-white/10`), sehingga menyebabkan teks putih di atas background putih yang membuatnya tidak terbaca ("invisible").

#### File yang Diperbaiki
**Frontend — `client/src/pages/MahasiswaDashboard.jsx` (Modal Izin)**
- **Judul Modal**: `text-white/50` diubah menjadi `text-gray-900`
- **Tombol Close (X)**: Diubah menjadi `text-gray-400 hover:text-gray-600`
- **Label Keterangan**: Diubah menjadi `text-gray-700`
- **Textarea Input**: Diubah dari `bg-white/10 text-white placeholder-white/50` menjadi `bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-300` agar teks hitam terlihat jelas di atas background form yang putih keabu-abuan.

Alur program tidak ada yang berubah. Perubahan ini murni penyesuaian kelas Tailwind (CSS) agar UI sesuai dengan hierarki warna.

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

## 7. Deep Dive: Analisis Kode Baris-demi-Baris (Line-by-Line)

Berikut adalah penjelasan detail *line-by-line* untuk 3 fitur paling krusial pada aplikasi ini:

### A. Alur Absensi Student (`server/routes/auth.js`)
Ketika mahasiswa menekan tombol "Absen", *request* masuk ke fungsi `absen` di backend.

```javascript
export const absen = async (req, res) => {
  const conn = await pool.getConnection(); // Baris 1: Meminta 1 slot koneksi ke database MySQL dari Connection Pool
  try {
    const { login_time, deviceId } = req.body; // Baris 3: Mengekstrak waktu lokal HP dan ID perangkat unik (Device Binding) yang dikirim frontend
    const nama = req.user.nama; // Baris 4: Mengambil nama mahasiswa dari token JWT yang sudah divalidasi oleh middleware
    
    // -- VALIDASI 1: PENGECEKAN HARI LIBUR --
    const [holidayRows] = await conn.query("SELECT keterangan FROM holidays WHERE tanggal = ?", [todayDate]); 
    // Baris 7: Query MySQL mencari apakah tanggal hari ini terdaftar di tabel holidays.
    if (holidayRows.length > 0) { 
      // Baris 9: Jika array tidak kosong (berarti hari libur ditemukan)
      return res.status(403).json({ message: "Hari ini adalah hari libur..." }); // Tolak akses dengan kode 403 (Forbidden)
    }

    // -- VALIDASI 2: DEVICE BINDING --
    const [deviceRows] = await conn.query("SELECT id FROM device_bindings WHERE user_name = ? AND device_id = ?", [nama, deviceId]);
    // Baris 14: Mengecek tabel device_bindings. Apakah ID perangkat yang dipakai ini terdaftar sebagai milik nama mahasiswa ini?
    if (deviceRows.length === 0) {
      // Jika kosong, berarti mahasiswa mencoba absen menggunakan perangkat milik orang lain
      return res.status(403).json({ message: "Perangkat ini belum terdaftar untuk absen" }); 
    }

    // -- VALIDASI 3: PENENTUAN SESI DAN WAKTU (PAGI / SORE) --
    let sesi = "pagi";
    // Program menghitung 'timeInMinutes' (Waktu Absen dalam hitungan menit sejak jam 00:00). 
    // Contoh: Jam 08:30 = (8 * 60) + 30 = 510 menit.
    
    if (timeInMinutes >= 900 && timeInMinutes <= 1080) { // Antara 15:00 - 18:00
      sesi = "sore";
      // Jika sore, server wajib mengecek apakah orang ini SUDAH absen pagi
      const [pagiRows] = await conn.query("SELECT login_time FROM attendances WHERE nama=? AND tanggal=? AND sesi='pagi'", [nama, todayWib]);
      if (pagiRows.length === 0) {
         return res.status(403).json({ message: "Harus sudah absen pagi sebelum absen sore" }); // Tolak jika belum absen pagi
      }
      
      // -- VALIDASI JEDA 6 JAM --
      // Selisih antara absen pagi dan absen sore dihitung. Jika < 6 jam, tolak. (Mencegah absen pagi jam 11:59, lalu absen sore jam 12:00)
    }

    // -- EKSEKUSI: PENYIMPANAN KE DATABASE --
    const [insertRes] = await conn.query(
      "INSERT INTO attendances (nama, tanggal, waktu, status, sesi, log_time) VALUES (?, ?, ?, ?, ?, ?)",
      [nama, todayWib, jamMasuk, 'hadir', sesi, wibTimestamp]
    );
    // Baris 40: Query INSERT INTO dijalankan. Kolom `status` otomatis diisi 'hadir'. 
    
    return res.json({ success: true, message: `Absen ${sesi} berhasil tercatat` });
    // Baris 45: Mengembalikan respons JSON sukses ke browser, sehingga UI berubah menjadi hijau (Berhasil).
  } finally {
    conn.release(); // Baris 47: PENTING! Mengembalikan koneksi database ke dalam Pool agar bisa dipakai orang lain.
  }
};
```

---

### B. Alur Pengaturan Libur oleh Admin (`server/routes/admin.js`)
Fitur ini memungkinkan admin untuk menetapkan hari libur merah sehingga semua absensi otomatis tertolak pada hari tersebut.

```javascript
export const addHoliday = async (req, res) => {
  const conn = await pool.getConnection(); // Baris 1: Ambil koneksi DB
  try {
    const { tanggal, keterangan } = req.body; // Baris 3: Menerima tanggal ('YYYY-MM-DD') dan keterangan ('Idul Fitri') dari formulir Admin
    if (!tanggal || !keterangan) {
      return res.status(400).json({ message: "Tanggal dan Keterangan wajib diisi" }); // Baris 5: Validasi agar admin tidak mengirim data kosong
    }
    
    // -- CEK DUPLIKASI --
    const [exist] = await conn.query("SELECT id FROM holidays WHERE tanggal = ?", [tanggal]); 
    // Baris 9: Server men-query MySQL untuk memastikan tanggal yang diinput belum pernah didaftarkan.
    if (exist.length > 0) {
      return res.status(400).json({ message: "Tanggal libur tersebut sudah ada" }); // Tolak jika duplikat
    }

    // -- INSERT DATA --
    const [result] = await conn.query(
      "INSERT INTO holidays (tanggal, keterangan) VALUES (?, ?)",
      [tanggal, keterangan]
    );
    // Baris 15: Data libur dimasukkan ke tabel holidays. 
    // Efek domino: Pada alur Absensi (Bagian A, Baris 7), query SELECT holidays akan bernilai true untuk tanggal ini, memblokir absen.

    const [newHoliday] = await conn.query("SELECT * FROM holidays WHERE id = ?", [result.insertId]);
    // Baris 20: (Opsional) Mengambil kembali data yang baru di-insert untuk dikirim balik ke frontend agar UI langsung meng-update tabel tanpa refresh.

    return res.json({ success: true, message: "Tanggal libur berhasil ditambahkan", data: newHoliday[0] });
  } finally {
    conn.release();
  }
};
```

---

### C. Alur Mentor: Penilaian, Tugas Akhir, & Sertifikat (`server/routes/mentor.js`)

Mentor memiliki peran melakukan aksi bulk (menangani banyak mahasiswa sekaligus).

**1. Penilaian (Grades)**
```javascript
router.post('/grades', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grades } = req.body; 
    // 'grades' adalah array object besar. Contoh: [{student_nama: "Budi", indicator_id: 1, nilai: 90}, ...]
    
    await conn.beginTransaction(); // PENTING! Memulai transaksi SQL. Jika salah satu query gagal, semua operasi dibatalkan (rollback)
    
    for (const grade of grades) { // Loop sebanyak jumlah data nilai
      await conn.query(
        `INSERT INTO student_grades (indicator_id, student_nama, nilai) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
        [grade.indicator_id, grade.student_nama, grade.nilai]
      );
      // Penjelasan 'ON DUPLICATE KEY UPDATE': Ini adalah query sakti MySQL (Upsert). 
      // Jika Budi belum ada nilai indikator 1, buat baris baru (INSERT). 
      // Tapi jika sudah ada nilainya, jangan error, melainkan timpa dengan nilai baru (UPDATE).
    }
    
    await conn.commit(); // Mengesahkan transaksi permanen ke dalam disk database.
    res.json({ success: true, message: "Nilai berhasil disimpan" });
  } ...
});
```

**2. Tugas Akhir (Review Proposal)**
```javascript
router.put('/tugas-akhir/:id/status', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params; // Mendapatkan ID Tugas Akhir dari URL path
    const { status, catatan_mentor } = req.body; // status bisa berisi: 'approved', 'revision', 'rejected'
    
    await conn.query(
      "UPDATE tugas_akhir SET status = ?, catatan_mentor = ? WHERE id = ?",
      [status, catatan_mentor, id]
    );
    // Baris 7: Server hanya melakukan operasi UPDATE sederhana. Ia mengganti tulisan 'pending' di kolom status menjadi 'approved' atau 'revision'.
    // Mahasiswa yang melakukan GET request akan mendapatkan status baru ini dan UI mereka akan berubah (misal tombol Kirim Ulang muncul bila status = 'revision').
    
    res.json({ success: true });
  } ...
});
```

**3. Upload Sertifikat Mahasiswa**
```javascript
router.post('/certificates/upload', certificateUpload.single('file'), async (req, res) => {
  // middleware 'certificateUpload.single' adalah Multer. Ia menangkap file fisik dan menyimpannya ke folder 'server/uploads/certificates/' SEBELUM masuk ke fungsi ini.
  const conn = await pool.getConnection();
  try {
    const file = req.file; // Objek fisik file 
    const { student_nama } = req.body; // Nama mahasiswa penerima sertifikat
    
    const file_url = `/uploads/certificates/${file.filename}`;
    // Baris 7: File tidak dimasukkan dalam format biner BLOB ke MySQL (karena akan lambat).
    // MySQL hanya menyimpan string PATH/URL filenya saja.
    
    await conn.query(
      "INSERT INTO certificates (student_nama, file_url) VALUES (?, ?)",
      [student_nama, file_url]
    );
    
    res.json({ success: true, file_url });
  } ...
});
```
