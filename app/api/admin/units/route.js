import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

// ==================== Master satuan produk (port master_act.php: add/edit/del_satuan) ====================
// Catatan penting dari aplikasi lama: tabel products menyimpan NAMA satuan
// (bukan id), jadi pengecekan pemakaian saat hapus memakai nama satuan.

function validName(name) {
  return typeof name === "string" && name.trim().length >= 1 && name.trim().length <= 32;
}

/** POST /api/admin/units — tambah satuan. */
export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!validName(body.name)) {
    return NextResponse.json({ error: "Nama satuan tidak valid (maks 32 karakter)" }, { status: 400 });
  }
  const name = body.name.trim();

  await query("INSERT INTO product_units (name) VALUES (?)", [name]);
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "satuan_tambah",
    detail: `Satuan "${name}" ditambahkan`,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** PUT /api/admin/units — ubah nama satuan (padanan edit_satuan: id kosong diabaikan). */
export async function PUT(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0 || !validName(body.name)) {
    return NextResponse.json({ error: "Data satuan tidak valid" }, { status: 400 });
  }
  const name = body.name.trim();

  const result = await query("UPDATE product_units SET name = ? WHERE id = ?", [name, id]);
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Satuan tidak ditemukan" }, { status: 404 });
  }
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "satuan_edit",
    detail: `Satuan #${id} → "${name}"`,
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/units?id= — hapus satuan (ditolak bila namanya dipakai produk). */
export async function DELETE(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID satuan tidak valid" }, { status: 400 });
  }

  // Langkah 1: ambil NAMA satuan (products menyimpan nama, bukan id).
  const rows = await query("SELECT name FROM product_units WHERE id = ?", [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Satuan tidak ditemukan" }, { status: 404 });
  }
  const namaSatuan = rows[0].name;

  // Langkah 2: cek pemakaian nama satuan di tabel products.
  const used = await query("SELECT id FROM products WHERE product_unit = ? LIMIT 1", [namaSatuan]);
  if (used.length > 0) {
    return NextResponse.json(
      { error: "GAGAL HAPUS! Satuan ini sedang digunakan oleh produk. Ganti dulu satuan pada produk terkait." },
      { status: 409 }
    );
  }

  await query("DELETE FROM product_units WHERE id = ?", [id]);
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "satuan_hapus",
    detail: `Satuan "${namaSatuan}" dihapus`,
  });
  return NextResponse.json({ ok: true });
}
