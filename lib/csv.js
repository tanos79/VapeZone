/**
 * Konversi array of objects menjadi CSV, dengan mitigasi CSV Injection:
 * sel yang diawali karakter rumus (=, +, -, @) diberi prefix kutip tunggal
 * agar tidak tereksekusi sebagai rumus saat dibuka di Excel.
 */
export function toCsv(headers, rows) {
  const escapeCell = (value) => {
    let s = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(s)) {
      s = `'${s}`;
    }
    if (/[",\n\r]/.test(s)) {
      s = `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.map((h) => escapeCell(h.label)).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h.key])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`; // BOM agar Excel membaca UTF-8
}
