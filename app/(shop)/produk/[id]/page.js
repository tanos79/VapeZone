import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import ProductImage from "@/components/ProductImage";
import AddToCartForm from "@/components/AddToCartForm";

// Detail produk — padanan detail.php (gambar besar, kategori, harga, stok, deskripsi).
export const metadata = { title: "Detail Produk — KING VAPEZONE" };

export default async function ProdukDetailPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const rows = await query(
    `SELECT p.*, c.name AS category
     FROM products p
     LEFT JOIN product_category c ON c.id = p.category_id
     WHERE p.id = ?`,
    [id]
  );
  const p = rows[0];
  if (!p) notFound();

  const habis = Number(p.stock) <= 0;
  const stokTerbatas = !habis && Number(p.stock) < 5;
  const price = Math.round(Number(p.price));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-emerald-400">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/produk" className="hover:text-emerald-400">Produk</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gambar */}
        <div className="relative flex min-h-80 items-center justify-center rounded-2xl bg-zinc-100 p-6">
          {habis && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-zinc-950/60">
              <span className="badge -rotate-12 border border-white bg-red-950/90 px-4 py-2 text-lg font-bold text-red-300">
                SOLD OUT
              </span>
            </div>
          )}
          <ProductImage
            pictureName={p.picture_name}
            alt={p.name}
            className={`max-h-96 w-auto object-contain ${habis ? "grayscale" : ""}`}
          />
        </div>

        {/* Info */}
        <div>
          <span className="badge mb-3 bg-emerald-950/60 px-3 py-1.5 text-emerald-300">
            {p.category ?? "Umum"}
          </span>
          <h1 className="mb-2 text-3xl font-bold text-zinc-100">{p.name}</h1>
          <p className="mb-4 text-2xl font-bold text-emerald-400">
            Rp {new Intl.NumberFormat("id-ID").format(price)}
          </p>

          <div className="mb-6">
            {habis ? (
              <span className="badge bg-red-950/60 text-red-300">Stok habis</span>
            ) : stokTerbatas ? (
              <span className="badge bg-amber-950/60 text-amber-300">
                Stok terbatas — sisa {p.stock} {p.product_unit || "pcs"}
              </span>
            ) : (
              <span className="badge bg-emerald-950/60 text-emerald-300">
                Tersedia — {p.stock} {p.product_unit || "pcs"}
              </span>
            )}
          </div>

          <div className="card mb-6">
            <h6 className="mb-2 font-semibold text-zinc-200">Deskripsi Produk:</h6>
            <p className="text-sm leading-relaxed text-zinc-400">
              {p.description || "Belum ada deskripsi untuk produk ini."}
            </p>
          </div>

          {/* Form jumlah beli — padanan form POST keranjang_act.php di detail.php */}
          {!habis && (
            <div className="card mb-6">
              <h6 className="mb-3 font-semibold text-zinc-200">🛒 Beli Produk Ini</h6>
              <AddToCartForm productId={p.id} stock={Number(p.stock)} unit={p.product_unit} />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href="/produk" className="btn btn-secondary rounded-full px-5">
              ← Lihat Produk Lain
            </Link>
            <Link href="/#tentang" className="btn btn-primary rounded-full px-5">
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
