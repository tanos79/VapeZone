import { query } from "@/lib/db";
import { requireApiAuth, requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { validateProductImage, saveProductImage } from "@/lib/upload";
import { logActivity } from "@/lib/audit";

// GET /api/products — semua user yang login boleh melihat daftar produk.
export async function GET() {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  const rows = await query(
    `SELECT p.id, p.name, p.category_id, c.name AS category, p.sku, p.description,
            p.price, p.stock, p.picture_name, p.product_unit, p.is_available
     FROM products p
     LEFT JOIN product_category c ON c.id = p.category_id
     ORDER BY p.name ASC`
  );
  return Response.json({ products: rows });
}

/**
 * Ambil data produk dari request. Mendukung JSON dan multipart/form-data
 * (multipart dibutuhkan untuk upload foto produk, padanan form aplikasi lama).
 */
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
  // JSON (dipakai pemanggil programatik — tanpa foto).
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

// POST /api/products — hanya admin boleh menambah produk.
export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }

  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const parsed = await parseProductRequest(request);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { name, categoryId, price, stock, description, sku, productUnit, isAvailable } = parsed.data;

  // Upload foto produk (opsional) — padanan blok upload di produk_act.php.
  let pictureName = "default.jpg";
  if (parsed.foto) {
    const check = validateProductImage(parsed.foto);
    if (!check.ok) {
      return Response.json({ error: check.error }, { status: 400 });
    }
    pictureName = await saveProductImage(parsed.foto);
  }

  const rows = await query(
    `INSERT INTO products (name, sku, category_id, product_unit, price, stock, description, picture_name, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, sku || null, categoryId, productUnit, price, stock, description || null, pictureName, isAvailable]
  );

  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "produk_tambah",
    detail: `Tambah produk ${name}`,
  });

  const created = await query("SELECT id, name FROM products WHERE id = ?", [
    rows.insertId,
  ]);
  return Response.json({ product: created[0] }, { status: 201 });
}
