# Sistem Absensi PKL dan Pendaftaran (MySQL/XAMPP Version)

Aplikasi full-stack untuk mengelola absensi PKL, izin, logbook harian, dan pendaftaran peserta. Backend menggunakan Express.js + MySQL (XAMPP/phpMyAdmin), frontend menggunakan React + Vite + Tailwind CSS.

## Fitur Utama

- Login berbasis JWT untuk admin, mahasiswa, dan anak SMK.
- Device binding berbasis fingerprint browser untuk membatasi perangkat user.
- Validasi absensi dari jaringan kampus dengan whitelist IP `103.209.9.*` (bisa di-bypass untuk development lokal).
- Absensi sesi pagi dan sore dengan aturan waktu, anti-duplikat, dan jeda minimal.
- Pengajuan izin oleh mahasiswa, lengkap dengan status approval admin.
- Logbook harian mahasiswa dengan status draft/submitted.
- Dashboard admin untuk statistik, user, device, laporan absensi, izin, dan logbook.
- Form pendaftaran publik dengan upload PDF CV, transkrip, dan surat persetujuan.
- Dashboard admin pendaftaran untuk assign divisi dan mengelola akun admin pendaftaran.
- **Database**: MySQL/MariaDB lokal (XAMPP/phpMyAdmin).
- **Storage**: file PDF disimpan di folder lokal `server/uploads/pendaftaran/`.

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
│   ├── scripts/         # seed script
│   ├── package.json
│   └── server.js
├── database_mysql.sql   # Schema MySQL (import ke phpMyAdmin)
├── package.json
└── README.md
```

## Halaman Aplikasi

- `/` - landing page.
- `/absen` - login user absensi.
- `/dashboard` - dashboard mahasiswa/anak SMK.
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
| Sample mahasiswa      | `mahasiswa01` | `mahasiswa123`|
| Sample anak SMK       | `smk01`       | `smk123`      |

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
