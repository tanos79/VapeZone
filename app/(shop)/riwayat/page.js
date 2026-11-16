import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah, tanggal } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// Riwayat pesanan — port riwayat.php (pesanan milik user yang login).
export const metadata = { title: "Riwayat Pesanan — KING VAPEZONE" };

export default async function RiwayatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = await query(
    "SELECT id, order_number, order_date, total_price, order_status FROM orders WHERE user_id = ? ORDER BY id DESC",
    [session.userId]
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">Riwayat Pesanan Saya</h1>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="py-3 pl-4">No. Invoice</th>
              <th className="py-3">Tanggal</th>
              <th className="py-3">Total Belanja</th>
              <th className="py-3 text-center">Status</th>
              <th className="py-3 pr-4 text-right">Opsi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-zinc-800">
                <td className="py-3 pl-4 font-mono font-bold text-zinc-200">#{o.order_number}</td>
                <td className="py-3 text-zinc-400">{tanggal(o.order_date)}</td>
                <td className="py-3 font-bold text-zinc-200">{rupiah(Number(o.total_price))}</td>
                <td className="py-3 text-center">
                  <StatusBadge status={o.order_status} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/riwayat/${o.id}`} className="btn btn-secondary !px-3 !py-1.5 text-xs">Detail</Link>
                    {o.order_status === "1" && (
                      <Link href={`/pembayaran/${o.id}`} className="btn btn-primary !px-3 !py-1.5 text-xs font-bold">Bayar</Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-zinc-500">Belum ada transaksi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
