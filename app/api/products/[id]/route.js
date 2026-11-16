import { query, ER_ROW_IS_REFERENCED_2 } from "@/lib/db";
import { requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { validateProductImage, saveProductImage } from "@/lib/upload";
import { logActivity } from "@/lib/audit";

async function parseId(context) {
  // params di Next.js adalah Promise
  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/** Ambil data produk dari request JSON atau multipart (dengan foto). */
async function parseProductRequest(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return { ok: false, error: "Data tidak valid" };
    const values = Object.fromEntries(form.entries());
    const foto = form.get("foto");
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }
    return { ok: true, data: parsed.data, foto: foto instanceof File && foto.size > 0 ? foto : null };
  }
  let raw;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, error: "Body harus berupa JSON atau form-data yang valid" };
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  return { ok: true, data: parsed.data, foto: null };
}

// PUT /api/products/[id] — hanya admin.
export async function PUT(request, context) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = await parseId(context);
  if (!id) return Response.json({ error: "ID tidak valid" }, { status: 400 });

  const parsed = await parseProductRequest(request);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { name, categoryId, price, stock, description, sku, productUnit, isAvailable } = parsed.data;

  // Foto baru (opsional). Padanan produk_act.php: picture_name diganti bila
  // ada foto baru. Berbeda dengan PHP, file lama TIDAK dihapus karena
  // bisa dipakai produk lain (cek dulu namanya di tabel sebelum menimpa).
  let pictureName = null;
  if (parsed.foto) {
    const check = validateProductImage(parsed.foto);
    if (!check.ok) {
      return Response.json({ error: check.error }, { status: 400 });
    }
    const current = await query("SELECT picture_name FROM products WHERE id = ?", [id]);
    if (current.length === 0) {
      return Response.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    // Jangan timpa gambar default/bersama: hanya simpan nama baru.
    pictureName = await saveProductImage(parsed.foto);
  }

  const result = await query(
    `UPDATE products
     SET name = ?, category_id = ?, product_unit = ?, sku = ?, price = ?, stock = ?,
         description = ?, is_available = ?${pictureName ? ", picture_name = ?" : ""}
     WHERE id = ?`,
    pictureName
      ? [name, categoryId, productUnit, sku || null, price, stock, description || null, isAvailable, pictureName, id]
      : [name, categoryId, productUnit, sku || null, price, stock, description || null, isAvailable, id]
  );

  if (result.affectedRows === 0) {
    return Response.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "produk_ubah",
    detail: `Ubah produk #${id} (${name})${pictureName ? " + ganti foto" : ""}`,
  });

  const rows = await query(
    "SELECT id, name, category_id, product_unit, sku, price, stock, description, picture_name, is_available FROM products WHERE id = ?",
    [id]
  );
  return Response.json({ product: rows[0] });
}

// DELETE /api/products/[id] — hanya admin.
export async function DELETE(request, context) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = await parseId(context);
  if (!id) return Response.json({ error: "ID tidak valid" }, { status: 400 });

  try {
    const rows = await query(
      "SELECT id, name FROM products WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return Response.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    await query("DELETE FROM products WHERE id = ?", [id]);
    await logActivity({
      userId: auth.session.userId,
      username: auth.session.username,
      action: "produk_hapus",
      detail: `Hapus produk #${id} (${rows[0].name})`,
    });
    return Response.json({ ok: true });
  } catch (err) {
    // ER_ROW_IS_REFERENCED_2 = foreign key violation: produk punya riwayat penjualan.
    if (err && err.code === ER_ROW_IS_REFERENCED_2) {
      return Response.json(
        { error: "Produk sudah memiliki riwayat penjualan dan tidak bisa dihapus" },
        { status: 409 }
      );
    }
    throw err;
  }
}
