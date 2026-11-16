import { query } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import KategoriClient from "@/components/KategoriClient";

// Master data — port admin/kategori.php: kelola kategori produk & satuan.
export const metadata = { title: "Kategori & Satuan — VapeZone" };

export default async function KategoriPage() {
  await requireAdminPage();

  // Ditambah jumlah pemakaian di tabel products (info saja, hapus tetap dicek di API).
  const [categories, units] = await Promise.all([
    query(
      `SELECT c.id, c.name,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS jumlah_produk
       FROM product_category c ORDER BY c.id DESC`
    ),
    query(
      `SELECT u.id, u.name,
              (SELECT COUNT(*) FROM products p WHERE p.product_unit = u.name) AS jumlah_produk
       FROM product_units u ORDER BY u.id DESC`
    ),
  ]);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Kelola Data Master</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Kategori dan satuan produk. Data yang sedang dipakai produk tidak bisa dihapus.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <KategoriClient
          title="Kategori Produk"
          icon="🗂️"
          endpoint="/api/admin/categories"
          items={categories}
          nameKey="name"
          maxLen={50}
          addPlaceholder="Nama kategori baru"
          editLabel="Nama Kategori"
        />
        <KategoriClient
          title="Satuan Produk"
          icon="📦"
          endpoint="/api/admin/units"
          items={units}
          nameKey="name"
          maxLen={32}
          addPlaceholder="Nama satuan baru (contoh: Pcs)"
          editLabel="Nama Satuan"
        />
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        ℹ️ Kolom &quot;Pemakaian&quot; menunjukkan jumlah produk yang memakai data tersebut. Penghapusan
        yang masih dipakai produk akan ditolak server (proteksi integritas data).
      </p>
    </>
  );
}
