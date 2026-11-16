import { query } from "./db";

/**
 * Catat aktivitas user ke tabel activity_logs.
 * Nilai diinsert sebagai parameter (bukan string SQL) sehingga aman.
 */
export async function logActivity({ userId = null, username = "-", action, detail = "", ip = "-" }) {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, username, action, detail, ip)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, username, action, detail, ip]
    );
  } catch (err) {
    // Logging tidak boleh menggagalkan request utama.
    console.error("Gagal mencatat log aktivitas:", err.message);
  }
}
