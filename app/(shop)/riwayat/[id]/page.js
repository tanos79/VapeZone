import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ProductImage from "@/components/ProductImage";

// Detail pesanan milik user — port riwayat_detail.php
// (barang dibeli, ongkir, total, info pengiriman, resi, tombol WhatsApp).
export const metadata = { title: "Detail Pesanan — KING VAPEZONE" };

export default async function RiwayatDetailPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  // Pastikan pesanan benar milik user yang login (padanan WHERE user_id).
  const orderRows = await query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?",
    [id, session.userId]
  );
  const order = orderRows[0];
  if (!order) notFound();

  const items = await query(
    `SELECT oi.order_qty, oi.order_price, p.name, p.picture_name
     FROM order_items oi JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id]
  );

  // Data pengiriman JSON (receiver, phone, address, resi).
  let delivery = {};
  try {
    delivery = JSON.parse(order.delivery_data || "{}");
  } catch {
    delivery = {};
  }
  const resi = delivery.resi ?? "-";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/riwayat" className="btn btn-secondary rounded-full !px-3" aria-label="Kembali">
          ←
        </Link>
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-zinc-500">Detail Transaksi</span>
          <h1 className="text-2xl font-bold text-zinc-100">#{order.order_number}</h1>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.order_status} large />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Barang yang dibeli */}
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
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <ProductImage pictureName={item.picture_name} alt={item.name}
                          className="h-12 w-12 rounded-lg bg-zinc-100 object-cover" />
                        <span className="font-semibold text-zinc-200">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3">{rupiah(Number(item.order_price))}</td>
                    <td className="py-3 text-center">{item.order_qty}</td>
                    <td className="py-3 pr-4 text-right font-bold text-zinc-200">
                      {rupiah(Number(item.order_price) * item.order_qty)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-800 bg-zinc-900/40">
                  <td colSpan={3} className="py-3 pl-4 text-right font-bold">Ongkos Kirim (Flat)</td>
                  <td className="py-3 pr-4 text-right font-bold text-zinc-200">{rupiah(25000)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-3 pl-4 text-right text-lg font-bold">Total Bayar</td>
                  <td className="py-3 pr-4 text-right text-lg font-bold text-emerald-400">
                    {rupiah(Number(order.total_price))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Peringatan belum bayar */}
          {order.order_status === "1" && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h6 className="font-bold text-amber-300">Pesanan Belum Dibayar!</h6>
                <p className="text-sm text-zinc-400">Segera lakukan pembayaran agar pesananmu bisa diproses.</p>
              </div>
              <Link href={`/pembayaran/${order.id}`} className="btn btn-primary ml-auto rounded-full px-5 font-bold">
                Bayar Sekarang
              </Link>
            </div>
          )}
        </div>

        {/* Info pengiriman */}
        <div className="space-y-4">
          <div className="card">
            <h6 className="mb-4 border-b border-zinc-800 pb-2 font-bold text-zinc-200">🚚 Info Pengiriman</h6>
            <div className="mb-3">
              <small className="block text-zinc-500">Penerima</small>
              <span className="font-bold text-zinc-200">{delivery.receiver ?? "-"}</span>
            </div>
            <div className="mb-3">
              <small className="block text-zinc-500">Nomor HP</small>
              <span className="font-bold text-zinc-200">{delivery.phone ?? "-"}</span>
            </div>
            <div className="mb-3">
              <small className="block text-zinc-500">Alamat Tujuan</small>
              <span className="font-bold text-zinc-200">{delivery.address ?? "-"}</span>
            </div>

            {resi !== "-" && (
              <div className="mt-4 rounded-xl border border-cyan-900/50 bg-cyan-950/30 p-3">
                <small className="block font-bold uppercase text-cyan-300">Nomor Resi</small>
                <h5 className="mt-1 font-mono text-lg font-bold text-zinc-100">{resi}</h5>
                <small className="text-xs text-zinc-500">Silakan cek di web ekspedisi terkait.</small>
              </div>
            )}
          </div>

          <a
            href={`https://wa.me/6289698494017?text=${encodeURIComponent(`Halo Admin, saya mau tanya pesanan ${order.order_number}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn w-full rounded-full border border-emerald-800 bg-emerald-950/40 py-2 font-bold text-emerald-300 hover:bg-emerald-900/40"
          >
            💬 Hubungi Admin
          </a>
        </div>
      </div>
    </main>
  );
}
