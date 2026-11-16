# KING VAPEZONE — Aplikasi Manajemen Penjualan Toko Vape

Aplikasi web untuk mengelola penjualan toko vape **King Vapezone**:
toko online konsumen (beranda, katalog produk, detail produk), manajemen
produk, pencatatan transaksi kasir, laporan penjualan, dan manajemen user —
dibangun dengan keamanan sebagai prioritas utama (tugas mata kuliah
Cyber Security).

> **Tugas Project: Pengembangan & Pengamanan Aplikasi Web** — Next.js
> (App Router) + MySQL (database toko yang sudah ada: `vapezone_deni`).

## Akun

Aplikasi **memakai akun yang sudah ada di database toko** (`vapezone_deni`,
dibuat oleh aplikasi PHP lama). Password di-hash bcrypt `$2y$` oleh PHP dan
**tetap valid** di aplikasi ini karena `bcryptjs` kompatibel dengan format
tersebut (terverifikasi dengan pengujian silang hash PHP ↔ Node).

- Login bisa memakai **email ATAU username** (identik aplikasi lama).
- Akun `admin` (role `admin`) → panel internal: dashboard, produk, penjualan,
  laporan, manajemen user, log aktivitas.
- Akun `customer` → melihat katalog dan mencatat penjualan.
- Registrasi akun baru otomatis ber-role `customer`.

## Fitur

- **Toko konsumen (publik)**: beranda (hero, keunggulan, produk per kategori,
  tentang kami), halaman semua produk dengan pencarian + filter kategori,
  dan halaman detail produk — meniru struktur situs PHP lama dengan tema
  dark-emerald. Tombol **Beli Aja** di setiap kartu produk dan form jumlah
  di halaman detail.
- **Keranjang & checkout** (port aplikasi PHP): keranjang disimpan di cookie
  (`vz_cart`, HttpOnly — padanan session PHP), validasi stok dihitung di
  server termasuk jumlah yang sudah ada di keranjang, checkout wajib login,
  ongkir flat Rp 25.000, nomor order `TRX` + unix time, stok berkurang saat
  checkout dan **kembali otomatis saat pesanan dibatalkan**.
- **Pembayaran & riwayat**: upload bukti transfer (hanya JPG/PNG, maks
  2MB — sama seperti aplikasi lama), pesanan masuk status "Sedang Dicek",
  riwayat pesanan + detail (rincian item, ongkir, info pengiriman, nomor
  resi, tombol hubungi admin via WhatsApp). File bukti disimpan **privat**
  (`uploads/bukti_transfer/`) dan hanya bisa dibuka pemilik pesanan atau
  admin lewat route autentikasi — lebih aman dari versi PHP yang memakai
  folder publik.
- **Manajemen pesanan (admin)**: filter per status (1=Menunggu Bayar s/d
  6=Dibatalkan), detail pesanan lengkap dengan bukti pembayaran, ubah status
  — status "Dikirim" wajib mengisi nomor resi (disimpan ke JSON
  `delivery_data`), pembatalan mengembalikan stok tepat satu kali.
- **Master data (admin)**: kelola kategori & satuan produk (CRUD); data
  yang masih dipakai produk tidak bisa dihapus.
- **Laporan bulanan (admin)**: rekap pesanan berstatus "Selesai" per
  bulan/tahun (`MONTH()`/`YEAR()`) + total omzet, dan halaman **cetak** /
  simpan PDF dengan kop toko & kolom tanda tangan administrator.
- **Autentikasi & otorisasi**: registrasi, login (email/username), logout
  dengan role `admin` dan `customer`. Verifikasi role selalu di sisi server.
- **CRUD data**: produk (tambah/ubah/hapus + **upload foto** JPG/PNG/WEBP
  maks 2MB, kolom SKU/satuan/status), transaksi penjualan kasir (stok
  berkurang otomatis & dikembalikan saat dibatalkan), manajemen user
  (ubah role, hapus).
- **Laporan kasir**: dashboard ringkasan (omzet hari ini, omzet bulan ini,
  grafik 14 hari, produk terlaris, stok menipis), rekap per produk dengan
  filter rentang tanggal, dan **ekspor CSV** (admin).
- **Log aktivitas**: login, CRUD, checkout, upload pembayaran, ubah status
  pesanan, dan ekspor laporan tercatat di tabel `activity_logs`.
- **Fitur tambahan**: pencarian produk, proteksi stok negatif dengan row
  lock (`FOR UPDATE`), halaman "Tentang Kami" dengan lokasi Google Maps.

## Teknologi

| Bagian | Teknologi |
| ------ | --------- |
| Framework | Next.js 16 (App Router, Server Components) |
| Database | MySQL 8 (via `mysql2`, parameterized query, database `vapezone_deni`) |
| UI | Tailwind CSS 4, chart SVG sederhana tanpa dependensi |
| Validasi | Zod |
| Auth | bcryptjs (hash password, kompatibel hash PHP) + jose (JWT HS256) di cookie HttpOnly |
| Hosting | Vercel (HTTPS otomatis) + MySQL hosting (mis. PlanetScale/TiDB/VPS) |

## Instalasi & Menjalankan Lokal

1. **Clone & install**

   ```bash
   npm install
   ```

2. **Siapkan environment variable** — salin `.env.example` menjadi `.env`
   lalu isi:

   | Variable | Keterangan |
   | -------- | ---------- |
   | `DATABASE_URL` | koneksi MySQL, format `mysql://user:password@host:port/nama_database` |
   | `SESSION_SECRET` | kunci JWT, minimal 16 karakter acak. Buat: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

   > Tidak ada secret yang ditulis di source code; semua lewat environment
   > variable, dan `.env` di-gitignore.

3. **Siapkan tabel tambahan** (idempotent — hanya membuat tabel `sales` dan
   `activity_logs`; akun user **tidak** dibuat karena sudah ada di database
   toko):

   ```bash
   npm run seed
   ```

4. **Jalankan**:

   ```bash
   npm run dev     # http://localhost:3000
   npm run build && npm run start   # mode produksi
   ```

## Konfigurasi Environment Variable (untuk deployment)

Di Vercel set dua variable berikut (Project → Settings → Environment
Variables):

- `DATABASE_URL` — connection string MySQL hosting (aktifkan SSL bila
  disediakan provider, mis. `?ssl={"rejectUnauthorized":true}`).
- `SESSION_SECRET` — kunci JWT acak yang berbeda dari dev.

Deploy: push repo ke GitHub → Import Project di Vercel → deploy.
HTTPS dan domain `*.vercel.app` otomatis; custom domain opsional.

## Keamanan yang Diterapkan

| Aspek | Implementasi | Lokasi |
| ----- | ------------ | ------ |
| Hashing password | bcrypt (cost 10), tidak pernah plaintext; kompatibel hash `$2y$` PHP lama | `lib/auth.js` |
| SQL Injection | 100% parameterized query (`?` placeholder), tanpa string concatenation | `lib/db.js`, semua route |
| XSS | Validasi input Zod + semua output otomatis di-escape React; uji payload `<img onerror>` dirender sebagai teks | `lib/validation.js`, komponen UI |
| Sesi | JWT HS256 di cookie `HttpOnly; SameSite=Lax; Secure (prod)` dengan masa berlaku 8 jam, dihapus saat logout | `lib/auth.js` |
| Kontrol akses | Role admin/customer diperiksa di setiap API & halaman server, bukan hanya di UI; guard redirect di `proxy.js` | semua `app/api/**`, `app/(app)/**` |
| Secret | Hanya lewat environment variable; `.env*` di-gitignore | `.env.example` |
| Rate limiting | Login 10×/10 menit, registrasi 5×/jam per IP (in-memory per instance) | `lib/rateLimit.js` |
| CSRF | Cookie `SameSite=Lax` + verifikasi header `Origin` pada semua request mutasi | `lib/auth.js` (`assertSameOrigin`) |
| Security headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS, X-Powered-By disembunyikan | `next.config.mjs` |
| Log aktivitas | Login gagal/berhasil, register, CRUD, ekspor tercatat + IP | `lib/audit.js`, halaman `/logs` |
| CSV injection | Sel CSV berawalan `= + - @` diprefix kutip tunggal | `lib/csv.js` |
| Race condition stok | `SELECT ... FOR UPDATE` dalam transaksi | `app/api/sales/route.js` |

### Hasil Self-Testing Keamanan

Skrip pengujian: `scripts/selftest.mjs` (24 skenario otomatis). Skrip membuat
akun admin & customer **tes sendiri** di database lalu menghapusnya lagi
saat selesai, sehingga data toko tetap bersih. Jalankan saat aplikasi
berjalan:

```bash
npm run selftest
```

Hasil terakhir: **24/24 lolos**, mencakup: security headers, redirect
tanpa login (307), API tanpa login (401), password lemah ditolak (400),
duplikat email/username (409), cookie HttpOnly+SameSite, login salah (401),
SQL Injection login/path-parameter ditolak, CSRF origin asing (403),
privilage escalation customer→API admin (403 semua), rate limiting 429,
payload XSS ter-escape, ekspor CSV 200, logout menghapus cookie.

Temuan selama pengembangan dan perbaikannya:

| # | Temuan | Perbaikan |
| - | ------ | --------- |
| 1 | Field `category` pada API produk wajib, menyebabkan error bila payload API tidak mengirimnya | Diganti `categoryId` (kolom `category_id`) dengan validasi Zod ketat |
| 2 | Rate limiter in-memory bisa memblokir pengujian beruntun karena memakai IP "unknown" di dev | IP diambil dari `X-Forwarded-For` (diset platform hosting di produksi); skrip uji memakai IP simulasi unik per run |
| 3 | Event handler `onError` di Server Component membuat halaman 500 | Gambar produk dipindah ke Client Component `ProductImage` dengan fallback placeholder |

Limitasi yang diketahui (jujur): rate limiter in-memory berlaku per instance
server — untuk skala besar gunakan store bersama (mis. Upstash Redis);
`npm audit --omit=dev` bersih (0 kerentanan), sementara `npm audit` penuh
menunjukkan temuan *moderate* pada **devDependencies** (toolchain ESLint,
transitif `minimatch`) yang tidak memengaruhi runtime produksi.

## Penggunaan AI Agent

Alat: **OpenCode** (model GLM). Bagian yang dibantu:

- Scaffolding struktur project dan penulisan kode (lib keamanan, API routes,
  halaman UI, seed, skema database).
- Migrasi dari PostgreSQL ke MySQL (`vapezone_deni`) dan penyesuaian seluruh
  query/validasi ke skema database toko.
- Redesign toko konsumen meniru situs PHP lama (`C:\laragon\www\vapezone`)
  dengan tema warna tetap dark-emerald.
- Menyusun skrip self-test keamanan dan README ini.
- Contoh prompt utama: *"tolong kerjakan ini sesuai instruksi yang ada di
  filenya, untuk temanya manajemen penjualan toko vape"* (disertai berkas PDF
  ketentuan tugas), *"buatkan tampilannya seperti ini, tapi untuk warna
  seperti sekarang saja dan kalau bisa databasenya ambil dari file ini saja"*
  (disertai folder aplikasi PHP lama).

Cara meninjau & memverifikasi: seluruh kode ditinjau dan diuji langsung —
build produksi (`npm run build`), lint (`npm run lint`), skrip self-test
24 skenario, serta pengujian manual alur bisnis (login admin & customer,
CRUD produk, transaksi dengan perubahan stok, ekspor CSV, halaman publik).
Auth, hashing (termasuk kompatibilitas hash PHP), dan query database
diverifikasi dengan membaca implementasinya (`lib/auth.js`, `lib/db.js`)
dan menguji payload serangan nyata.

## URL Aplikasi

Aplikasi aktif: _diisi setelah deploy ke Vercel, mis. `https://vapezone-xxx.vercel.app`_

Repository: _diisi URL GitHub/GitLab_
