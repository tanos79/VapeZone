"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tombol "Beli Aja" — padanan keranjang_act.php?id=X:
 * tambah 1 unit produk ke keranjang lewat API (validasi stok di server),
 * lalu refresh agar badge keranjang di navbar ikut terupdate.
 */
export default function AddToCartButton({ productId, className = "", label = "🛒 Beli Aja" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menambah ke keranjang");
        return;
      }
      setDone(true);
      router.refresh();
      setTimeout(() => setDone(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={busy}
      className={`disabled:opacity-60 ${className}`}
      title={error || undefined}
    >
      {error ? (
        <span className="block max-w-full truncate">{error}</span>
      ) : done ? (
        "✓ Masuk Keranjang"
      ) : (
        label
      )}
    </button>
  );
}
