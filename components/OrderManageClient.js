"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form update status pesanan — padanan form di admin/pesanan_detail.php:
 * select status 1-6, kotak input resi muncul HANYA saat status "4" (Dikirim).
 */
export default function OrderManageClient({ orderId, currentStatus, currentResi }) {
  const router = useRouter();
  const [status, setStatus] = useState(String(currentStatus));
  const [resi, setResi] = useState(currentResi && currentResi !== "-" ? currentResi : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resi }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal memperbarui status");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const OPTIONS = [
    ["1", "Menunggu Bayar"],
    ["2", "Cek Bukti Transfer"],
    ["3", "Proses / Packing"],
    ["4", "Kirim Barang (Input Resi)"],
    ["5", "Selesai"],
    ["6", "Batalkan Pesanan"],
  ];

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h6 className="font-bold text-zinc-200">⚙️ Update Status</h6>

      <div>
        <label className="label" htmlFor="status">Pilih Tindakan:</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input font-bold"
        >
          {OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Kotak resi muncul hanya saat status 4 — padanan script cekResi() PHP */}
      {status === "4" && (
        <div>
          <label className="label" htmlFor="resi">Masukkan Nomor Resi</label>
          <input
            id="resi"
            type="text"
            required
            value={resi}
            onChange={(e) => setResi(e.target.value)}
            placeholder="Contoh: JNE12345678"
            className="input font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">Wajib diisi jika status &quot;Dikirim&quot;.</p>
        </div>
      )}

      {status === "6" && (
        <p className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
          ⚠️ Stok barang akan dikembalikan otomatis saat pesanan dibatalkan.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full rounded-full py-2.5 font-bold">
        {busy ? "Menyimpan…" : "Simpan Perubahan"}
      </button>
    </form>
  );
}
