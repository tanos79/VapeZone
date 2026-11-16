import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { assertSameOrigin } from "@/lib/auth";
import { readCart, CART_COOKIE, cartCookieOptions } from "@/lib/cart";

// ==================== API keranjang (port keranjang_act.php & hapus_keranjang.php) ====================
// Keranjang disimpan di cookie; validasi stok dilakukan DI SERVER dengan
// menghitung jumlah yang sudah ada di keranjang — sama seperti logika
// "PENCEGAHAN MINUS" aplikasi lama.

const addSchema = z.object({
  productId: z.coerce.number().int().positive("Produk tidak valid"),
  qty: z.coerce.number().int().min(1, "Jumlah minimal 1").max(999, "Jumlah terlalu besar").default(1),
});

/** POST /api/cart — tambah produk ke keranjang (dengan validasi stok).
 *  Tidak wajib login — sama seperti aplikasi lama (keranjang = session). */
export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }

  const parsed = addSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { productId, qty } = parsed.data;

  // Stok asli dari database (tidak dipercaya dari klien).
  const rows = await query("SELECT id, name, stock FROM products WHERE id = ? AND is_available = 1", [productId]);
  const product = rows[0];
  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan / tidak tersedia" }, { status: 404 });
  }

  const cart = await readCart();
  const qtyDiKeranjang = cart[productId] ?? 0;
  const totalAkanDibeli = qtyDiKeranjang + qty;
  if (totalAkanDibeli > Number(product.stock)) {
    return NextResponse.json(
      {
        error: `Stok tidak cukup! Stok tersedia: ${product.stock}, di keranjang kamu: ${qtyDiKeranjang}.`,
      },
      { status: 409 }
    );
  }

  cart[productId] = totalAkanDibeli;

  const response = NextResponse.json({ ok: true, cart });
  response.cookies.set(CART_COOKIE, JSON.stringify(cart), cartCookieOptions());
  return response;
}

/** DELETE /api/cart — hapus satu item dari keranjang (?productId= atau body). */
export async function DELETE(request) {
  let productId;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    productId = Number(body.productId);
  } else {
    productId = Number(new URL(request.url).searchParams.get("productId"));
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "ID produk tidak valid" }, { status: 400 });
  }

  const cart = await readCart();
  delete cart[productId];

  const response = NextResponse.json({ ok: true, cart });
  response.cookies.set(CART_COOKIE, JSON.stringify(cart), cartCookieOptions());
  return response;
}
