# -*- coding: utf-8 -*-
"""
Membuat Laporan Tugas Project (DOCX) aplikasi VapeZone
mengikuti struktur template TugasProject_CyberSec (Bychick).
Bagian cover (nama/NIM/kelas), URL aplikasi, dan URL repository
sengaja dikosongkan untuk diisi mahasiswa.
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

doc = Document()

# ---------- gaya dasar ----------
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(11)

for section in doc.sections:
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)


def heading(text, level=1):
    return doc.add_heading(text, level=level)


def para(text, bold=False, center=False, size=None, italic=False, space_after=6):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    if size:
        run.font.size = Pt(size)
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(space_after)
    return p


def bullet(text):
    p = doc.add_paragraph(text, style="List Bullet")
    p.paragraph_format.space_after = Pt(2)
    return p


def numbered(text):
    p = doc.add_paragraph(text, style="List Number")
    p.paragraph_format.space_after = Pt(2)
    return p


def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        run = hdr[i].paragraphs[0].add_run(h)
        run.bold = True
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = str(val)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Cm(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


# ================= COVER =================
para("", space_after=24)
para("TUGAS PROJECT", bold=True, center=True, size=20)
para("Pengembangan & Pengamanan Aplikasi Web", bold=True, center=True, size=14)
para("", space_after=18)
para("Toko Online & Manajemen Penjualan KING VAPEZONE", bold=True, center=True, size=16)
para("(Port aplikasi PHP lama ke Next.js dengan keamanan menyeluruh)", center=True, italic=True, size=11)
para("", space_after=12)
para("Disusun untuk Memenuhi Project Mata Kuliah Keamanan Cyber", center=True)
para("", space_after=6)
para("Dosen pengampu :", center=True)
para("Fitra Nugraha, S.kom., M.kom", center=True, bold=True)
para("", space_after=18)
para("Oleh", center=True)
para("..............................................", center=True)  # nama
para("(........................................)", center=True)  # NIM
para("", space_after=24)
para("UNIVERSITAS KUNINGAN", bold=True, center=True, size=14)
para("FAKULTAS ILMU KOMPUTER", bold=True, center=True, size=12)
para("PRODI TEKNIK INFORMATIKA", bold=True, center=True, size=12)
para("", space_after=6)
para("2026", bold=True, center=True)
doc.add_page_break()

# ================= 1. IDENTITAS =================
heading("1. Identitas", level=1)
table(
    ["Keterangan", "Isi"],
    [
        ["Nama", ""],
        ["NIM", ""],
        ["Kelas", ""],
        ["Mata kuliah", "Cyber Security"],
        ["Judul tugas", "VapeZone -- toko online (katalog, keranjang, checkout, "
                        "bukti transfer, verifikasi admin, pengiriman) dan panel "
                        "manajemen penjualan, port dari aplikasi PHP lama ke Next.js"],
    ],
    widths=[5, 10.5],
)

# ================= 2. URL APLIKASI =================
heading("2. URL Aplikasi Aktif", level=1)
table(
    ["Item", "URL"],
    [
        ["Aplikasi (FQDN + HTTPS)", ""],
        ["Katalog toko (publik)", ""],
    ],
    widths=[7, 8.5],
)

# ================= 3. URL REPOSITORY =================
heading("3. URL Repository Git", level=1)
table(
    ["Item", "URL"],
    [
        ["Repository", ""],
    ],
    widths=[7, 8.5],
)

# ================= 4. AKUN UJI =================
heading("4. Akun Uji Coba", level=1)
para("Akun berikut siap dipakai dosen untuk menguji seluruh fitur:", space_after=4)
table(
    ["Peran", "Username", "Password", "Hak akses"],
    [
        ["Admin", "admin", "admin123",
         "Semua fitur: panel manajemen (dashboard, kelola produk + upload foto, "
         "kategori & satuan, kasir, pesanan online, laporan kasir, laporan bulanan "
         "+ cetak, user, log aktivitas, ekspor CSV) serta tetap bisa berbelanja "
         "seperti customer"],
        ["Customer", "denikasep", "123",
         "Toko: katalog, keranjang, checkout, upload bukti transfer, riwayat "
         "pesanan & detail"],
    ],
    widths=[2.5, 2.5, 2.5, 8],
)
para("Akun customer di atas adalah akun asli bawaan database toko (dari aplikasi "
     "PHP lama) -- hash bcrypt PHP-nya tetap valid di aplikasi ini. Registrasi akun "
     "customer baru juga terbuka bagi siapa saja di halaman /register "
     "dengan validasi kekuatan password (minimal 8 karakter, kombinasi huruf & angka).",
     size=10, italic=True)

# ================= 5. PENJELASAN APLIKASI =================
heading("5. Penjelasan Aplikasi", level=1)

heading("5.1 Latar Belakang dan Tujuan", level=2)
para("King Vapezone adalah toko vape di Ciawigebang, Kuningan yang sudah memiliki "
     "aplikasi PHP sederhana (dijalankan lewat Laragon): toko online untuk pelanggan "
     "dan panel admin untuk pengelolaan. Aplikasi lama tersebut berjalan baik secara "
     "fungsi, tetapi ditulis tanpa lapisan keamanan modern: kredensial database "
     "tertulis di source code, query SQL dirangkai dengan string sehingga rentan SQL "
     "injection, bukti transfer disimpan di folder publik yang bisa dibuka siapa "
     "pun, dan tidak ada jejak audit.")
para("Tujuan tugas ini mem-port aplikasi tersebut 1:1 ke Next.js (App Router) dengan "
     "database yang sama (MySQL vapezone_deni), tanpa mengubah satu pun fiturnya, "
     "sekaligus menerapkan keamanan menyeluruh di setiap lapisan: hashing password "
     "bcrypt yang tetap kompatibel dengan akun lama, query ber-parameter, validasi "
     "zod, sesi JWT HttpOnly, kontrol akses peran di server, penyimpanan bukti "
     "pembayaran secara privat, dan audit log aktivitas.")

heading("5.2 Fitur Utama", level=2)
bullet("Registrasi & login (email atau username): password di-hash bcrypt "
       "(bcryptjs kompatibel dengan hash PHP $2y$ akun lama), sesi JWT pada cookie "
       "HttpOnly SameSite=Lax berumur 8 jam.")
bullet("Dua peran (RBAC): ADMIN (panel manajemen penuh + tetap bisa berbelanja) dan "
       "CUSTOMER (toko). Kontrol peran diverifikasi ulang di server pada setiap "
       "halaman dan API, bukan hanya di tampilan.")
bullet("Katalog toko publik: beranda (hero, keunggulan, produk per kategori, tentang "
       "kami), halaman semua produk dengan pencarian & filter kategori, detail produk "
       "dengan form jumlah beli, halaman Tentang Kami dengan peta Google Maps.")
bullet("Keranjang belanja: disimpan di cookie HttpOnly vz_cart (padanan session PHP); "
       "validasi stok dihitung di server termasuk jumlah yang sudah ada di keranjang "
       "(\"Stok tidak cukup! Stok tersedia: X, di keranjang kamu: Y\"); dapat dipakai "
       "tanpa login seperti aplikasi lama.")
bullet("Checkout: wajib login, data penerima otomatis terisi dari profil, ongkir flat "
       "Rp 25.000, nomor invoice TRX + unix time, harga dihitung ulang dari database, "
       "stok berkurang di dalam transaksi database (row-lock).")
bullet("Pembayaran: upload bukti transfer hanya JPG/PNG maksimal 2MB; pesanan berubah "
       "menjadi \"Sedang Dicek\"; berkas bukti disimpan privat (uploads/bukti_transfer) "
       "dan hanya bisa dibuka pemilik pesanan atau admin lewat route autentikasi.")
bullet("Riwayat pesanan: daftar invoice dengan status 1-6 (Menunggu Pembayaran, Sedang "
       "Dicek, Diproses, Dikirim, Selesai, Dibatalkan), detail pesanan berisi rincian "
       "item, ongkir, data pengiriman, nomor resi, dan tombol hubungi admin via WhatsApp.")
bullet("Panel admin -- manajemen pesanan: filter per status, detail lengkap dengan "
       "bukti pembayaran, ubah status (status \"Dikirim\" wajib nomor resi yang "
       "disimpan ke JSON delivery_data; pembatalan mengembalikan stok tepat satu kali).")
bullet("Panel admin -- master data: kelola kategori & satuan produk (CRUD); data yang "
       "masih dipakai produk tidak bisa dihapus (proteksi integritas).")
bullet("Panel admin -- produk: CRUD lengkap dengan upload foto (JPG/PNG/WEBP maks "
       "2MB, nama file diacak) serta kolom SKU, satuan, dan status tersedia/nonaktif.")
bullet("Laporan bulanan: rekap pesanan berstatus \"Selesai\" per bulan/tahun "
       "(MONTH/YEAR) dengan total omzet, plus halaman cetak/PDF berisi kop toko dan "
       "blok tanda tangan administrator.")
bullet("Fitur kasir, laporan kasir (grafik 14 hari, produk terlaris, stok menipis), "
       "ekspor CSV, manajemen user (ubah role), dan log aktivitas -- fitur tambahan "
       "yang dipertahankan dan digabung dengan fitur PHP.")
bullet("Audit trail: login, CRUD, checkout, upload pembayaran, perubahan status "
       "pesanan, dan ekspor tercatat di tabel activity_logs (user, aksi, detail, IP, waktu).")

heading("5.3 Arsitektur dan Teknologi", level=2)
table(
    ["Lapisan", "Teknologi", "Fungsi"],
    [
        ["Frontend", "Next.js 16 (App Router, Server Components), Tailwind CSS 4",
         "Toko konsumen & panel admin; render server + client component"],
        ["Backend", "Route Handlers Next.js (Node runtime)",
         "REST API: auth, cart, orders, pembayaran, products, admin "
         "(categories/units), uploads bukti, sales, users, logs, reports"],
        ["Database", "MySQL 8 via mysql2 (query ber-parameter), database vapezone_deni",
         "users, customers, products, product_category, product_units, orders, "
         "order_items, payments, sales, activity_logs"],
        ["Keamanan", "bcryptjs, jose (JWT), zod, rate limiter in-memory, proxy.js, security headers",
         "hash password, sesi, validasi input, proteksi route per peran"],
        ["File", "uploads/bukti_transfer (privat) + public/img/products (foto produk)",
         "bukti transfer diakses via API autentikasi; foto produk publik"],
        ["Hosting", "Vercel (rencana) -- subdomain publik + HTTPS otomatis",
         "deployment sesuai ketentuan FQDN"],
    ],
    widths=[2.5, 6, 7],
)
para("", space_after=2)
para("Diagram arsitektur (alur permintaan):", bold=True, space_after=2)
para("[ Pelanggan / Admin ]\n"
     "        |  HTTPS\n"
     "        v\n"
     "Next.js\n"
     " |-- proxy.js : proteksi halaman per peran (redirect)\n"
     " |-- halaman toko (publik) : /  /produk  /tentang  /keranjang\n"
     " |-- halaman member : /checkout  /pembayaran  /riwayat  /pesanan-berhasil\n"
     " |-- halaman admin  : /dashboard  /products  /kategori  /orders\n"
     " |                    /laporan  /cetak-laporan  /users  /logs\n"
     " |-- /api/* : verifikasi JWT -> cek peran -> cek Origin (CSRF) ->\n"
     " |            validasi zod -> query SQL ber-parameter -> log aktivitas\n"
     "        v\n"
     "[ MySQL: vapezone_deni ]   [ uploads/bukti_transfer (privat) ]",
     size=10, italic=True)
para("Setiap permintaan API melewati urutan yang sama: verifikasi cookie JWT "
     "(HttpOnly), pemeriksaan peran bila rute memerlukan admin, pemeriksaan Origin "
     "untuk permintaan perubahan data, validasi/sanitasi body dengan zod, lalu query "
     "SQL ber-parameter. Tidak ada string SQL yang dibangun dari input pengguna, dan "
     "semua nilai harga/stok selalu dihitung ulang dari database.")

heading("5.4 Penerapan Keamanan", level=2)
table(
    ["Aspek", "Implementasi", "Lokasi (file)", "Alasan"],
    [
        ["Hashing password", "bcryptjs salt otomatis (10 round); kompatibel dengan "
         "hash PHP $2y$ sehingga akun lama tetap bisa login; password tidak pernah "
         "disimpan plaintext",
         "lib/auth.js", "Melindungi kredensial bila database bocor"],
        ["Validasi & sanitasi input", "zod untuk semua body/form (tipe, panjang, "
         "rentang), skema per endpoint", "lib/validation.js",
         "Mencegah injection & data liar sejak pintu masuk"],
        ["SQL Injection", "Seluruh query memakai placeholder ber-parameter (?), "
         "tidak ada konkatenasi string SQL", "lib/db.js, semua app/api/**/route.js",
         "Praktik teraman untuk query database"],
        ["Manajemen sesi", "JWT (jose) di cookie HttpOnly, SameSite=Lax, umur 8 "
         "jam; logout menghapus cookie",
         "lib/auth.js, proxy.js", "Cookie tak terbaca JavaScript (anti XSS theft)"],
        ["Kontrol akses (RBAC)", "requireApiAuth/requireApiAdmin di awal SETIAP "
         "handler API; halaman admin diverifikasi ulang di server "
         "(requireAdminPage) dan dijaga proxy.js",
         "lib/auth.js, proxy.js, halaman (app)",
         "Mencegah IDOR/privilege escalation -- customer tidak dapat menyentuh API "
         "atau halaman admin"],
        ["Rate limiting", "Bucket per klien: percobaan login ke-11+ ditolak 429",
         "lib (rate limit) + API auth", "Mitigasi brute-force password"],
        ["CSRF protection", "Verifikasi Origin header pada semua POST/PUT/PATCH/"
         "DELETE + cookie SameSite=Lax",
         "lib/auth.js (assertSameOrigin)", "Menolak permintaan lintas situs yang "
         "memakai cookie korban"],
        ["Security headers", "Content-Security-Policy, X-Frame-Options DENY, "
         "X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, "
         "X-Powered-By disembunyikan",
         "next.config.mjs", "Memperkecil dampak XSS, clickjacking, MIME sniffing"],
        ["Rahasia di env var", "SESSION_SECRET & DATABASE_URL dibaca dari "
         "process.env; .env di-gitignore",
         ".env.example", "Secret tidak pernah ada di source code/repo"],
        ["Upload berkas", "Bukti transfer: hanya JPG/PNG maks 2MB; foto produk: "
         "JPG/JPEG/PNG/WEBP maks 2MB; nama file disanitasi + diberi timestamp "
         "(anti path traversal)",
         "lib/upload.js, API pembayaran & products", "Mencegah upload berbahaya "
         "(web shell) dan penimpaan file"],
        ["Akses berkas privat", "Bukti transfer disimpan di luar folder publik dan "
         "disajikan lewat API yang mengecek pemilik pesanan atau admin",
         "app/api/uploads/bukti/[file]/route.js",
         "Bukti pembayaran adalah data pribadi (perbaikan dari versi PHP yang "
         "menyimpannya di folder publik)"],
        ["Harga & stok server-side", "Harga dihitung ulang dari tabel products saat "
         "menambah keranjang dan checkout; input klien tidak pernah dipercaya; "
         "stok dikurangi dalam transaksi (UPDATE ... WHERE stock >= qty)",
         "app/api/cart, app/api/orders", "Mencegah manipulasi harga dan stok "
         "minus dari sisi klien"],
        ["Log aktivitas", "Login, CRUD, checkout, pembayaran, ubah status pesanan, "
         "ekspor -- tercatat dengan user, aksi, detail, waktu",
         "lib/audit.js, tabel activity_logs", "Audit trail untuk investigasi insiden"],
    ],
    widths=[3, 5.5, 3.5, 4],
)

# ================= 6. POTENSI SKRIPSI =================
heading("6. Potensi Pengembangan ke Skripsi", level=1)
para("Aplikasi ini dibangun di atas database toko yang sudah berisi data riil "
     "(produk, pesanan, pembayaran), sehingga beberapa arah penelitian yang "
     "realistis:", space_after=4)
bullet("Deteksi penipuan bukti transfer: tabel payments menyimpan berkas bukti dan "
       "status verifikasi manual; klasifikasi otomatis (OCR/keaslian gambar, "
       "duplikasi berkas) dapat diteliti sebagai decision support verifikasi admin.")
bullet("Evaluasi RBAC + audit trail: dengan log aktivitas yang lengkap, model "
       "anomali dapat mendeteksi perilaku abnormal (ekspor massal, perubahan status "
       "tidak wajar) -- cocok untuk topik insider threat detection.")
bullet("Integrasi payment gateway: QRIS/dinamis memunculkan permukaan serangan baru "
       "(verifikasi webhook, replay attack) untuk topik secure API integration.")
bullet("Coupon & review: tabel coupons dan reviews sudah ada di database tetapi "
       "belum dipakai aplikasi lama; penerapannya menimbulkan masalah menarik "
       "(validasi kupon bebas race condition, moderasi review).")
bullet("Mode offline-first (PWA) untuk kasir dengan sinkronisasi konflik klasik "
       "offline-online.")

# ================= 7. PENGGUNAAN AI AGENT =================
heading("7. Penggunaan AI Agent", level=1)
para("Sesuai ketentuan (poin 3e), penggunaan AI dilaporkan secara jujur sebagai "
     "berikut:", space_after=4)
table(
    ["Item", "Keterangan"],
    [
        ["Alat yang dipakai", "OpenCode (AI coding agent) dengan model GLM (Z.ai) "
         "untuk menulis kode, debugging, pengujian, dan menyusun dokumentasi"],
        ["Bagian pekerjaan yang dibantu",
         "Inventarisasi fitur aplikasi PHP lama (24 file root + 14 file admin), "
         "porting halaman & API (keranjang, checkout, pembayaran, riwayat, pesanan "
         "admin, master data, laporan bulanan, upload foto), skrip uji keamanan "
         "24 skenario (selftest.mjs), README, dan laporan ini"],
        ["Contoh prompt utama",
         "\"Generate program ini dari PHP ke Next.js tanpa perubahan fitur apa pun "
         "(folder: C:\\laragon\\www\\vapezone)\"; \"tambahkan upload foto produk "
         "multipart dengan validasi ekstensi dan ukuran\"; \"ubah status pesanan: "
         "status 4 simpan resi ke delivery_data JSON, status 6 kembalikan stok tepat "
         "satu kali seperti pesanan_act.php\""],
        ["Cara saya mengawasi & memverifikasi",
         "Setiap hasil AI saya jalankan dan uji langsung di browser (alur belanja "
         "end-to-end dengan akun demo: beli, checkout, upload bukti, verifikasi "
         "admin, batalkan dan cek stok kembali). Saya membaca langsung kode "
         "autentikasi/query untuk memahami mekanismenya, menjalankan skrip "
         "selftest keamanan (Bagian 8), lint dan build produksi, serta meninjau "
         "diff sebelum commit"],
        ["Rahasia tidak dibagikan ke AI",
         "Tidak ada password asli, API key, atau data pribadi dalam prompt -- akun "
         "demo hanya untuk aplikasi uji"],
    ],
    widths=[4.5, 11],
)

# ================= 8. SELF-TESTING =================
heading("8. Hasil Self-Testing Keamanan", level=1)
para("Pengujian dilakukan dengan skrip otomatis scripts/selftest.mjs (fetch HTTP "
     "langsung ke API) dan pengujian manual di browser. Skrip menguji 24 skenario "
     "(ketentuan minimal 5) dan hasilnya konsisten lolos setiap dijalankan "
     "(24/24). Tabel berikut merangkumnya:", space_after=4)
table(
    ["No", "Skenario uji", "Cara pengujian", "Hasil", "Status"],
    [
        ["1", "Security headers lengkap", "Cek header respons "
         "(CSP, X-Frame-Options DENY, nosniff, Referrer-Policy)",
         "Semua header terpasang", "Lolos"],
        ["2", "X-Powered-By disembunyikan", "Cek header respons", "Header tidak ada", "Lolos"],
        ["3", "Proteksi halaman privat", "Buka /dashboard tanpa login",
         "Redirect 307 ke /login?next=...", "Lolos"],
        ["4", "API tanpa sesi", "Panggil API terproteksi tanpa cookie",
         "401 \"Belum login\"", "Lolos"],
        ["5-6", "Registrasi password lemah", "POST register password \"abc\" / tanpa angka",
         "400 dengan pesan kebijakan password", "Lolos"],
        ["7", "Registrasi customer baru", "POST register data valid", "201 sukses", "Lolos"],
        ["8", "Duplikat email/username", "Registrasi ulang data sama",
         "409 ditolak", "Lolos"],
        ["9", "Cookie sesi aman", "Periksa Set-Cookie login",
         "HttpOnly + SameSite=Lax", "Lolos"],
        ["10", "Login password salah", "POST login password benar-benar salah",
         "401", "Lolos"],
        ["11", "SQL Injection di login", "Input ' OR 1=1 -- di identifier/password",
         "401 (query ber-parameter), tidak ada bypass", "Lolos"],
        ["12", "Login admin + endpoint admin", "Login admin, akses endpoint admin",
         "200", "Lolos"],
        ["13", "SQL Injection di parameter path", "Payload ' OR 1=1 -- pada /api/.../[id]",
         "400 (validasi ID numerik)", "Lolos"],
        ["14-15", "Customer membaca/mengubah data admin",
         "Customer GET /api/users, POST /api/products", "403 Akses ditolak", "Lolos"],
        ["16-17", "Customer menyalahgunakan kasir & ekspor",
         "DELETE /api/sales/1, ekspor CSV", "403 Akses ditolak", "Lolos"],
        ["18", "Privilege escalation", "Customer PATCH role dirinya jadi admin",
         "403 ditolak", "Lolos"],
        ["19", "CSRF origin asing", "Login dengan header Origin berbeda",
         "403 permintaan tidak sah", "Lolos"],
        ["20", "Rate limiting login", "11+ percobaan login beruntun satu IP",
         "Percobaan ke-11+ ditolak 429", "Lolos"],
        ["21", "Admin membuat produk", "POST /api/products valid", "201 sukses", "Lolos"],
        ["22", "XSS pada input", "Simpan produk <script>alert(1)</script>, "
         "tampilkan di halaman", "Dirender sebagai teks (escaped), tidak ada eksekusi", "Lolos"],
        ["23", "Ekspor CSV admin", "GET export CSV", "200 text/csv", "Lolos"],
        ["24", "Logout menghapus sesi", "Cek Set-Cookie logout",
         "Max-Age=0 (cookie terhapus)", "Lolos"],
    ],
    widths=[1.4, 4, 5, 4, 1.6],
)
para("Pengujian manual tambahan (di browser dengan akun demo & admin):", bold=True, space_after=4)
bullet("Alur belanja end-to-end: tambah ke keranjang (badge navbar terupdate) -> "
       "checkout (invoice TRX..., total = belanja + ongkir 25.000) -> upload bukti "
       "(status jadi \"Sedang Dicek\") -> admin membuka bukti -> ubah status "
       "\"Dikirim\" + resi tersimpan di JSON -> pembatalan mengembalikan stok, dan "
       "pembatalan kedua TIDAK menambah stok dua kali.")
bullet("Validasi upload: file selain JPG/PNG dan ukuran > 2MB ditolak dengan pesan "
       "sama seperti aplikasi lama.")
bullet("Bukti transfer tanpa login ditolak 401; berkas bukti orang lain tidak bisa "
       "dibuka oleh customer lain (cek pemilik di route penyaji).")
bullet("Kategori/satuan yang masih dipakai produk tidak bisa dihapus (409).")

# ================= 9. TANGKAPAN LAYAR =================
heading("9. Tangkapan Layar", level=1)
screenshots = [
    ("a. Halaman registrasi & login", "Halaman login dan registrasi dengan validasi password."),
    ("b. Halaman toko (publik)", "Beranda (hero, produk per kategori dengan tombol Beli Aja), "
     "halaman semua produk, detail produk dengan form jumlah beli, halaman Tentang Kami dengan peta."),
    ("c. Keranjang & checkout", "Keranjang belanja (subtotal, total), halaman checkout "
     "(data pengiriman + ringkasan), halaman pesanan berhasil."),
    ("d. Pembayaran & riwayat", "Halaman konfirmasi pembayaran (upload bukti), riwayat "
     "pesanan dengan status, detail pesanan (resi, tombol WhatsApp)."),
    ("e. Panel admin -- pengelolaan data", "Dashboard, kelola produk (upload foto, SKU, "
     "satuan, status), kategori & satuan."),
    ("f. Panel admin -- pesanan & laporan", "Pesanan online (filter status), detail pesanan "
     "(bukti pembayaran + ubah status/resi), laporan bulanan, halaman cetak laporan."),
    ("g. Log aktivitas", "Audit trail login, transaksi, perubahan data, ekspor."),
    ("h. Bukti HTTPS/domain + hosting/DNS",
     "[TEMPEL tangkapan layar setelah deploy: gembok di browser pada URL produksi, "
     "detail sertifikat, dan dashboard Vercel (Domains).]"),
    ("i. Bukti self-testing",
     "[TEMPEL tangkapan keluaran konsol 24/24 skenario lolos (Bagian 8) atau uji "
     "manual di browser, mis. peringatan 429 saat uji rate-limit atau header respons "
     "yang diperiksa lewat DevTools.]"),
]
gambar_no = 1
for judul, isi in screenshots:
    heading(f"{judul}", level=2)
    para(f"[Tempel tangkapan layar di sini -- {isi}]", italic=True, size=10)
    para(f"Gambar {gambar_no}. {isi.split('.')[0].capitalize()}.", size=9)
    gambar_no += 1

# ================= 10. KENDALA =================
heading("10. Kendala dan Rencana Perbaikan", level=1)
bullet("Deployment belum selesai: aplikasi berjalan lokal (Laragon MySQL); "
       "rencananya di-push ke GitHub lalu di-deploy ke Vercel sebelum batas "
       "pengumpulan (URL di Bagian 2 dan 3 akan diisi setelah deploy).")
bullet("Penyimpanan berkas di disk: uploads/bukti_transfer dan foto produk ditulis "
       "ke filesystem server, yang pada Vercel bersifat sementara (ephemeral). "
       "Rencana perbaikan: pindahkan ke object storage (Vercel Blob/S3) saat "
       "deployment, dengan logika akses privat bukti transfer tetap sama.")
bullet("Rate limiter in-memory: ter-reset saat server restart dan per-server bila "
       "multi-instance; rencana perbaikan: pindahkan ke penyimpanan bersama "
       "(mis. Upstash Redis).")
bullet("Password akun customer lama selain denikasep tidak diketahui isinya: hash "
       "bcrypt-nya kompatibel dan bisa login bila pemiliknya ingat password "
       "asli; untuk keperluan uji dosen dipakai akun denikasep (Bagian 4).")
bullet("Kode voucher (tabel coupons) dan ulasan produk (tabel reviews) sudah ada di "
       "database toko tetapi memang belum dipakai aplikasi PHP lama, sehingga "
       "sesuai ketentuan \"tanpa perubahan fitur\" belum di-port; masuk rencana "
       "pengembangan (Bagian 6).")

doc.save(r"D:\Projects\sahabat_akses\vapezone\Laporan_TugasProject_VapeZone.docx")
print("OK: Laporan_TugasProject_VapeZone.docx dibuat")
