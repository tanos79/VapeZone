import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { tanggal } from "@/lib/format";

export const metadata = { title: "Log Aktivitas — VapeZone" };

export default async function LogsPage() {
  const session = await getSession();
  if (session.role !== "admin") redirect("/dashboard?denied=1");

  const rows = await query(
    "SELECT action, detail, username, ip, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 100"
  );

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Log Aktivitas</h1>
      <p className="mb-6 text-sm text-zinc-400">
        100 aktivitas terakhir (login, CRUD, ekspor laporan). Nilai ip berasal dari
        header proxy platform hosting.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="pb-2">Waktu</th>
              <th className="pb-2">User</th>
              <th className="pb-2">Aksi</th>
              <th className="pb-2">Detail</th>
              <th className="pb-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="py-2 text-zinc-400">{tanggal(l.created_at, true)}</td>
                <td className="py-2 text-zinc-200">{l.username}</td>
                <td className="py-2">
                  <span className="badge bg-zinc-800 text-zinc-300">{l.action}</span>
                </td>
                <td className="py-2 text-zinc-400">{l.detail}</td>
                <td className="py-2 text-zinc-500">{l.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-zinc-500">
                  Belum ada aktivitas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
