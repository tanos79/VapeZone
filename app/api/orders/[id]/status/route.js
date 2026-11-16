import { NextResponse } from "next/server";
import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

// ==================== Update status pesanan (port pesanan_act.php) ====================
// - Status '4' (dikirim): nomor resi wajib, disimpan ke dalam JSON delivery_data.
// - Status '6' (dibatalkan): stok produk dikembalikan HANYA SEKALI
//   (dicek status sebelumnya supaya tidak dobel saat refresh).
// - Status lain: update biasa.

const statusSchema = z.object({
  status: z.enum(["1", "2", "3", "4", "5", "6"], { message: "Status tidak valid" }),
  resi: z.string().trim().max(100).optional().default(""),
});

/** POST /api/orders/[id]/status — admin ubah status pesanan. */
export async function POST(request, context) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;
  const session = auth.session;

  const orderId = Number((await context.params).id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "ID pesanan tidak valid" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { status, resi } = parsed.data;

  const rows = await query("SELECT id, order_number, order_status, delivery_data FROM orders WHERE id = ?", [orderId]);
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  try {
    if (status === "4") {
      // Padanan PHP: resi wajib saat status "Dikirim".
      if (!resi) {
        return NextResponse.json({ error: "Nomor resi wajib diisi untuk status Dikirim!" }, { status: 400 });
      }
      let delivery = {};
      try {
        delivery = JSON.parse(order.delivery_data || "{}");
        if (typeof delivery !== "object" || delivery === null || Array.isArray(delivery)) delivery = {};
      } catch {
        delivery = {};
      }
      delivery.resi = resi;
      await query("UPDATE orders SET order_status = ?, delivery_data = ? WHERE id = ?", [
        status,
        JSON.stringify(delivery),
        orderId,
      ]);
    } else if (status === "6") {
      // Padanan PHP: restock hanya bila status sebelumnya BUKAN '6' (anti dobel).
      if (order.order_status !== "6") {
        await withTransaction(async (conn) => {
          const [items] = await conn.query("SELECT product_id, order_qty FROM order_items WHERE order_id = ?", [orderId]);
          for (const item of items) {
            await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.order_qty, item.product_id]);
          }
          await conn.query("UPDATE orders SET order_status = '6' WHERE id = ?", [orderId]);
        });
      } else {
        await query("UPDATE orders SET order_status = '6' WHERE id = ?", [orderId]);
      }
    } else {
      await query("UPDATE orders SET order_status = ? WHERE id = ?", [status, orderId]);
    }

    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "pesanan_status",
      detail: `Pesanan ${order.order_number} → status ${status}${status === "4" ? ` (resi ${resi})` : ""}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update status error:", err);
    return NextResponse.json({ error: "Gagal memperbarui status pesanan" }, { status: 500 });
  }
}
