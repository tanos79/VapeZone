import { NextResponse } from "next/server";
import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { requireApiAuth, assertSameOrigin } from "@/lib/auth";
import { readCart, cartProducts, CART_COOKIE, cartCookieOptions } from "@/lib/cart";
import { logActivity } from "@/lib/audit";

// ==================== Checkout (port checkout_act.php) ====================
// Membuat pesanan dari keranjang: hitung total dari harga DB (bukan klien),
// tambah ongkir flat, simpan orders + order_items, kurangi stok,
// update data alamat customer, lalu kosongkan keranjang. Semua dalam
// satu transaksi agar stok tidak bisa berkurang ganda.

export const ONGKIR = 25000;

const checkoutSchema = z.object({
  receiverName: z.string().trim().min(2, "Nama penerima minimal 2 karakter").max(100),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^0\d{7,15}$/, "Nomor HP harus diawali 0 dan 8-16 digit"),
  address: z.string().trim().min(5, "Alamat terlalu pendek").max(255),
  paymentMethod: z.enum(["1", "2"], { message: "Metode pembayaran tidak valid" }),
});

/** POST /api/orders — buat pesanan dari isi keranjang. */
export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;
  const session = auth.session;

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { receiverName, phoneNumber, address, paymentMethod } = parsed.data;

  // Validasi keranjang tidak boleh kosong.
  const cart = await readCart();
  const products = await cartProducts(cart);
  if (products.length === 0) {
    return NextResponse.json({ error: "Keranjang kosong!" }, { status: 400 });
  }

  // Validasi stok & hitung total dari harga database.
  for (const p of products) {
    const qty = cart[p.id];
    if (Number(p.stock) < qty) {
      return NextResponse.json(
        { error: `Stok "${p.name}" tidak cukup! Sisa ${p.stock}.` },
        { status: 409 }
      );
    }
  }

  const totalPrice = products.reduce((sum, p) => sum + Number(p.price) * cart[p.id], 0) + ONGKIR;
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const orderNumber = `TRX${Math.floor(Date.now() / 1000)}`; // format sama: 'TRX' + unix time
  const deliveryData = JSON.stringify({
    receiver: receiverName,
    phone: phoneNumber,
    address,
  });

  try {
    const orderId = await withTransaction(async (conn) => {
      // Buat pesanan (status '1' = menunggu pembayaran).
      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, order_number, order_status, order_date, total_price, total_items, payment_method, delivery_data)
         VALUES (?, ?, '1', NOW(), ?, ?, ?, ?)`,
        [session.userId, orderNumber, totalPrice, totalItems, Number(paymentMethod), deliveryData]
      );
      const orderId = orderResult.insertId;

      // Simpan item + kurangi stok (idempoten terhadap race dengan FOR UPDATE).
      for (const p of products) {
        const qty = cart[p.id];
        await conn.query(
          "INSERT INTO order_items (order_id, product_id, order_qty, order_price) VALUES (?, ?, ?, ?)",
          [orderId, p.id, qty, p.price]
        );
        await conn.query(
          "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [qty, p.id, qty]
        );
      }
      return orderId;
    });

    // Update alamat & no HP customer (padanan UPDATE customers di PHP).
    await query(
      "UPDATE customers SET address = ?, phone_number = ? WHERE user_id = ?",
      [address, phoneNumber, session.userId]
    );

    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "checkout",
      detail: `Pesanan ${orderNumber} (total Rp ${totalPrice})`,
    });

    // Kosongkan keranjang (padanan unset($_SESSION['keranjang'])).
    const response = NextResponse.json({ ok: true, id: orderId, orderNumber }, { status: 201 });
    response.cookies.set(CART_COOKIE, "{}", cartCookieOptions());
    return response;
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
