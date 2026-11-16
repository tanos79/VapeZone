import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { rupiah, tanggal } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import OrderManageClient from "@/components/OrderManageClient";

// Detail pesanan admin — port admin/pesanan_detail.php:
// info customer, data pengiriman (JSON), rincian item, bukti pembayaran, form update status.
export const metadata = { title: "Detail Pesanan — VapeZone" };

export default async function OrderDetailPage({ params }) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const rows = await query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [id]
  );
  const order = rows[0];
  if (!order) notFound();

  const [items, payments] = await Promise.all([
    query(
      `SELECT oi.order_qty, oi.order_price, p.name, p.picture_name
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    ),
    query("SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1", [id]),
  ]);
  const payment = payments[0];

  // JSON pengiriman: receiver, phone, address, resi.
  let delivery = {};
  try {
    delivery = JSON.parse(order.delivery_data || "{}");
    if (typeof delivery !== "object" || delivery === null) delivery = {};
  } catch {
    delivery = {};
  }
  const resi = delivery.resi ?? "-";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/orders" className="btn btn-secondary rounded-full !px-3" aria-label="Kembali">
          ←
        </Link>
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-zinc-500">Detail Pesanan</span>
          <h1 className="text-2xl font-bold">#{order.order_number}</h1>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.order_status} large />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Info customer + pengiriman */}
          <div className="card">
            <h6 className="mb-4 border-b border-zinc-800 pb-2 font-bold text-zinc-200">🚚 Informasi Pengiriman</h6>
            <div className="mb-3">
              <small className="block text-zinc-500">Customer</small>
              <span className="font-bold text-zinc-200">{order.customer_name}</span>
              <small className="ml-2 text-zinc-500">({order.customer_email})</small>
            </div>
            <div className="mb-3">
              <small className="block text-zinc-500">Penerima</small>
              <span className="font-bold text-zinc-200">{delivery.receiver ?? "-"}</span>
            </div>
            <div className="mb-3">
              <small className="block text-zinc-500">No. HP</small>
              <span className="font-bold text-zinc-200">{delivery.phone ?? "-"}</span>
            </div>
            <div className="mb-3">
              <small className="block text-zinc-500">Alamat Lengkap</small>
              <span className="font-bold text-zinc-200">{delivery.address ?? "-"}</span>
            </div>

            {resi !== "-" && (
              <div className="mt-4 rounded-xl border border-cyan-900/50 bg-cyan-950/30 p-3">
                <small className="block font-bold uppercase text-cyan-300">Nomor Resi Pengiriman</small>
                <h4 className="mt-1 font-mono text-lg font-bold">{resi}</h4>
              </div>
            )}
          </div>

          {/* Rincian barang */}
          <div className="card overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-3 pl-4">Produk</th>
                  <th className="py-3">Harga</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 pr-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t border-zinc-800">
                    <td className="py-3 pl-4 font-medium text-zinc-200">{item.name}</td>
                    <td className="py-3">{rupiah(Number(item.order_price))}</td>
                    <td className="py-3 text-center">{item.order_qty}</td>
                    <td className="py-3 pr-4 text-right font-bold text-zinc-200">
                      {rupiah(Number(item.order_price) * item.order_qty)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-800 bg-zinc-900/40">
                  <td colSpan={3} className="py-3 pl-4 text-right font-bold">Total ({order.total_items} item)</td>
                  <td className="py-3 pr-4 text-right text-lg font-bold text-emerald-400">
                    {rupiah(Number(order.total_price))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom kanan: bukti bayar + form status */}
        <div className="space-y-6">
          <div className="card">
            <h6 className="mb-4 border-b border-zinc-800 pb-2 font-bold text-zinc-200">🧾 Bukti Pembayaran</h6>
            {payment ? (
              <>
                <p className="mb-2 text-xs text-zinc-500">
                  Diupload: {tanggal(payment.payment_date, true)}
                </p>
                <a href={`/api/uploads/bukti/${payment.picture_name}`} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- gambar bukti transfer via API privat */}
                  <img
                    src={`/api/uploads/bukti/${payment.picture_name}`}
                    alt="Bukti Transfer"
                    className="mb-3 w-full rounded-lg border border-zinc-800"
                  />
                </a>
                <a href={`/api/uploads/bukti/${payment.picture_name}`} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary w-full rounded-full text-sm">
                  🔍 Lihat Full
                </a>
                <div className="mt-3 grid gap-1 text-xs text-zinc-400">
                  <span>Pengirim: <b className="text-zinc-200">{payment.name}</b></span>
                  <span>Bank: <b className="text-zinc-200">{payment.bank}</b></span>
                  <span>Jumlah: <b className="text-zinc-200">{rupiah(Number(payment.amount))}</b></span>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-zinc-500">
                <div className="mb-2 text-4xl opacity-50">🖼️</div>
                <p className="text-sm">Belum ada bukti pembayaran.</p>
              </div>
            )}
          </div>

          <OrderManageClient
            orderId={order.id}
            currentStatus={order.order_status}
            currentResi={resi}
          />
        </div>
      </div>
    </>
  );
}
