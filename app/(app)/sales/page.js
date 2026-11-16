import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import SalesClient from "@/components/SalesClient";

export const metadata = { title: "Penjualan — VapeZone" };

export default async function SalesPage() {
  const session = await getSession();
  const isAdmin = session.role === "admin";

  const [products, sales] = await Promise.all([
    query(
      `SELECT id, name, price, stock FROM products WHERE is_available = 1 ORDER BY name ASC`
    ),
    query(
      `SELECT s.id, s.quantity, s.unit_price, s.total, s.created_at,
              p.name AS product_name, u.username AS cashier
       FROM sales s
       JOIN products p ON p.id = s.product_id
       JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC LIMIT 50`
    ),
  ]);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Penjualan</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Catat transaksi penjualan. Stok otomatis berkurang dan riwayat tersimpan.
      </p>
      <SalesClient products={products} sales={sales} isAdmin={isAdmin} />
    </>
  );
}
