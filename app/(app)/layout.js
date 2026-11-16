import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

// Layout halaman privat. Sesi diverifikasi ulang di sini (defense in depth)
// meski proxy sudah menjaganya.
export default async function AppLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin";
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/products", label: "Produk" },
    { href: "/kategori", label: "Kategori & Satuan" },
    { href: "/sales", label: "Penjualan" },
    { href: "/orders", label: "Pesanan Online" },
    { href: "/reports", label: "Laporan Kasir" },
    { href: "/laporan", label: "Laporan Bulanan" },
    { href: "/", label: "Katalog Toko ↗" },
    ...(isAdmin
      ? [
          { href: "/users", label: "User" },
          { href: "/logs", label: "Log Aktivitas" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-800 bg-zinc-900/40 p-4 md:block">
        <div className="mb-8 px-2">
          <p className="text-lg font-bold text-emerald-400">VapeZone</p>
          <p className="text-xs text-zinc-500">Manajemen Penjualan</p>
        </div>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-zinc-800 pt-4">
          <p className="px-3 text-sm font-medium text-zinc-200">{session.name}</p>
          <p className="mb-2 px-3 text-xs text-zinc-500">
            {session.username} · {isAdmin ? "admin" : "user"}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Navbar mobile */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 md:hidden">
          <p className="font-bold text-emerald-400">VapeZone</p>
          <LogoutButton />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 px-2 py-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
              {l.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
