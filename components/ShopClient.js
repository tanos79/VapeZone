"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

const rupiah = (v) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v);

/**
 * Grid katalog toko: pencarian + chip kategori (read-only, publik).
 * Kartu meniru card-product aplikasi lama dengan tema warna sekarang.
 */
export default function ShopClient({ products, categories, initialKategori = "" }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialKategori);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "" || String(p.category_id) === String(category)) &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search, category]
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="🔍 Cari produk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
          aria-label="Cari produk"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`btn !px-4 !py-1.5 text-xs font-semibold ${
              category === "" ? "bg-emerald-500 text-zinc-950" : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(String(c.id))}
              className={`btn !px-4 !py-1.5 text-xs font-semibold ${
                String(category) === String(c.id)
                  ? "bg-emerald-500 text-zinc-950"
                  : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {filtered.map((p) => {
          const habis = Number(p.stock) <= 0;
          const stokTerbatas = Number(p.stock) > 0 && Number(p.stock) < 5;
          return (
            <div
              key={p.id}
              className="card group flex flex-col !p-0 overflow-hidden transition-all hover:-translate-y-1 hover:border-emerald-700"
            >
              <Link
                href={`/produk/${p.id}`}
                className="flex h-48 items-center justify-center relative bg-zinc-100 p-4"
              >
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
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar produk dari folder publik statis */}
                <img
                  src={`/img/products/${p.picture_name}`}
                  alt={p.name}
                  onError={(e) => { e.currentTarget.src = "/img/products/placeholder.svg"; }}
                  className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${habis ? "grayscale" : ""}`}
                />
              </Link>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <small className={habis ? "font-bold text-red-400" : "text-zinc-500"}>
                  {habis ? "Stok Habis" : `Stok: ${p.stock} ${p.product_unit || "pcs"}`}
                </small>
                <h3 className="truncate font-semibold text-zinc-100" title={p.name}>{p.name}</h3>
                <small className="text-zinc-500">{p.category ?? "Umum"}</small>
                <p className="pt-2 font-bold text-emerald-400">
                  Rp {rupiah(Number(p.price))}
                </p>
                {/* Tombol di luar Link — padanan tombol keranjang_act.php di card produk */}
                {!habis && (
                  <AddToCartButton
                    productId={p.id}
                    className="btn btn-primary mt-2 w-full !py-2 text-sm font-bold"
                  />
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-zinc-500">
            Tidak ada produk yang cocok.
          </p>
        )}
      </div>
    </>
  );
}
