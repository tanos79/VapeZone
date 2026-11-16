"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tanggal } from "@/lib/format";

/**
 * Daftar user (admin saja). Perubahan role dikirim ke API dan divalidasi
 * server-side (tidak boleh menurunkan diri sendiri / menghabiskan admin).
 */
export default function UsersClient({ users, currentUserId }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeRole(user, role) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal mengubah role");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(user) {
    if (!confirm(`Hapus akun "${user.username}"?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal menghapus user");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="pb-2">Username</th>
              <th className="pb-2">Nama</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Terdaftar</th>
              <th className="pb-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-800">
                <td className="py-2 font-medium text-zinc-100">
                  {u.username}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-emerald-400">(kamu)</span>
                  )}
                </td>
                <td className="py-2 text-zinc-300">{u.name}</td>
                <td className="py-2 text-zinc-400">{u.email}</td>
                <td className="py-2">
                  <span className={u.role === "admin" ? "badge bg-emerald-950/60 text-emerald-300" : "badge bg-zinc-800 text-zinc-300"}>
                    {u.role}
                  </span>
                </td>
                <td className="py-2 text-zinc-400">{tanggal(u.register_date)}</td>
                <td className="py-2">
                  <div className="flex justify-end gap-2">
                    <select
                      aria-label={`Role ${u.username}`}
                      value={u.role}
                      disabled={busy || u.id === currentUserId}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="input !w-28 !px-2 !py-1"
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      onClick={() => remove(u)}
                      disabled={busy || u.id === currentUserId}
                      className="btn btn-danger !px-3 !py-1"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
