import Link from "next/link";

// Halaman "Tentang Kami" — port dari about.php dengan tema dark-emerald.
export const metadata = { title: "Tentang Kami — KING VAPEZONE" };

const KEUNGGULAN = [
  {
    icon: "💰",
    title: "Harga Kompetitif",
    desc: "Kami menawarkan harga terbaik di pasaran tanpa mengorbankan kualitas produk.",
  },
  {
    icon: "👍",
    title: "Pelayanan Ramah",
    desc: "Admin kami siap melayani konsultasi dan pertanyaan Anda 24/7 dengan ramah.",
  },
  {
    icon: "🚀",
    title: "Pengiriman Kilat",
    desc: "Packing aman (bubble wrap tebal) dan pengiriman dilakukan setiap hari.",
  },
];

export default function TentangPage() {
  return (
    <main>
      {/* Intro */}
      <section className="border-b border-zinc-800 bg-zinc-900/40 py-14 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <span className="badge border border-emerald-500/40 bg-emerald-950/50 px-4 py-2 text-xs font-bold text-emerald-300">
            TENTANG KAMI
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-white">
            Kenalan Dulu dengan <span className="text-emerald-400">KING VAPEZONE</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Toko vape terlengkap yang menyediakan berbagai macam kebutuhan vaping
            Anda dengan harga bersaing dan kualitas terjamin.
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded bg-emerald-500" />
        </div>
      </section>

      {/* Keunggulan */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
          {KEUNGGULAN.map((f) => (
            <div key={f.title} className="card text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl">
                {f.icon}
              </div>
              <h5 className="font-bold text-zinc-100">{f.title}</h5>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kunjungi store */}
      <section className="pb-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="card grid gap-0 overflow-hidden !p-0 md:grid-cols-2">
            <div className="p-8">
              <h2 className="mb-6 text-2xl font-bold text-zinc-100">Kunjungi Store Kami</h2>

              <div className="mb-5 flex gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <h5 className="font-bold text-emerald-400">Alamat</h5>
                  <p className="text-sm text-zinc-400">
                    Jl. Raya Susukan, Ciputat,
                    <br />
                    Kec. Ciawigebang, Kab. Kuningan,
                    <br />
                    Jawa Barat 45591
                  </p>
                </div>
              </div>

              <div className="mb-5 flex gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <h5 className="font-bold text-emerald-400">WhatsApp</h5>
                  <p className="text-sm text-zinc-400">0857-0784-3132</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-xl">🕒</span>
                <div>
                  <h5 className="font-bold text-emerald-400">Jam Operasional</h5>
                  <p className="text-sm text-zinc-400">Senin - Minggu: 10.00 - 22.00 WIB</p>
                </div>
              </div>

              <Link href="/produk" className="btn btn-primary mt-8 rounded-full px-6">
                Lihat Produk Kami →
              </Link>
            </div>
            <div className="min-h-72">
              <iframe
                src="https://maps.google.com/maps?q=KING+VAPEZONE+CIAWIGEBANG&hl=id&z=14&output=embed"
                width="100%"
                height="450"
                style={{ border: 0, minHeight: "100%" }}
                title="Lokasi King Vapezone"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
