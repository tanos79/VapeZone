import mysql from "mysql2/promise";

// Koneksi database MySQL dibaca dari environment variable (DATABASE_URL).
// Database: vapezone_deni (database toko yang sudah ada).
// Tidak ada kredensial yang ditulis di source code.
const globalForDb = globalThis;

const pool =
  globalForDb.__vapezonePool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    idleTimeout: 30_000,
    decimalNumbers: false, // decimal dibaca sebagai string agar presisi terjaga
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__vapezonePool = pool;
}

/**
 * Jalankan query dengan parameter terikat (placeholder `?`).
 * SEMUA query di aplikasi ini wajib lewat fungsi ini agar bebas SQL Injection:
 * nilai dari user tidak pernah digabung ke string SQL.
 *
 * @returns {Promise<Array>} array of rows
 */
export async function query(text, params = []) {
  const [rows] = await pool.query(text, params);
  return rows;
}

/**
 * Jalankan beberapa query dalam satu transaksi.
 * fn menerima connection dan harus memakai conn.query(...) sendiri.
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/** Kode error MySQL untuk entri duplikat (unique key violation). */
export const ER_DUP_ENTRY = "ER_DUP_ENTRY";
/** Kode error MySQL untuk pelanggaran foreign key (row dipakai tabel lain). */
export const ER_ROW_IS_REFERENCED_2 = "ER_ROW_IS_REFERENCED_2";
