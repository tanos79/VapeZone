import Link from "next/link";

/** Footer toko — meniru footer aplikasi lama dengan tema sekarang. */
export default function ShopFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="mb-2 font-bold text-emerald-400">KING VAPEZONE</p>
          <p className="text-sm text-zinc-400">
            Toko vape terlengkap yang menyediakan berbagai macam kebutuhan vaping
            Anda dengan harga bersaing dan kualitas terjamin.
          </p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-zinc-200">Link Cepat</p>
          <ul className="space-y-1 text-sm text-zinc-400">
            <li><Link href="/" className="hover:text-emerald-400">Beranda</Link></li>
            <li><Link href="/produk" className="hover:text-emerald-400">Daftar Produk</Link></li>
            <li><Link href="/#tentang" className="hover:text-emerald-400">Tentang Kami</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold text-zinc-200">Hubungi Kami</p>
          <p className="text-sm text-zinc-400">📞 0812-3456-7890</p>
          <p className="text-sm text-zinc-400">✉️ info@kingvapezone.com</p>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} King Vapezone Ciawigebang.
      </div>
    </footer>
  );
}
