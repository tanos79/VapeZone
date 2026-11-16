import { promises as fs } from "node:fs";
import path from "node:path";
import { query } from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

// GET /api/uploads/bukti/[file] — tampilkan gambar bukti transfer.
// Hanya pemilik pesanan atau admin yang boleh melihat (berbeda dengan PHP
// yang menyimpan file di folder publik); ini lebih aman karena bukti
// pembayaran adalah data pribadi.
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(request, context) {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;
  const session = auth.session;

  const raw = (await context.params).file ?? "";
  const file = path.basename(raw); // cegah path traversal
  if (!/^[A-Za-z0-9._-]+$/.test(file) || file.startsWith(".")) {
    return new Response("File tidak valid", { status: 400 });
  }

  // Cari pemilik pesanan dari tabel payments.
  const rows = await query(
    `SELECT o.user_id FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.picture_name = ?`,
    [file]
  );
  if (rows.length === 0) {
    return new Response("Bukti pembayaran tidak ditemukan", { status: 404 });
  }
  if (session.role !== "admin" && Number(rows[0].user_id) !== session.userId) {
    return new Response("Anda tidak memiliki hak akses", { status: 403 });
  }

  try {
    const buffer = await fs.readFile(path.join(process.cwd(), "uploads", "bukti_transfer", file));
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("File tidak ditemukan", { status: 404 });
  }
}
