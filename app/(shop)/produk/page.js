import { query } from "@/lib/db";
import ShopClient from "@/components/ShopClient";

// Halaman "Semua Produk" toko — padanan semua_produk.php.
export const metadata = { title: "Semua Produk — KING VAPEZONE" };

export default async function ProdukPage({ searchParams }) {
  const params = await searchParams;
  const initialKategori = /^\d+$/.test(params?.kategori || "") ? params.kategori : "";

  const [products, categories] = await Promise.all([
    query(
      `SELECT p.id, p.name, p.category_id, c.name AS category, p.price, p.stock,
              p.product_unit, p.picture_name
       FROM products p
       LEFT JOIN product_category c ON c.id = p.category_id
       WHERE p.is_available = 1
       ORDER BY p.id DESC`
    ),
    query("SELECT id, name FROM product_category ORDER BY id ASC"),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 border-l-4 border-emerald-500 pl-3">
        <h1 className="text-2xl font-bold text-zinc-100">Semua Produk</h1>
        <p className="text-sm text-zinc-500">
          Koleksi lengkap produk King Vapezone.
        </p>
      </div>
      <ShopClient products={products} categories={categories} initialKategori={initialKategori} />
    </main>
  );
}
