import Link from "next/link";
import { query } from "@/lib/db";
import ProductImage from "@/components/ProductImage";
import AddToCartButton from "@/components/AddToCartButton";

// Beranda toko — meniru struktur beranda aplikasi lama:
// hero fullscreen → 3 keunggulan → section per kategori (4 produk) → tentang kami.
export const metadata = { title: "KING VAPEZONE — Premium Vape Store" };

const FEATURES = [
  { icon: "🚚", title: "Pengiriman Cepat", desc: "Pesanan dikirim di hari yang sama." },
  { icon: "🛡️", title: "100% Original", desc: "Jaminan produk asli atau uang kembali." },
  { icon: "🎧", title: "Layanan 24/7", desc: "Hubungi admin kami kapan saja." },
];

function ProductCard({ p }) {
  const habis = Number(p.stock) <= 0;
  const stokTerbatas = Number(p.stock) > 0 && Number(p.stock) < 5;
  return (
    <div className="card group flex flex-col !p-0 overflow-hidden transition-all hover:-translate-y-1 hover:border-emerald-700">
      <Link href={`/produk/${p.id}`} className="relative flex h-56 items-center justify-center bg-zinc-100 p-4">
        {stokTerbatas && (
          <span className="badge absolute left-3 top-3 z-10 bg-red-950/90 text-red-300">Stok Terbatas</span>
        )}
        {habis && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/60">
            <span className="badge -rotate-12 border border-white bg-red-950/90 px-3 py-1.5 text-sm font-bold text-red-300">
              SOLD OUT
            </span>
          </div>
        )}
        <ProductImage
          pictureName={p.picture_name}
          alt={p.name}
          className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${habis ? "grayscale" : ""}`}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <small className={habis ? "font-bold text-red-400" : "text-zinc-500"}>
          {habis ? "Stok Habis" : `Stok: ${p.stock} ${p.product_unit || "pcs"}`}
        </small>
        <h3 className="truncate font-semibold text-zinc-100" title={p.name}>{p.name}</h3>
        <p className="pt-2 text-lg font-bold text-emerald-400">
          Rp {new Intl.NumberFormat("id-ID").format(Math.round(Number(p.price)))}
        </p>
        {!habis && (
          <AddToCartButton
            productId={p.id}
            className="btn btn-primary mt-2 w-full !py-2 text-sm font-bold"
          />
        )}
      </div>
    </div>
  );
}

export default async function HomePage() {
  // Ambil kategori beserta 4 produk terbaru di masing-masing kategori.
  const categories = await query(
    "SELECT id, name FROM product_category ORDER BY id ASC"
  );
  const products = await query(
    `SELECT p.*, c.name AS category
     FROM products p LEFT JOIN product_category c ON c.id = p.category_id
     WHERE p.is_available = 1
     ORDER BY p.id DESC`
  );

  const grouped = categories
    .map((c) => ({
      ...c,
      items: products.filter((p) => p.category_id === c.id).slice(0, 4),
    }))
    .filter((c) => c.items.length > 0);

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(9,9,11,0.55), rgba(9,9,11,0.75)), url('/img/hero/vapemore.jpg')",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <span className="badge mb-6 border border-emerald-500/40 bg-emerald-950/50 px-4 py-2 text-xs font-bold text-emerald-300">
            ⭐ PREMIUM VAPE STORE
          </span>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Rasakan Sensasi <br />
            <span className="text-emerald-400">Vaping Terbaik</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl font-light text-zinc-300">
            Temukan device, liquid, dan aksesoris vaping terlengkap dengan harga
            kompetitif.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/produk" className="btn btn-primary rounded-full px-6 py-3">
              🛍️ Belanja Sekarang
            </Link>
            <Link href="#tentang" className="btn rounded-full border border-zinc-500/40 px-6 py-3 text-zinc-200 backdrop-blur hover:bg-zinc-800">
              Hubungi Kami
            </Link>
          </div>
          <p className="mt-6 inline-flex rounded-full border border-amber-900/50 bg-amber-950/50 px-3 py-1 text-xs text-amber-300">
            ⚠️ Khusus usia 18 tahun ke atas
          </p>
        </div>
      </section>

      {/* ============ KEUNGGULAN ============ */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl">
                {f.icon}
              </div>
              <h5 className="font-bold text-zinc-100">{f.title}</h5>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SECTION PER KATEGORI ============ */}
      {grouped.map((c) => (
        <section key={c.id} className="border-b border-zinc-800 py-10">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="border-l-4 border-emerald-500 pl-3">
                <h3 className="text-xl font-bold capitalize text-zinc-100">{c.name} Series</h3>
                <p className="text-sm text-zinc-500">
                  Pilihan terbaik untuk kategori {c.name.toLowerCase()}.
                </p>
              </div>
              <Link href={`/produk?kategori=${c.id}`} className="btn btn-secondary rounded-full !py-1.5 text-sm">
                Lihat Semua →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {c.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ============ TENTANG KAMI ============ */}
      <section id="tentang" className="py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 md:grid-cols-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- gambar statis lokal */}
            <img
              src="/img/hero/about.jpg"
              alt="Tentang King Vapezone"
              className="w-full rounded-2xl object-cover shadow-lg"
            />
            <div className="absolute -bottom-4 -right-4 -z-10 h-24 w-24 rounded-2xl bg-emerald-600/40" />
            <div className="absolute -left-4 -top-4 -z-10 h-24 w-24 rounded-2xl bg-zinc-800" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              King Vapezone Story
            </p>
            <h2 className="mb-3 mt-2 text-3xl font-bold text-zinc-100">
              Lebih Dari Sekadar Toko Vape
            </h2>
            <p className="mb-6 leading-relaxed text-zinc-400">
              Kami berdiri sejak 2023 dengan misi menyediakan produk vaping
              original dan berkualitas.
            </p>
            <div className="mb-6 flex gap-6">
              <div className="border-l-4 border-emerald-500 pl-3">
                <h4 className="text-xl font-bold text-zinc-100">100%</h4>
                <small className="text-zinc-500">Authentic</small>
              </div>
              <div className="border-l-4 border-zinc-600 pl-3">
                <h4 className="text-xl font-bold text-zinc-100">24/7</h4>
                <small className="text-zinc-500">Support</small>
              </div>
            </div>
            <Link href="/produk" className="btn btn-primary rounded-full px-5">
              Lihat Produk Kami →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
