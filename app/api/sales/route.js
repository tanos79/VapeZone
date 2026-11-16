import { query, withTransaction } from "@/lib/db";
import { requireApiAuth, assertSameOrigin } from "@/lib/auth";
import { saleSchema, parseBody } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

// GET /api/sales — semua user yang login melihat riwayat penjualan.
export async function GET() {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  const rows = await query(
    `SELECT s.id, s.quantity, s.unit_price, s.total, s.created_at,
            p.name AS product_name, u.username AS cashier
     FROM sales s
     JOIN products p ON p.id = s.product_id
     JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC
     LIMIT 100`
  );
  return Response.json({ sales: rows });
}

// POST /api/sales — semua user yang login (admin & customer) boleh mencatat penjualan.
export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  const parsed = await parseBody(request, saleSchema);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { productId, quantity } = parsed.data;

  try {
    const sale = await withTransaction(async (conn) => {
      // FOR UPDATE mengunci baris produk agar stok tidak berkurang ganda
      // ketika dua transaksi terjadi bersamaan (race condition).
      const [productRows] = await conn.query(
        "SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE",
        [productId]
      );
      const product = productRows[0];
      if (!product) {
        const err = new Error("Produk tidak ditemukan");
        err.status = 404;
        throw err;
      }
      if (product.stock < quantity) {
        const err = new Error(`Stok tidak cukup (sisa ${product.stock})`);
        err.status = 409;
        throw err;
      }

      const unitPrice = Math.round(Number(product.price));
      const total = unitPrice * quantity;

      await conn.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [quantity, productId]
      );

      const [saleRows] = await conn.query(
        `INSERT INTO sales (user_id, product_id, quantity, unit_price, total)
         VALUES (?, ?, ?, ?, ?)`,
        [auth.session.userId, productId, quantity, unitPrice, total]
      );
      return {
        id: saleRows.insertId,
        quantity,
        unit_price: unitPrice,
        total,
        product_name: product.name,
      };
    });

    await logActivity({
      userId: auth.session.userId,
      username: auth.session.username,
      action: "penjualan_baru",
      detail: `Jual ${sale.quantity}x ${sale.product_name} (total Rp ${sale.total})`,
    });

    return Response.json({ sale }, { status: 201 });
  } catch (err) {
    if (err.status) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Sale error:", err);
    return Response.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
