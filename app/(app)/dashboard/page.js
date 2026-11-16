import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";

export const metadata = { title: "Dashboard — VapeZone" };

/** Grafik batang sederhana berbasis SVG (tanpa dependensi eksternal). */
function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const width = 700;
  const height = 180;
  const gap = 6;
  const barWidth = data.length ? (width - gap * (data.length - 1)) / data.length : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img"
      aria-label="Grafik penjualan 14 hari terakhir">
      {data.map((d, i) => {
        const h = Math.round((d.revenue / max) * (height - 24));
        return (
          <g key={d.day}>
            <rect
              x={i * (barWidth + gap)}
              y={height - h}
              width={barWidth}
              height={h}
              rx="3"
              className="fill-emerald-500"
            >
              <title>{`${d.day}: ${rupiah(d.revenue)}`}</title>
            </rect>
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="fill-zinc-500 text-[9px]"
            >
              {d.day.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await getSession();

  const [summary, daily, topProducts, lowStock] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total END), 0) AS revenue_today,
         COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END), 0) AS tx_today,
         COALESCE(SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN total END), 0) AS revenue_month,
         COUNT(*) AS tx_total
       FROM sales`
    ),
    query(
      `SELECT DATE(created_at) AS day, SUM(total) AS revenue
       FROM sales
       WHERE created_at >= NOW() - INTERVAL 13 DAY
       GROUP BY DATE(created_at) ORDER BY day ASC`
    ),
    query(
      `SELECT p.name, SUM(s.quantity) AS qty, SUM(s.total) AS revenue
       FROM sales s JOIN products p ON p.id = s.product_id
       GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5`
    ),
    query(
      `SELECT name, stock FROM products WHERE stock <= 5 AND is_available = 1 ORDER BY stock ASC LIMIT 6`
    ),
  ]);

  const s = summary[0];
  const isAdmin = session.role === "admin";

  // Isi hari yang tidak ada penjualan dengan 0 agar grafik konsisten.
  const dailyMap = new Map(daily.map((r) => [String(r.day), Number(r.revenue)]));
  // eslint-disable-next-line react-hooks/purity -- server component dirender per request; tanggal "sekarang" memang berubah
  const now = Date.now();
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    chartData.push({ day: key, revenue: dailyMap.get(key) ?? 0 });
  }

  const cards = [
    { label: "Penjualan Hari Ini", value: rupiah(Number(s.revenue_today)) },
    { label: "Transaksi Hari Ini", value: `${Number(s.tx_today)} transaksi` },
    { label: "Omzet Bulan Ini", value: rupiah(Number(s.revenue_month)) },
    { label: "Total Transaksi", value: `${Number(s.tx_total)} transaksi` },
  ];

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Selamat datang, {session.name}! Ringkasan penjualan toko.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-zinc-400">{c.label}</p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Penjualan 14 Hari Terakhir
          </h2>
          <BarChart data={chartData} />
        </div>
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">⚠️ Stok Menipis</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500">Semua stok aman (lebih dari 5).</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{p.name}</span>
                  <span className="badge bg-amber-950/60 text-amber-300">sisa {p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Produk Terlaris</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada penjualan.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="pb-2">Produk</th>
                  <th className="pb-2">Terjual</th>
                  <th className="pb-2">Omzet</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name} className="border-t border-zinc-800">
                    <td className="py-2 text-zinc-200">{p.name}</td>
                    <td className="py-2">{Number(p.qty)} pcs</td>
                    <td className="py-2 text-emerald-400">{rupiah(Number(p.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
