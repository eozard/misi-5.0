/*
 * ============================================================================
 * STORAGE HELPER - LOCAL FILESYSTEM
 * ============================================================================
 * Wrapper untuk upload/hapus file PDF di disk lokal (pengganti Supabase Storage).
 *
 * STRUKTUR FOLDER:
 *   <UPLOAD_ROOT>/pendaftaran/<pendaftar_id>/<tipe>_<timestamp>_<random>_<name>.pdf
 *
 * PENGGUNAAN:
 *   - uploadFile(path, buffer, mimetype)
 *   - deleteFile(path)
 *   - getPublicUrl(path) -> return URL yang di-serve oleh Express
 *
 * UPLOAD_ROOT bisa di-override lewat env: UPLOAD_ROOT (default: ./uploads)
 * File bisa diakses publik via /uploads/... (di-serve dari server.js)
 * ============================================================================
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.resolve(
  __dirname,
  "..",
  process.env.UPLOAD_ROOT || "uploads",
);
const PENDAFTARAN_DIR = path.join(UPLOAD_ROOT, "pendaftaran");

export const BUCKET_NAME = "pendaftaran";

const ensureDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
};

const stripUploadRoot = (absPath) => {
  // Return relative path dari UPLOAD_ROOT, contoh: "pendaftaran/1/cv_x.pdf"
  const rel = path.relative(UPLOAD_ROOT, absPath).split(path.sep).join("/");
  return rel;
};

/**
 * Upload file ke disk lokal.
 * @param {string} storagePath  Path relatif di dalam bucket, contoh "1/cv_xxx.pdf"
 * @param {Buffer} buffer
 * @param {string} mimetype
 */
export const uploadFile = async (storagePath, buffer, mimetype = "application/pdf") => {
  try {
    const absPath = path.join(UPLOAD_ROOT, storagePath);
    await ensureDir(path.dirname(absPath));
    await fs.writeFile(absPath, buffer);
    return { ok: true, path: storagePath };
  } catch (err) {
    console.error("Local storage upload error:", err);
    return { ok: false, error: err };
  }
};

/**
 * Hapus file dari disk lokal berdasarkan storage path.
 */
export const deleteFile = async (storagePath) => {
  try {
    if (!storagePath) return { ok: true };
    const absPath = path.join(UPLOAD_ROOT, storagePath);
    await fs.unlink(absPath);
    return { ok: true };
  } catch (err) {
    if (err.code === "ENOENT") {
      // File tidak ada, anggap sukses
      return { ok: true };
    }
    console.error("Local storage delete error:", err);
    return { ok: false, error: err };
  }
};

/**
 * Ambil URL publik untuk file. URL ini di-serve oleh Express (lihat server.js)
 * dengan route /uploads/*.
 */
export const getPublicUrl = (storagePath) => {
  if (!storagePath) return null;
  // Normalize path separator untuk URL
  const cleanPath = storagePath.split(path.sep).join("/");
  return `/uploads/${cleanPath}`;
};

/**
 * Kembalikan path absolut di disk (untuk streaming / proxy dari server).
 */
export const getAbsolutePath = (storagePath) => {
  if (!storagePath) return null;
  return path.join(UPLOAD_ROOT, storagePath);
};

export { UPLOAD_ROOT, PENDAFTARAN_DIR, ensureDir, stripUploadRoot };
