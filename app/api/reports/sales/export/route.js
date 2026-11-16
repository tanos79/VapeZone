import { query } from "@/lib/db";
import { requireApiAuth, requireApiAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { logActivity } from "@/lib/audit";

// GET /api/reports/sales/export?from=YYYY-MM-DD&to=YYYY-MM-DD
// Ekspor rekap penjualan ke CSV (admin saja).
export async function GET(request) {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("from") || "")
    ? url.searchParams.get("from")
    : today.slice(0, 8) + "01";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("to") || "")
    ? url.searchParams.get("to")
    : today;

  const rows = await query(
    `SELECT p.name AS produk, s.quantity, s.unit_price, s.total, s.created_at, u.username
     FROM sales s
     JOIN products p ON p.id = s.product_id
     JOIN users u ON u.id = s.user_id
     WHERE DATE(s.created_at) BETWEEN ? AND ?
     ORDER BY s.created_at ASC`,
    [from, to]
  );

  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "laporan_ekspor",
    detail: `Ekspor CSV ${from} s/d ${to}`,
  });

  const fmtRupiah = (n) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

  const csv = toCsv(
    [
      { key: "created_at", label: "Tanggal" },
      { key: "produk", label: "Produk" },
      { key: "username", label: "Kasir" },
      { key: "quantity", label: "Jumlah" },
      { key: "unit_price", label: "Harga Satuan" },
      { key: "total", label: "Total" },
    ],
    rows.map((r) => ({
      ...r,
      created_at: new Date(r.created_at).toLocaleString("id-ID"),
      unit_price: fmtRupiah(r.unit_price),
      total: fmtRupiah(r.total),
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-penjualan-${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
