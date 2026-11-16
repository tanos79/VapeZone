"use client";

import { useEffect } from "react";

/** Picu dialog print saat halaman terbuka (padanan window.print di cetak_laporan.php). */
export default function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="mx-auto mb-4 max-w-3xl">
      <button onClick={() => window.print()} className="btn btn-primary rounded-full px-6 font-bold">
        🖨 Cetak / Simpan PDF
      </button>
    </div>
  );
}
