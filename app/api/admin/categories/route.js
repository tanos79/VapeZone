import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

// ==================== Master kategori produk (port master_act.php: add/edit/del_kategori) ====================
// Hapus ditolak bila kategori masih dipakai produk (cek products.category_id),
// dengan pesan sama seperti aplikasi lama.

function validName(name) {
  return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 50;
}

/** POST /api/admin/categories — tambah kategori. */
export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!validName(body.name)) {
    return NextResponse.json({ error: "Nama kategori minimal 2 karakter" }, { status: 400 });
  }
  const name = body.name.trim();

  await query("INSERT INTO product_category (name) VALUES (?)", [name]);
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "kategori_tambah",
    detail: `Kategori "${name}" ditambahkan`,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** PUT /api/admin/categories — ubah nama kategori. */
export async function PUT(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0 || !validName(body.name)) {
    return NextResponse.json({ error: "Data kategori tidak valid" }, { status: 400 });
  }
  const name = body.name.trim();

  const result = await query("UPDATE product_category SET name = ? WHERE id = ?", [name, id]);
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "kategori_edit",
    detail: `Kategori #${id} → "${name}"`,
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/categories?id= — hapus kategori (ditolak bila dipakai produk). */
export async function DELETE(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID kategori tidak valid" }, { status: 400 });
  }

  // Cek dulu: apakah kategori ini dipakai di tabel products?
  const used = await query("SELECT id FROM products WHERE category_id = ? LIMIT 1", [id]);
  if (used.length > 0) {
    return NextResponse.json(
      {
        error:
          "GAGAL HAPUS! Kategori ini sedang digunakan oleh produk. Silakan ganti kategori produk terkait terlebih dahulu.",
      },
      { status: 409 }
    );
  }

  const result = await query("DELETE FROM product_category WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "kategori_hapus",
    detail: `Kategori #${id} dihapus`,
  });
  return NextResponse.json({ ok: true });
}
