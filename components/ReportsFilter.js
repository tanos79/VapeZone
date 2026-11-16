"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Filter tanggal laporan; memicu navigasi server-render dengan query param. */
export default function ReportsFilter({ from, to, isAdmin }) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function apply(e) {
    e.preventDefault();
    router.push(`/reports?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`);
  }

  return (
    <form onSubmit={apply} className="card mb-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="label" htmlFor="r-from">Dari</label>
        <input id="r-from" type="date" value={f} onChange={(e) => setF(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="r-to">Sampai</label>
        <input id="r-to" type="date" value={t} onChange={(e) => setT(e.target.value)} required className="input" />
      </div>
      <button type="submit" className="btn btn-primary">Terapkan</button>
      {isAdmin && (
        <a
          href={`/api/reports/sales/export?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`}
          className="btn btn-secondary"
        >
          ⬇ Ekspor CSV
        </a>
      )}
    </form>
  );
}
