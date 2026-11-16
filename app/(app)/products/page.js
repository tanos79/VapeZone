import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProductsClient from "@/components/ProductsClient";

export const metadata = { title: "Produk — VapeZone" };

export default async function ProductsPage() {
  const session = await getSession();

  const [products, categories, units] = await Promise.all([
    query(
      `SELECT p.id, p.name, p.category_id, c.name AS category, p.sku, p.description,
              p.price, p.stock, p.picture_name, p.product_unit, p.is_available
       FROM products p
       LEFT JOIN product_category c ON c.id = p.category_id
       ORDER BY p.name ASC`
    ),
    query("SELECT id, name FROM product_category ORDER BY name ASC"),
    query("SELECT id, name FROM product_units ORDER BY name ASC"),
  ]);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Produk</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {session.role === "admin"
          ? "Kelola data produk toko (tambah, ubah, hapus, upload foto)."
          : "Daftar produk toko. Hanya admin yang dapat mengubah data."}
      </p>
      <ProductsClient
        products={products}
        categories={categories}
        units={units}
        isAdmin={session.role === "admin"}
      />
    </>
  );
}
