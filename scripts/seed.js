/**
 * Menyiapkan database vapezone_deni (MySQL) untuk aplikasi Next.js:
 * membuat tabel sales & activity_logs bila belum ada (idempotent).
 *
 * Akun user/admin TIDAK dibuat oleh skrip ini — aplikasi memakai akun
 * yang sudah ada di database toko (password bcrypt dari aplikasi PHP lama,
 * tetap valid dan bisa dipakai login di aplikasi baru).
 *
 * Cara pakai: npm run seed
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi nilainya."
  );
  process.exit(1);
}

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, multipleStatements: true });

async function main() {
  const schema = readFileSync(
    path.join(process.cwd(), "db", "schema-mysql.sql"),
    "utf8"
  );
  await pool.query(schema);
  console.log("✓ Tabel sales & activity_logs siap");

  const [rows] = await pool.query(
    "SELECT COUNT(*) AS n FROM products WHERE is_available = 1"
  );
  console.log(`• Produk tersedia di database: ${rows[0].n}`);
  console.log("Selesai. Gunakan akun existing (admin/customer) untuk login.");
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
