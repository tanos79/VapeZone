"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { rupiah, tanggal } from "@/lib/format";

/**
 * Form pencatatan penjualan + riwayat.
 * Stok yang tampil di form adalah data terakhir dari server; validasi
 * sesungguhnya (stok cukup / tidak) dilakukan lagi di API dengan FOR UPDATE.
 */
export default function SalesClient({ products, sales, isAdmin }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const product = useMemo(
    () => products.find((p) => String(p.id) === productId),
    [products, productId]
  );
  const total = product ? Number(product.price) * (Number(quantity) || 0) : 0;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal mencatat penjualan");
        return;
      }
      setSuccess(`Penjualan tersimpan: ${data.sale.quantity}x ${data.sale.product_name} — ${rupiah(data.sale.total)}`);
      setProductId("");
      setQuantity("1");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(sale) {
    if (!confirm(`Hapus transaksi #${sale.id}? Stok produk akan dikembalikan.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menghapus transaksi");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card">
        <h3 className="mb-3 text-sm font-semibold">Transaksi Baru</h3>
        <div className="grid items-end gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="label" htmlFor="s-product">Produk</label>
            <select
              id="s-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="input"
            >
              <option value="">— Pilih produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock === 0}>
                  {p.name} (stok {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-qty">Jumlah</label>
            <input
              id="s-qty"
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="input"
            />
          </div>
          <div className="text-sm">
            <span className="label">Total</span>
            <p className="font-semibold text-emerald-400">{rupiah(total)}</p>
          </div>
          <button type="submit" disabled={busy || !productId} className="btn btn-primary">
            {busy ? "Menyimpan…" : "Simpan Penjualan"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
            {success}
          </p>
        )}
      </form>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Riwayat 50 Transaksi Terakhir</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="pb-2">Waktu</th>
              <th className="pb-2">Produk</th>
              <th className="pb-2">Jumlah</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Kasir</th>
              {isAdmin && <th className="pb-2 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-zinc-800">
                <td className="py-2 text-zinc-400">{tanggal(s.created_at, true)}</td>
                <td className="py-2 text-zinc-200">{s.product_name}</td>
                <td className="py-2">{s.quantity} × {rupiah(s.unit_price)}</td>
                <td className="py-2 font-medium text-emerald-400">{rupiah(s.total)}</td>
                <td className="py-2 text-zinc-400">{s.cashier}</td>
                {isAdmin && (
                  <td className="py-2 text-right">
                    <button onClick={() => remove(s)} disabled={busy} className="btn btn-danger !px-3 !py-1">
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-6 text-center text-zinc-500">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
