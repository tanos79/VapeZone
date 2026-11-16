"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rupiah } from "@/lib/format";

/**
 * Tabel + form produk. Semua perubahan dikirim ke API /api/products
 * (server yang memvalidasi role admin), bukan dipercaya dari klien.
 * Form memakai FormData agar bisa mengirim foto produk (multipart).
 */
export default function ProductsClient({ products, categories, units, isAdmin }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // produk yang sedang diedit
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  function startCreate() {
    setEditing(null);
    setShowForm(true);
    setError("");
  }

  function startEdit(product) {
    setEditing({
      id: product.id,
      name: product.name,
      categoryId: String(product.category_id ?? ""),
      productUnit: product.product_unit ?? "pcs",
      sku: product.sku ?? "",
      price: String(Number(product.price)),
      stock: String(product.stock),
      description: product.description ?? "",
      isAvailable: String(product.is_available ?? 1),
      pictureName: product.picture_name ?? "default.jpg",
    });
    setShowForm(true);
    setError("");
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan produk");
        return;
      }
      setShowForm(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(product) {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menghapus produk");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.category ?? ""} ${p.sku ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={startCreate} className="btn btn-primary">+ Tambah Produk</button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={save} className="card space-y-3">
          <h3 className="text-sm font-semibold">{editing ? "Ubah Produk" : "Produk Baru"}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-name">Nama Produk</label>
              <input id="p-name" name="name" defaultValue={editing?.name} required maxLength={191} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="p-cat">Kategori</label>
              <select id="p-cat" name="categoryId" defaultValue={editing?.categoryId ?? ""} required className="input">
                <option value="" disabled>— Pilih kategori —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="p-sku">SKU</label>
                <input id="p-sku" name="sku" defaultValue={editing?.sku} maxLength={32} placeholder="Contoh: VZ-POD-01" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="p-unit">Satuan</label>
                <select id="p-unit" name="productUnit" defaultValue={editing?.productUnit ?? "pcs"} className="input">
                  {units.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="p-price">Harga (Rp)</label>
                <input id="p-price" name="price" type="number" min="1000" step="1"
                  defaultValue={editing?.price} required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="p-stock">Stok</label>
                <input id="p-stock" name="stock" type="number" min="0" step="1"
                  defaultValue={editing?.stock} required className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="p-status">Status Produk</label>
              <select id="p-status" name="isAvailable" defaultValue={editing?.isAvailable ?? "1"} className="input">
                <option value="1">Tersedia</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-desc">Deskripsi singkat</label>
              <input id="p-desc" name="description" defaultValue={editing?.description} maxLength={191} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="p-foto">Foto Produk (JPG/PNG/WEBP, maks 2MB)</label>
              <input id="p-foto" name="foto" type="file" accept="image/png, image/jpeg, image/jpg, image/webp"
                className="input" />
              {editing && (
                <p className="mt-1 text-xs text-zinc-500">
                  Foto saat ini: <code>{editing.pictureName}</code> — biarkan kosong bila tidak ingin mengganti.
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Menyimpan…" : "Simpan"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
          </div>
        </form>
      )}

      <div className="max-w-xs">
        <input
          type="search"
          placeholder="Cari produk, SKU, atau kategori…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          aria-label="Cari produk"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="pb-2">Foto</th>
              <th className="pb-2">Nama / SKU</th>
              <th className="pb-2">Kategori</th>
              <th className="pb-2 text-center">Satuan</th>
              <th className="pb-2">Harga</th>
              <th className="pb-2">Stok</th>
              <th className="pb-2">Status</th>
              {isAdmin && <th className="pb-2 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-zinc-800">
                <td className="py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- gambar produk dari folder publik statis */}
                  <img
                    src={`/img/products/${p.picture_name}`}
                    alt={p.name}
                    onError={(e) => { e.currentTarget.src = "/img/products/placeholder.svg"; }}
                    className="h-12 w-12 rounded-lg bg-zinc-100 object-contain"
                  />
                </td>
                <td className="py-2">
                  <p className="font-medium text-zinc-100">{p.name}</p>
                  {p.sku && <p className="font-mono text-xs text-zinc-500">{p.sku}</p>}
                  {p.description && <p className="max-w-56 truncate text-xs text-zinc-500">{p.description}</p>}
                </td>
                <td className="py-2"><span className="badge bg-zinc-800 text-zinc-300">{p.category ?? "—"}</span></td>
                <td className="py-2 text-center">{p.product_unit ?? "pcs"}</td>
                <td className="py-2">{rupiah(Number(p.price))}</td>
                <td className="py-2">
                  <span className={p.stock <= 5 ? "text-amber-400" : ""}>{p.stock}</span>
                </td>
                <td className="py-2">
                  {p.is_available ? (
                    <span className="badge bg-emerald-950/60 text-emerald-300">Tersedia</span>
                  ) : (
                    <span className="badge bg-red-950/60 text-red-300">Nonaktif</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(p)} className="btn btn-secondary !px-3 !py-1">Ubah</button>
                      <button onClick={() => remove(p)} disabled={busy} className="btn btn-danger !px-3 !py-1">Hapus</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-6 text-center text-zinc-500">
                  Tidak ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
