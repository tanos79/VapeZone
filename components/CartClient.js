"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tabel keranjang — padanan keranjang.php.
 * Tombol hapus memanggil DELETE /api/cart (padanan hapus_keranjang.php).
 */
export default function CartClient({ items }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove(item) {
    if (!confirm(`Hapus produk "${item.name}" dari keranjang?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menghapus item");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="py-3 pl-4">Produk</th>
              <th className="py-3">Harga</th>
              <th className="py-3 text-center">Jumlah</th>
              <th className="py-3">Subtotal</th>
              <th className="py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-zinc-800">
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- gambar produk dari folder publik statis */}
                    <img
                      src={`/img/products/${item.picture_name}`}
                      alt={item.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/products/placeholder.svg"; }}
                      className="h-14 w-14 rounded-lg bg-zinc-100 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-zinc-100">{item.name}</p>
                      <small className="text-zinc-500">{item.sku || "—"}</small>
                    </div>
                  </div>
                </td>
                <td className="py-3">{item.harga}</td>
                <td className="py-3 text-center">
                  <span className="badge bg-zinc-800 px-3 py-1.5 text-zinc-200">{item.qty}</span>
                </td>
                <td className="py-3 font-bold text-emerald-400">{item.subtotal}</td>
                <td className="py-3">
                  <button
                    onClick={() => remove(item)}
                    disabled={busy}
                    className="btn btn-danger !px-3 !py-1.5"
                    aria-label={`Hapus ${item.name}`}
                  >
                    🗑 Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
