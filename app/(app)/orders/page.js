import Link from "next/link";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah, tanggal } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// Manajemen pesanan — port admin/pesanan.php.
// Filter tab status (?status=) sama seperti nav-pills aplikasi lama.
export const metadata = { title: "Pesanan — VapeZone" };

const TABS = [
  { value: "all", label: "Semua" },
  { value: "1", label: "Belum Bayar" },
  { value: "2", label: "Perlu Cek" },
  { value: "3", label: "Diproses" },
  { value: "4", label: "Dikirim" },
  { value: "5", label: "Selesai" },
  { value: "6", label: "Dibatalkan" },
];

export default async function OrdersPage({ searchParams }) {
  const params = await searchParams;
  const status = TABS.some((t) => t.value === params?.status) ? params.status : "all";

  const sql =
    `SELECT o.id, o.order_number, o.order_date, o.total_price, o.total_items,
            o.order_status, u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON o.user_id = u.id` +
    (status === "all" ? "" : " WHERE o.order_status = ?") +
    " ORDER BY o.id DESC";
  const orders = await query(sql, status === "all" ? [] : [status]);

  // Jumlah pesanan per status (untuk badge di tab).
  const counts = await query(
    "SELECT order_status, COUNT(*) AS jumlah FROM orders GROUP BY order_status"
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.order_status, c.jumlah]));

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Manajemen Pesanan</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Pesanan dari toko online. Ubah status pada halaman detail pesanan.
      </p>

      {/* Tab filter status */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/orders" : `/orders?status=${tab.value}`}
              className={`badge rounded-full border px-3 py-1.5 text-xs font-bold ${
                active
                  ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-700"
              }`}
            >
              {tab.label}
              {tab.value !== "all" && countMap[tab.value] ? ` (${countMap[tab.value]})` : ""}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="py-3 pl-4">No. Invoice</th>
              <th className="py-3">Customer</th>
              <th className="py-3">Tanggal</th>
              <th className="py-3 text-center">Item</th>
              <th className="py-3">Total</th>
              <th className="py-3 text-center">Status</th>
              <th className="py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                <td className="py-3 pl-4 font-mono font-bold text-zinc-200">#{o.order_number}</td>
                <td className="py-3">
                  <span className="font-medium text-zinc-200">{o.customer_name}</span>
                  <br />
                  <small className="text-zinc-500">{o.customer_email}</small>
                </td>
                <td className="py-3 text-zinc-400">{tanggal(o.order_date, true)}</td>
                <td className="py-3 text-center">{o.total_items}</td>
                <td className="py-3 font-bold text-zinc-200">{rupiah(Number(o.total_price))}</td>
                <td className="py-3 text-center">
                  <StatusBadge status={o.order_status} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <Link href={`/orders/${o.id}`} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                    Kelola →
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-zinc-500">
                  Tidak ada pesanan pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
