import { promises as fs } from "node:fs";
import path from "node:path";

// ==================== Validasi & penyimpanan upload gambar ====================
// Padanan validasi upload di aplikasi lama (produk: JPG/JPEG/PNG/WEBP
// maksimal 2MB; bukti transfer: JPG/PNG maksimal 2MB — lihat rutenya).
// Nama file diacak berbasis waktu agar tidak menimpa file lain.

export const PRODUCT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
export const PRODUCT_ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

/** Bersihkan nama file dari karakter berbahaya & path traversal. */
export function sanitizeFileName(name) {
  return path.basename(name).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
}

/**
 * Validasi file gambar produk.
 * @returns {{ ok: true, ext: string } | { ok: false, error: string }}
 */
export function validateProductImage(bukti) {
  const ext = sanitizeFileName(bukti.name).split(".").pop()?.toLowerCase() ?? "";
  if (!PRODUCT_ALLOWED_EXT.includes(ext)) {
    return { ok: false, error: "GAGAL UPLOAD! Format foto harus JPG, JPEG, PNG, atau WEBP." };
  }
  if (bukti.size > PRODUCT_MAX_SIZE) {
    return { ok: false, error: "GAGAL UPLOAD! Ukuran foto terlalu besar. Maksimal 2MB." };
  }
  return { ok: true, ext };
}

/**
 * Simpan file gambar ke public/img/products dan kembalikan nama file barunya.
 * Nama lama TIDAK dihapus saat diganti — file bisa dipakai bersama produk
 * lain (berbeda dengan aplikasi PHP yang unlink foto lama).
 */
export async function saveProductImage(file) {
  const filename = `${Date.now()}_${sanitizeFileName(file.name)}`;
  const dir = path.join(process.cwd(), "public", "img", "products");
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);
  return filename;
}
