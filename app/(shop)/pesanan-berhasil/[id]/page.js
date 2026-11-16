import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rupiah } from "@/lib/format";

// Halaman sukses — port pesanan_berhasil.php (hanya pesanan milik user).
export const metadata = { title: "Pesanan Berhasil — KING VAPEZONE" };

export default async function PesananBerhasilPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await query(
    "SELECT id, order_number, total_price FROM orders WHERE id = ? AND user_id = ?",
    [id, session.userId]
  );
  const order = rows[0];
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="card !p-8">
        <div className="mb-4 text-6xl text-emerald-400">✅</div>
        <h1 className="text-2xl font-bold text-zinc-100">Pesanan Berhasil!</h1>
        <p className="mt-2 text-zinc-400">Terima kasih telah berbelanja di King Vapezone.</p>

        <div className="mt-6 rounded-xl border border-amber-900/50 bg-amber-950/30 py-4">
          <p className="text-sm font-semibold text-amber-300">Nomor Invoice:</p>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{order.order_number}</p>
        </div>

        <p className="mt-6 text-sm text-zinc-400">Total yang harus dibayar:</p>
        <p className="text-2xl font-bold text-emerald-400">{rupiah(Number(order.total_price))}</p>

        <hr className="my-6 border-zinc-800" />

        <div className="rounded-xl bg-zinc-900/60 p-4 text-left">
          <h3 className="mb-3 text-sm font-bold text-zinc-200">Silakan transfer ke salah satu rekening:</h3>
          <div className="mb-2 flex gap-3">
            <span>🏦</span>
            <div>
              <strong className="text-zinc-200">BCA</strong>
              <br />
              <span className="text-sm text-zinc-400">123-456-7890 (King Vapezone)</span>
            </div>
          </div>
          <div className="flex gap-3">
            <span>🏦</span>
            <div>
              <strong className="text-zinc-200">MANDIRI</strong>
              <br />
              <span className="text-sm text-zinc-400">000-111-2222 (King Vapezone)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          <Link href="/riwayat" className="btn btn-primary rounded-full py-3 font-bold">
            Lihat Riwayat Pesanan
          </Link>
          <Link href="/" className="btn btn-secondary rounded-full py-2">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
