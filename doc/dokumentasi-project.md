# Dokumentasi Project

## Struktur Folder Project

Project ini menggunakan struktur monorepo sederhana dengan `npm workspaces`, yang terdiri dari frontend React/Vite dan backend Express/MySQL.

```text
misi-3.0/
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- utils/
|   |-- .env.example
|   `-- package.json
|-- server/
|   |-- config/
|   |-- middleware/
|   |-- routes/
|   |-- scripts/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- doc/
|-- .env.example
|-- .env.production
|-- database_mysql.sql
`-- package.json
```

Keterangan singkat:

- `client/` berisi aplikasi frontend berbasis React dan Vite.
- `server/` berisi API backend berbasis Express.
- `server/config/db.js` mengatur koneksi ke MySQL.
- `database_mysql.sql` adalah file schema atau data awal database.
- `doc/` berisi dokumentasi project.

## package.json Frontend

File frontend berada di `client/package.json`.

```json
{
  "name": "absensi-pkl-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.5",
    "vite": "^6.4.3"
  }
}
```

Penjelasan:

- `vite` dipakai untuk development server dan build frontend.
- `react` dan `react-dom` dipakai sebagai library utama antarmuka.
- `react-router-dom` dipakai untuk routing halaman.
- `axios` dipakai untuk komunikasi ke API backend.
- `tailwindcss`, `postcss`, dan `autoprefixer` dipakai untuk styling.

## package.json Backend

File backend berada di `server/package.json`.

```json
{
  "name": "absensi-pkl-backend",
  "version": "1.0.0",
  "description": "Backend untuk sistem absensi PKL (MySQL)",
  "private": true,
  "type": "module",
  "main": "server.js",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js",
    "seed": "node scripts/seedDatabase.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.1.1",
    "mysql2": "^3.11.0"
  }
}
```

Penjelasan:

- `express` dipakai untuk membuat server API.
- `mysql2` dipakai untuk koneksi ke database MySQL.
- `dotenv` dipakai untuk membaca file environment.
- `jsonwebtoken` dan `bcryptjs` dipakai untuk autentikasi dan keamanan password.
- `multer` dipakai untuk upload file.
- `seed` dipakai untuk menjalankan data awal database jika dibutuhkan.

## File Environment

Project ini memiliki beberapa file environment:

### 1. Root `.env.example`

Digunakan untuk konfigurasi backend utama dari root project.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pkl
JWT_SECRET=change-me-to-a-random-secret-at-least-32-characters
PORT=5000
NODE_ENV=development
BYPASS_WIFI_CHECK=true
```

Fungsi variabel utama:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` untuk koneksi database.
- `JWT_SECRET` untuk token autentikasi.
- `PORT` untuk port backend.
- `NODE_ENV` untuk mode environment.
- `BYPASS_WIFI_CHECK` untuk mempermudah testing di lokal.

### 2. `server/.env.example`

Isinya serupa dengan root environment, dan bisa dipakai sebagai fallback konfigurasi server jika dibutuhkan.

### 3. `client/.env.example`

Digunakan untuk frontend.

```env
VITE_API_URL=http://localhost:5000/api
VITE_BYPASS_TIME_CHECK=true
VITE_BYPASS_PAGI_ONLY=false
```

Fungsi variabel utama:

- `VITE_API_URL` adalah base URL API backend.
- `VITE_BYPASS_TIME_CHECK` untuk bypass validasi waktu saat development.
- `VITE_BYPASS_PAGI_ONLY` untuk bypass aturan waktu pagi.

### 4. `.env.production`

Digunakan untuk environment production.

```env
NODE_ENV=production
BYPASS_WIFI_CHECK=false
```

Catatan:

- Pada production, frontend diarahkan menggunakan relative path `/api`.
- Validasi WiFi tidak dibypass.

## Database yang Dipakai

Database yang digunakan adalah **MySQL** atau **MariaDB**, umumnya dijalankan melalui **XAMPP**.

Informasi database berdasarkan konfigurasi project:

- Host: `localhost`
- Port: `3306`
- User default: `root`
- Password default: kosong
- Nama database default: `pkl`

File yang terkait:

- `server/config/db.js` untuk konfigurasi koneksi pool MySQL.
- `database_mysql.sql` untuk import schema atau data awal database.

Langkah database secara umum:

1. Jalankan MySQL dari XAMPP.
2. Buat database dengan nama `pkl`.
3. Import file `database_mysql.sql` ke database tersebut.

## Cara Menjalankan Secara Lokal

Project ini sekarang menggunakan `npm workspaces`, jadi instalasi dependency cukup dilakukan dari root project.

### 1. Persiapan

Pastikan sudah terpasang:

- Node.js versi `>= 20`
- npm versi `>= 9`
- MySQL atau XAMPP

### 2. Install dependency

Jalankan dari root project:

```bash
npm install
```

### 3. Siapkan environment

- Copy `.env.example` menjadi `.env` di root project, lalu sesuaikan nilainya.
- Jika frontend perlu environment sendiri, sesuaikan berdasarkan `client/.env.example`.

### 4. Siapkan database

```text
- Nyalakan MySQL
- Buat database pkl
- Import database_mysql.sql
```

Jika perlu data awal:

```bash
npm run seed
```

### 5. Jalankan project

Ada dua cara menjalankan aplikasi secara lokal.

#### Opsi A. Jalankan backend saja

```bash
npm run dev
```

atau:

```bash
npm run dev:server
```

Catatan:

- Backend berjalan di `http://localhost:5000`
- Jika folder `client/dist` sudah ada, backend juga bisa menyajikan frontend hasil build

#### Opsi B. Jalankan backend dan frontend untuk development

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:client
```

Catatan:

- Frontend Vite biasanya berjalan di `http://localhost:5173`
- Backend API biasanya berjalan di `http://localhost:5000`
- Mode ini direkomendasikan saat aktif mengembangkan frontend karena mendukung hot reload

### 6. Build frontend

```bash
npm run build
```

Hasil build frontend akan masuk ke folder `client/dist`.

### 7. Menjalankan mode hasil build

```bash
npm start
```

Perintah ini menjalankan backend, dan backend akan menyajikan frontend statis dari `client/dist` jika folder build sudah tersedia.
