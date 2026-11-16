import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { readCart, cartProducts } from "@/lib/cart";
import { rupiah } from "@/lib/format";
import CheckoutClient from "@/components/CheckoutClient";

// Halaman checkout — port checkout.php (wajib login, keranjang tidak boleh kosong).
export const metadata = { title: "Checkout — KING VAPEZONE" };

const ONGKIR = 25000;

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/checkout");

  const cart = await readCart();
  const products = await cartProducts(cart);
  if (products.length === 0) {
    redirect("/keranjang");
  }

  // Data lama customer untuk auto-fill form (sama seperti PHP).
  const customerRows = await query(
    "SELECT address, phone_number FROM customers WHERE user_id = ?",
    [session.userId]
  );
  const customer = customerRows[0] ?? {};

  const items = products.map((p) => {
    const qty = cart[p.id] ?? 0;
    const subtotal = Number(p.price) * qty;
    return { name: p.name, qty, harga: rupiah(Number(p.price)), subtotal: rupiah(subtotal) };
  });
  const totalBelanja = products.reduce(
    (sum, p) => sum + Number(p.price) * (cart[p.id] ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">🚚 Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-3 font-bold text-zinc-200">Informasi Pengiriman</h2>
          <CheckoutClient
            defaultName={session.name}
            defaultPhone={customer.phone_number ?? ""}
            defaultAddress={customer.address && customer.address !== "-" ? customer.address : ""}
            totalBayar={rupiah(totalBelanja + ONGKIR)}
          />
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 font-bold text-zinc-200">Ringkasan Pesanan</h2>
          <div className="card !p-0">
            <ul className="divide-y divide-zinc-800">
              {items.map((item) => (
                <li key={item.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                    <small className="text-zinc-500">{item.qty} × {item.harga}</small>
                  </div>
                  <span className="text-sm font-bold text-zinc-200">{item.subtotal}</span>
                </li>
              ))}
              <li className="flex items-center justify-between px-4 py-3">
                <span className="text-zinc-400">Ongkos Kirim (Flat)</span>
                <strong className="text-zinc-200">{rupiah(ONGKIR)}</strong>
              </li>
              <li className="flex items-center justify-between border-t border-zinc-800 px-4 py-4">
                <span className="font-bold text-zinc-100">Total Bayar</span>
                <span className="text-xl font-bold text-emerald-400">{rupiah(totalBelanja + ONGKIR)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
