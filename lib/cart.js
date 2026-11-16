import { cookies } from "next/headers";

// ==================== Keranjang belanja (port dari session PHP) ====================
// Aplikasi lama menyimpan keranjang di $_SESSION['keranjang'] berbentuk
// { id_produk: jumlah }. Di Next.js, keranjang disimpan di cookie agar
// bisa dibaca komponen server dan tetap ada antar permintaan tanpa DB.
// Isi cookie HANYA id produk + jumlah; harga & stok selalu divalidasi
// ulang ke database saat menambah item maupun checkout (tidak dipercaya
// dari klien).

export const CART_COOKIE = "vz_cart";
export const CART_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

/** Opsi cookie keranjang. HttpOnly: hanya diubah lewat API, bukan JS. */
export function cartCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_SECONDS,
  };
}

/**
 * Baca isi keranjang dari cookie.
 * @returns {Promise<Object>} { [productId]: qty } (nilai tervalidasi tipe)
 */
export async function readCart() {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const cart = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      const qty = Number(value);
      if (Number.isInteger(id) && id > 0 && Number.isInteger(qty) && qty > 0 && qty <= 999) {
        cart[id] = qty;
      }
    }
    return cart;
  } catch {
    return {};
  }
}

/** Total jumlah barang (untuk badge ikon keranjang di navbar). */
export async function cartCount() {
  const cart = await readCart();
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

/**
 * Ambil detail produk di keranjang dari database (harga & stok asli).
 * @returns {Promise<Array>} baris produk yang ada di keranjang
 */
export async function cartProducts(cart) {
  const ids = Object.keys(cart).map(Number);
  if (ids.length === 0) return [];
  const { query } = await import("@/lib/db");
  const placeholders = ids.map(() => "?").join(",");
  return query(
    `SELECT id, name, sku, price, stock, picture_name, product_unit
     FROM products WHERE id IN (${placeholders}) AND is_available = 1`,
    ids
  );
}
