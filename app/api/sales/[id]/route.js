import { query, withTransaction } from "@/lib/db";
import { requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

// DELETE /api/sales/[id] — hanya admin; stok produk dikembalikan.
export async function DELETE(request, context) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    await withTransaction(async (conn) => {
      // Ambil data transaksi dulu, baru hapus, lalu kembalikan stok.
      const [rows] = await conn.query(
        "SELECT product_id, quantity FROM sales WHERE id = ?",
        [id]
      );
      if (rows.length === 0) {
        const err = new Error("Transaksi tidak ditemukan");
        err.status = 404;
        throw err;
      }
      await conn.query("DELETE FROM sales WHERE id = ?", [id]);
      await conn.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [rows[0].quantity, rows[0].product_id]
      );
      await logActivity({
        userId: auth.session.userId,
        username: auth.session.username,
        action: "penjualan_hapus",
        detail: `Hapus transaksi #${id} (stok dikembalikan ${rows[0].quantity})`,
      });
    });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.status) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
