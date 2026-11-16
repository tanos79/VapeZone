"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form konfirmasi pembayaran — padanan pembayaran.php:
 * nama pengirim, bank asal, jumlah (readonly), upload bukti JPG/PNG ≤ 2MB.
 */
export default function PembayaranClient({ orderId, totalTagihan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/pembayaran`, {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal mengirim bukti pembayaran");
        return;
      }
      alert("Terima kasih! Bukti pembayaran berhasil dikirim. Mohon tunggu verifikasi admin.");
      router.push("/riwayat");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <input type="hidden" name="order_id" value={orderId} />
      <div>
        <label className="label" htmlFor="nama">Nama Pengirim (Sesuai Rekening)</label>
        <input id="nama" name="nama" type="text" required maxLength={100}
          placeholder="Contoh: Deni Nuryana" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="bank">Bank Asal</label>
        <input id="bank" name="bank" type="text" required maxLength={50}
          placeholder="Contoh: BCA / DANA / BRI" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="jumlah">Jumlah Transfer</label>
        <input id="jumlah" name="jumlah" type="text" value={totalTagihan} readOnly
          className="input bg-zinc-800/60 text-zinc-300" />
      </div>
      <div>
        <label className="label" htmlFor="bukti">Upload Bukti Transfer</label>
        <input id="bukti" name="bukti" type="file" required
          accept="image/png, image/jpeg, image/jpg" className="input" />
        <p className="mt-1 text-xs text-red-400">
          ⚠️ Wajib format <b>JPG</b> atau <b>PNG</b>. Maksimal 2MB.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full rounded-full py-3 font-bold">
        {busy ? "Mengirim…" : "✉️ Kirim Bukti Pembayaran"}
      </button>
    </form>
  );
}
