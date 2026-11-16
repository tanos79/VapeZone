"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * CRUD master data — padanan kategori.php + master_act.php.
 * Baris bisa di-edit inline; hapus memanggil API yang menolak bila
 * data masih dipakai produk (pesan error ditampilkan inline).
 */
export default function KategoriClient({ title, icon, endpoint, items, nameKey = "name", maxLen = 50, addPlaceholder, editLabel }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  async function call(method, url, body) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Gagal memproses data");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (await call("POST", endpoint, { name: newName })) setNewName("");
  }

  async function saveEdit(id) {
    if (await call("PUT", endpoint, { id, name: editName })) setEditingId(null);
  }

  async function remove(item) {
    if (!confirm(`Hapus "${item[nameKey]}"?`)) return;
    await call("DELETE", `${endpoint}?id=${item.id}`);
  }

  return (
    <div className="card !p-0">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h6 className="font-bold text-emerald-400">
          {icon} {title}
        </h6>
      </div>

      {/* Form tambah */}
      <form onSubmit={add} className="flex gap-2 border-b border-zinc-800 px-4 py-3">
        <input
          type="text"
          required
          maxLength={maxLen}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={addPlaceholder}
          className="input flex-1"
          aria-label={`Tambah ${title}`}
        />
        <button type="submit" disabled={busy} className="btn btn-primary !px-4">
          + Baru
        </button>
      </form>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500">
            <th className="py-2 pl-4">{editLabel}</th>
            <th className="py-2">Pemakaian</th>
            <th className="py-2 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-zinc-800">
              <td className="py-2.5 pl-4">
                {editingId === item.id ? (
                  <form onSubmit={() => saveEdit(item.id)} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      maxLength={maxLen}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input flex-1"
                      autoFocus
                    />
                    <button type="submit" disabled={busy} className="btn btn-primary !px-3 !py-1.5 text-xs">Simpan</button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary !px-3 !py-1.5 text-xs">Batal</button>
                  </form>
                ) : (
                  <span className="font-medium text-zinc-200">{item[nameKey]}</span>
                )}
              </td>
              <td className="py-2.5 text-xs text-zinc-500">
                {item.jumlah_produk > 0 ? `${item.jumlah_produk} produk` : "tidak dipakai"}
              </td>
              <td className="py-2.5 pr-4 text-right">
                {editingId !== item.id && (
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item[nameKey]);
                      }}
                      className="btn btn-secondary !px-2.5 !py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={busy}
                      className="btn btn-danger !px-2.5 !py-1 text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-zinc-500">Belum ada data.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
