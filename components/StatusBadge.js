/**
 * Badge status pesanan — padanan blok if/elseif badge status aplikasi lama.
 * order_status: 1=menunggu bayar, 2=perlu dicek, 3=diproses, 4=dikirim,
 * 5=selesai, 6=dibatalkan (sama dengan enum aplikasi PHP).
 */
export default function StatusBadge({ status, large = false }) {
  const map = {
    1: ["Menunggu Pembayaran", "bg-zinc-800 text-zinc-300"],
    2: ["Sedang Dicek Admin", "bg-amber-950/70 text-amber-300"],
    3: ["Diproses / Packing", "bg-blue-950/70 text-blue-300"],
    4: ["Sedang Dikirim", "bg-cyan-950/70 text-cyan-300"],
    5: ["Selesai", "bg-emerald-950/70 text-emerald-300"],
    6: ["Dibatalkan", "bg-red-950/70 text-red-300"],
  };
  const [label, color] = map[Number(status)] ?? ["Unknown", "bg-zinc-800 text-zinc-400"];
  return (
    <span className={`badge ${color} ${large ? "px-4 py-2 text-sm" : ""}`}>
      {Number(status) === 5 && "✓ "}
      {Number(status) === 6 && "⛔ "}
      {label}
    </span>
  );
}
