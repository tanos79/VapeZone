import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import ReportsFilter from "@/components/ReportsFilter";

export const metadata = { title: "Laporan — VapeZone" };

export default async function ReportsPage({ searchParams }) {
  const session = await getSession();
  const isAdmin = session.role === "admin";

  // filter tanggal dari query param (?from=&to=), dengan default bulan ini
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params?.from || "") ? params.from : today.slice(0, 8) + "01";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params?.to || "") ? params.to : today;

  const [rekap, summary] = await Promise.all([
    query(
      `SELECT p.name AS produk, SUM(s.quantity) AS qty, SUM(s.total) AS omzet
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE DATE(s.created_at) BETWEEN ? AND ?
       GROUP BY p.id, p.name
       ORDER BY omzet DESC`,
      [from, to]
    ),
    query(
      `SELECT COALESCE(SUM(total), 0) AS omzet, COUNT(*) AS transaksi
       FROM sales
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [from, to]
    ),
  ]);

  const s = summary[0];

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Laporan Penjualan</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Rekap penjualan per produk periode {from} s/d {to}.
      </p>

      <ReportsFilter from={from} to={to} isAdmin={isAdmin} />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-zinc-400">Omzet Periode</p>
          <p className="mt-1 text-lg font-semibold text-emerald-400">{rupiah(Number(s.omzet))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-zinc-400">Jumlah Transaksi</p>
          <p className="mt-1 text-lg font-semibold">{Number(s.transaksi)} transaksi</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="pb-2">Produk</th>
              <th className="pb-2">Terjual</th>
              <th className="pb-2">Omzet</th>
            </tr>
          </thead>
          <tbody>
            {rekap.map((r) => (
              <tr key={r.produk} className="border-t border-zinc-800">
                <td className="py-2 text-zinc-200">{r.produk}</td>
                <td className="py-2">{Number(r.qty)} pcs</td>
                <td className="py-2 text-emerald-400">{rupiah(Number(r.omzet))}</td>
              </tr>
            ))}
            {rekap.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-zinc-500">
                  Tidak ada penjualan pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
