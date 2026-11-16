import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Proxy (pengganti middleware di Next.js 16) — penjaga halaman:
// - Halaman privat dibatasi hanya untuk user yang sudah login.
// - Halaman admin dibatasi hanya untuk role admin.
// CATATAN: ini lapisan UX/redirect; otorisasi sesungguhnya tetap
// diverifikasi ulang di setiap halaman dan Route Handler (defense in depth).
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  // Halaman publik (toko konsumen) boleh diakses tanpa login — sama dengan
  // aplikasi lama: katalog, detail, tentang, dan keranjang (keranjang = session).
  const isPublicPage =
    pathname === "/" ||
    pathname === "/produk" ||
    pathname.startsWith("/produk/") ||
    pathname === "/tentang" ||
    pathname === "/keranjang";
  // Halaman admin (port admin/*.php).
  const isAdminPage =
    pathname.startsWith("/users") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/kategori") ||
    pathname.startsWith("/laporan") ||
    pathname.startsWith("/cetak-laporan");
  // Halaman checkout/pembayaran/riwayat tidak masuk daftar publik →
  // otomatis wajib login lewat penjaga di bawah (sama seperti PHP).

  if (!session) {
    if (isAuthPage || isPublicPage) return NextResponse.next();
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Halaman publik dan halaman auth tidak diblokir; user yang sudah login
  // tetap bisa melihat katalog.
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAdminPage && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard?denied=1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Jalankan di semua halaman, kecuali API, aset statis, dan metadata files.
    // Route Handler tetap diverifikasi di dalam handler masing-masing.
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
