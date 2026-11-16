import Link from "next/link";
import { getSession } from "@/lib/auth";
import { cartCount } from "@/lib/cart";
import LogoutButton from "@/components/LogoutButton";

/**
 * Navbar toko konsumen — struktur sama dengan aplikasi lama:
 * Beranda, Produk, Tentang Kami, ikon keranjang + badge jumlah item,
 * dropdown akun (Riwayat Pesanan / Keranjang / Dashboard Admin / Logout).
 */
export default async function ShopHeader() {
  const session = await getSession();
  const jumlahKeranjang = await cartCount();
  const isAdmin = session?.role === "admin";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-wide text-emerald-400">
            ⚡ KING VAPEZONE
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-emerald-400">
            Beranda
          </Link>
          <Link href="/produk" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-emerald-400">
            Produk
          </Link>
          <Link href="/tentang" className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-emerald-400">
            Tentang Kami
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Ikon keranjang + badge jumlah item */}
          <Link
            href="/keranjang"
            aria-label={`Keranjang belanja, ${jumlahKeranjang} item`}
            className="relative rounded-lg px-2 py-2 text-lg text-zinc-300 hover:text-emerald-400"
          >
            🛒
            {jumlahKeranjang > 0 && (
              <span className="badge absolute -right-1 -top-1 !min-w-5 !px-1.5 !py-0 text-[11px] font-bold text-zinc-950 bg-emerald-400">
                {jumlahKeranjang}
              </span>
            )}
          </Link>

          {session ? (
            <>
              <Link href="/riwayat" className="btn btn-secondary !py-1.5">Riwayat</Link>
              {isAdmin && (
                <Link href="/dashboard" className="btn btn-primary !py-1.5">
                  Dashboard Admin
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary !py-1.5">Masuk</Link>
              <Link href="/register" className="btn btn-primary !py-1.5">Daftar</Link>
            </>
          )}
        </div>
      </div>
      {/* nav mobile */}
      <nav className="flex gap-1 overflow-x-auto border-t border-zinc-800 px-2 py-2 md:hidden">
        <Link href="/" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">Beranda</Link>
        <Link href="/produk" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">Produk</Link>
        <Link href="/tentang" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">Tentang Kami</Link>
        <Link href="/keranjang" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">Keranjang ({jumlahKeranjang})</Link>
      </nav>
    </header>
  );
}
