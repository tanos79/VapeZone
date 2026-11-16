import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { rupiah } from "@/lib/format";

// Laporan penjualan bulanan — port admin/laporan.php.
// Hanya pesanan status '5' (selesai) yang dihitung, memakai MONTH()/YEAR().
export const metadata = { title: "Laporan Bulanan — VapeZone" };

const NAMA_BULAN = {
  1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
  7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember",
};

export default async function LaporanPage({ searchParams }) {
  await requireAdminPage();

  const params = await searchParams;
  const now = new Date();
  const bulanStr = String(params?.bulan ?? "");
  const tahunStr = String(params?.tahun ?? "");
  // Sama seperti PHP: tabel hanya muncul bila bulan & tahun dikirim.
  const aktif = bulanStr !== "" && tahunStr !== "";
  const bulan = NAMA_BULAN[Number(bulanStr)] ? Number(bulanStr) : null;
  const tahun = /^\d{4}$/.test(tahunStr) ? Number(tahunStr) : null;

  let orders = [];
  let totalOmzet = 0;
  if (aktif && bulan && tahun) {
    orders = await query(
      `SELECT o.id, o.order_number, o.order_date, o.total_price, o.total_items,
              u.name AS customer_name
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.order_status = '5'
         AND MONTH(o.order_date) = ? AND YEAR(o.order_date) = ?
       ORDER BY o.order_date DESC`,
      [bulan, tahun]
    );
    totalOmzet = orders.reduce((sum, o) => sum + Number(o.total_price), 0);
  }

  const tahunSekarang = now.getFullYear();
  const daftarTahun = [];
  for (let i = tahunSekarang - 5; i <= tahunSekarang + 5; i++) daftarTahun.push(i); // 5 tahun ke belakang & depan

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Laporan Penjualan Bulanan</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Rekap pesanan berstatus <b>Selesai</b> pada bulan yang dipilih.
      </p>

      {/* Filter bulan & tahun */}
      <form method="GET" className="card mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="bulan">Bulan</label>
          <select id="bulan" name="bulan" required defaultValue={bulanStr} className="input">
            <option value="">-- Pilih Bulan --</option>
            {Object.entries(NAMA_BULAN).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="tahun">Tahun</label>
          <select id="tahun" name="tahun" required defaultValue={tahunStr || String(tahunSekarang)} className="input">
            {daftarTahun.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary rounded-full px-5 font-bold">
            🔎 Tampilkan
          </button>
          {aktif && (
            <a
              href={`/cetak-laporan?bulan=${bulanStr}&tahun=${tahunStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-danger rounded-full px-5 font-bold"
            >
              🖨 Cetak
            </a>
          )}
        </div>
      </form>

      {aktif && (
        <div className="card !p-0">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h6 className="font-bold text-zinc-200">
              📊 Data Penjualan: {NAMA_BULAN[bulan]} {tahun}
            </h6>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-3 pl-4">No</th>
                  <th className="py-3">Invoice</th>
                  <th className="py-3">Tanggal</th>
                  <th className="py-3">Pelanggan</th>
                  <th className="py-3 text-center">Jml Item</th>
                  <th className="py-3 pr-4 text-right">Total Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className="border-t border-zinc-800">
                    <td className="py-2.5 pl-4">{i + 1}</td>
                    <td className="py-2.5">
                      <Link href={`/orders/${o.id}`} className="font-mono font-bold text-emerald-400 hover:underline">
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="py-2.5 text-zinc-400">
                      {new Date(o.order_date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-2.5 text-zinc-200">{o.customer_name}</td>
                    <td className="py-2.5 text-center">{o.total_items}</td>
                    <td className="py-2.5 pr-4 text-right font-bold text-zinc-200">
                      {rupiah(Number(o.total_price))}
                    </td>
                  </tr>
                ))}
                {orders.length > 0 && (
                  <tr className="border-t border-zinc-800 bg-emerald-950/30">
                    <td colSpan={5} className="py-3 pl-4 text-right text-base font-bold">
                      TOTAL OMZET {NAMA_BULAN[bulan].toUpperCase()} {tahun}
                    </td>
                    <td className="py-3 pr-4 text-right text-base font-bold text-emerald-400">
                      {rupiah(totalOmzet)}
                    </td>
                  </tr>
                )}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-500">
                      Tidak ada penjualan selesai pada bulan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!aktif && (
        <div className="card py-10 text-center text-zinc-500">
          Pilih bulan dan tahun, lalu klik <b>Tampilkan</b> untuk melihat laporan.
        </div>
      )}
    </>
  );
}
