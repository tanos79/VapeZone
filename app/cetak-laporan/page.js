import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import PrintTrigger from "@/components/PrintTrigger";

// Halaman cetak laporan — port admin/cetak_laporan.php.
// Halaman ini di luar route group agar bersih tanpa sidebar/navbar,
// lalu otomatis membuka dialog print (lihat PrintTrigger).
export const metadata = { title: "Cetak Laporan — VapeZone" };

const NAMA_BULAN = {
  1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
  7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember",
};

export default async function CetakLaporanPage({ searchParams }) {
  await requireAdminPage();

  const params = await searchParams;
  const bulan = NAMA_BULAN[Number(params?.bulan)] ? Number(params.bulan) : null;
  const tahun = /^\d{4}$/.test(params?.tahun || "") ? Number(params.tahun) : null;

  if (!bulan || !tahun) {
    return (
      <main className="p-10 text-center">
        <p className="text-zinc-400">Parameter laporan tidak valid.</p>
        <Link href="/laporan" className="btn btn-secondary mt-4 rounded-full">← Kembali ke Laporan</Link>
      </main>
    );
  }

  const orders = await query(
    `SELECT o.order_number, o.order_date, o.total_price, o.total_items,
            u.name AS customer_name
     FROM orders o JOIN users u ON o.user_id = u.id
     WHERE o.order_status = '5'
       AND MONTH(o.order_date) = ? AND YEAR(o.order_date) = ?
     ORDER BY o.order_date DESC`,
    [bulan, tahun]
  );
  const totalOmzet = orders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const tanggalCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-zinc-900">
      <PrintTrigger />

      <div className="print:border-0 print:shadow-none">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide">KING VAPEZONE</h1>
          <p className="text-sm text-zinc-500">
            Jl. Raya Susukan, Ciawigebang, Kab. Kuningan — WA 0857-0784-3132
          </p>
        </div>
        <hr className="mb-6" />

        <h2 className="mb-1 text-lg font-bold">LAPORAN PENJUALAN BULANAN</h2>
        <p className="mb-6 text-sm text-zinc-600">
          Periode: {NAMA_BULAN[bulan]} {tahun} — hanya pesanan berstatus <b>Selesai</b>
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-zinc-800 text-left">
              <th className="py-2">No</th>
              <th className="py-2">Invoice</th>
              <th className="py-2">Tanggal</th>
              <th className="py-2">Pelanggan</th>
              <th className="py-2 text-center">Jml Item</th>
              <th className="py-2 text-right">Total Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i} className="border-b border-zinc-200">
                <td className="py-2">{i + 1}</td>
                <td className="py-2 font-mono">#{o.order_number}</td>
                <td className="py-2">
                  {new Date(o.order_date).toLocaleDateString("id-ID")}
                </td>
                <td className="py-2">{o.customer_name}</td>
                <td className="py-2 text-center">{o.total_items}</td>
                <td className="py-2 text-right">{rupiah(Number(o.total_price))}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-500">
                  Tidak ada data penjualan pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="py-3 text-right font-bold">TOTAL PENDAPATAN</td>
              <td className="py-3 text-right font-bold">{rupiah(totalOmzet)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Tanda tangan — padanan blok "Kuningan, tanggal ... Administrator" */}
        <div className="mt-12 flex justify-end">
          <div className="w-48 text-center">
            <p className="mb-16">Kuningan, {tanggalCetak}</p>
            <p className="font-bold underline">Administrator</p>
          </div>
        </div>
      </div>
    </main>
  );
}
