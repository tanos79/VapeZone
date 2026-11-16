"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form autentikasi (login & register) yang memanggil API JSON.
 * Client component karena butuh state + interaksi.
 */
export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan. Coba lagi.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {isRegister && (
        <div>
          <label className="label" htmlFor="name">Nama Lengkap</label>
          <input id="name" name="name" type="text" required maxLength={50}
            className="input" placeholder="Budi Santoso" autoComplete="name" />
        </div>
      )}
      {isRegister && (
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required maxLength={191}
            className="input" placeholder="nama@email.com" autoComplete="email" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="identifier">Email atau Username</label>
        <input id="identifier" name="identifier" type="text" required
          className="input" placeholder={isRegister ? "contoh: budi" : "email / username"}
          autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required
          className="input" placeholder="••••••••"
          autoComplete={isRegister ? "new-password" : "current-password"} />
        {isRegister && (
          <p className="mt-1 text-xs text-zinc-500">
            Minimal 8 karakter, mengandung huruf dan angka.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Memproses…" : isRegister ? "Daftar" : "Masuk"}
      </button>
    </form>
  );
}
