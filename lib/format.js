/** Format angka menjadi Rupiah (id-ID). */
export function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

/** Format tanggal Indonesia lengkap. */
export function tanggal(value, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
