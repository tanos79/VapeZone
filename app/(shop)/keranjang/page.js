import Link from "next/link";
import { readCart, cartProducts } from "@/lib/cart";
import { rupiah } from "@/lib/format";
import CartClient from "@/components/CartClient";

// Halaman keranjang belanja — port keranjang.php.
export const metadata = { title: "Keranjang Belanja — KING VAPEZONE" };

export default async function KeranjangPage() {
  const cart = await readCart();
  const products = await cartProducts(cart);

  // Keranjang kosong (padanan tampilan kosong keranjang.php).
  if (products.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-4 text-6xl opacity-50">🛒</div>
        <h2 className="text-2xl font-bold text-zinc-100">Keranjang Belanja Kosong</h2>
        <p className="mt-2 text-zinc-400">Wah, kamu belum memilih produk apapun.</p>
        <Link href="/" className="btn btn-primary mt-6 rounded-full px-6 py-3 font-bold">
          ← Mulai Belanja
        </Link>
      </main>
    );
  }

  // Gabungkan data DB dengan jumlah dari keranjang; hitung subtotal.
  const items = products.map((p) => {
    const qty = cart[p.id] ?? 0;
    const subtotal = Number(p.price) * qty;
    return {
      ...p,
      qty,
      harga: rupiah(subtotal / qty),
      subtotal: rupiah(subtotal),
    };
  });
  const totalBelanja = products.reduce(
    (sum, p) => sum + Number(p.price) * (cart[p.id] ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">🛒 Keranjang Belanja</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartClient items={items} />
          <Link href="/" className="btn btn-secondary mt-4 rounded-full">
            ← Lanjut Belanja
          </Link>
        </div>

        <div>
          <div className="card">
            <h3 className="mb-4 font-bold text-zinc-100">Ringkasan Pesanan</h3>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-zinc-400">Total Harga</span>
              <span className="text-xl font-bold text-emerald-400">{rupiah(totalBelanja)}</span>
            </div>
            <hr className="border-zinc-800" />
            <div className="mt-4 grid gap-2">
              <Link href="/checkout" className="btn btn-primary rounded-full px-4 py-3 font-bold">
                Checkout Sekarang →
              </Link>
              <Link href="/produk" className="btn btn-secondary rounded-full px-4 py-2 text-sm">
                Tambah Produk Lain
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
