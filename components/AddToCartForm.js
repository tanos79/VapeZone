"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form "Masukkan Keranjang" di halaman detail produk
 * — padanan form POST ke keranjang_act.php dengan input jumlah.
 */
export default function AddToCartForm({ productId, stock, unit }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone(false);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: Number(qty) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menambah ke keranjang");
        return;
      }
      setDone(true);
      router.refresh();
      setTimeout(() => setDone(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label" htmlFor={`qty-${productId}`}>Jumlah Beli</label>
        <input
          id={`qty-${productId}`}
          type="number"
          min="1"
          max={stock}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
          className="input w-24 text-center font-bold"
        />
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary flex-1 rounded-full px-6 py-3 font-bold">
        {done ? "✓ Masuk Keranjang" : busy ? "Menambahkan…" : "🛒 Masukkan Keranjang"}
      </button>
      {error && (
        <p role="alert" className="w-full rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <p className="w-full text-xs text-zinc-500">*Jumlah maksimal pembelian sesuai stok tersedia ({stock} {unit || "pcs"}).</p>
    </form>
  );
}
