"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form informasi pengiriman — padanan form checkout.php.
 * Data dikirim ke POST /api/orders lalu dialihkan ke halaman pesanan berhasil.
 */
export default function CheckoutClient({ defaultName, defaultPhone, defaultAddress, totalBayar }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverName: form.get("receiver_name"),
          phoneNumber: form.get("phone_number"),
          address: form.get("address"),
          paymentMethod: form.get("payment_method"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal membuat pesanan");
        return;
      }
      router.push(`/pesanan-berhasil/${data.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="receiver_name">Nama Penerima</label>
        <input id="receiver_name" name="receiver_name" type="text" required maxLength={100}
          defaultValue={defaultName} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="phone_number">Nomor WhatsApp / HP</label>
        <input id="phone_number" name="phone_number" type="text" required
          defaultValue={defaultPhone} placeholder="08xxxxxxxx" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="address">Alamat Lengkap</label>
        <textarea id="address" name="address" rows={3} required maxLength={255}
          defaultValue={defaultAddress} placeholder="Nama Jalan, No Rumah, Kecamatan, Kota" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="payment_method">Metode Pembayaran</label>
        <select id="payment_method" name="payment_method" className="input" defaultValue="1">
          <option value="1">Transfer Bank (BCA/Mandiri/BRI)</option>
          <option value="2">COD (Bayar Ditempat)</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full rounded-full py-3 font-bold">
        {busy ? "Memproses…" : `✓ Buat Pesanan (${totalBayar})`}
      </button>
    </form>
  );
}
