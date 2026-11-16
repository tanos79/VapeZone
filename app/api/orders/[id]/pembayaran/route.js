import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { query, withTransaction } from "@/lib/db";
import { requireApiAuth, assertSameOrigin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

// ==================== Upload bukti pembayaran (port pembayaran_act.php) ====================
// Validasi: pesanan milik user yang login, status masih '1' (belum dibayar),
// file hanya JPG/PNG maksimal 2MB. Setelah upload: insert tabel payments
// (payment_status '1' = menunggu konfirmasi admin) dan order jadi status '2'.

const MAX_SIZE = 2 * 1024 * 1024; // 2MB, sama seperti PHP
const ALLOWED_EXT = ["jpg", "jpeg", "png"];

/** Bersihkan nama file dari karakter berbahaya & path traversal. */
function sanitizeName(name) {
  return path.basename(name).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
}

/** POST /api/orders/[id]/pembayaran — kirim bukti transfer (multipart). */
export async function POST(request, context) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;
  const session = auth.session;

  const orderId = Number((await context.params).id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "ID pesanan tidak valid" }, { status: 400 });
  }

  // Pesanan harus milik user ini dan masih menunggu pembayaran.
  const rows = await query(
    "SELECT id, order_number, total_price, order_status FROM orders WHERE id = ? AND user_id = ?",
    [orderId, session.userId]
  );
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }
  if (order.order_status !== "1") {
    return NextResponse.json(
      { error: "Pesanan tidak valid atau sudah dibayar!" },
      { status: 409 }
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const nama = String(form.get("nama") ?? "").trim();
  const bank = String(form.get("bank") ?? "").trim();
  const bukti = form.get("bukti");

  if (nama.length < 2 || nama.length > 100) {
    return NextResponse.json({ error: "Nama pengirim tidak valid" }, { status: 400 });
  }
  if (!bank || bank.length > 50) {
    return NextResponse.json({ error: "Bank asal tidak valid" }, { status: 400 });
  }
  if (!(bukti instanceof File) || bukti.size === 0) {
    return NextResponse.json({ error: "Bukti transfer wajib diupload" }, { status: 400 });
  }

  // Validasi ekstensi (hanya JPG/JPEG/PNG) — sama seperti PHP.
  const ext = sanitizeName(bukti.name).split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { error: "GAGAL UPLOAD! Format file tidak didukung. Mohon hanya upload file gambar (JPG/PNG)." },
      { status: 400 }
    );
  }
  // Validasi ukuran maksimal 2MB.
  if (bukti.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "GAGAL UPLOAD! Ukuran foto terlalu besar. Maksimal 2MB." },
      { status: 400 }
    );
  }

  // Nama file unik: rand_acak-namafile (sama pola dengan PHP).
  const filename = `${Date.now()}_${sanitizeName(bukti.name)}`;
  const uploadDir = path.join(process.cwd(), "uploads", "bukti_transfer");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await bukti.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  // Simpan ke payments + update status pesanan dalam satu transaksi.
  try {
    await withTransaction(async (conn) => {
      await conn.query(
        `INSERT INTO payments (order_id, name, bank, amount, payment_date, picture_name, payment_status)
         VALUES (?, ?, ?, ?, NOW(), ?, '1')`,
        [orderId, nama, bank, Number(order.total_price), filename]
      );
      await conn.query("UPDATE orders SET order_status = '2' WHERE id = ?", [orderId]);
    });

    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "pembayaran_upload",
      detail: `Bukti pembayaran pesanan ${order.order_number} dikirim`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Pembayaran error:", err);
    return NextResponse.json({ error: "Gagal menyimpan pembayaran" }, { status: 500 });
  }
}
