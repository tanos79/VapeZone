import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import PembayaranClient from "@/components/PembayaranClient";

// Halaman bayar — port pembayaran.php (hanya pesanan milik user, status '1').
export const metadata = { title: "Konfirmasi Pembayaran — KING VAPEZONE" };

export default async function PembayaranPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await query(
    "SELECT id, order_number, total_price, order_status FROM orders WHERE id = ? AND user_id = ?",
    [id, session.userId]
  );
  const order = rows[0];
  if (!order) notFound();

  // Padanan PHP: pesanan tidak valid atau sudah dibayar → kembali ke riwayat.
  if (order.order_status !== "1") {
    redirect("/riwayat");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="card overflow-hidden !p-0">
        <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4">
          <h1 className="font-bold text-zinc-100">💳 Konfirmasi Pembayaran</h1>
          <small className="text-zinc-500">Invoice: {order.order_number}</small>
        </div>
        <div className="p-6">
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-blue-900/50 bg-blue-950/30 px-4 py-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <small className="block font-bold text-blue-300">Total Tagihan:</small>
              <span className="text-xl font-bold text-zinc-100">{rupiah(Number(order.total_price))}</span>
            </div>
          </div>

          <PembayaranClient orderId={order.id} totalTagihan={rupiah(Number(order.total_price))} />

          <Link href="/riwayat" className="mt-4 block text-center text-sm text-zinc-500 hover:text-emerald-400">
            ← Kembali ke riwayat
          </Link>
        </div>
      </div>
    </main>
  );
}
