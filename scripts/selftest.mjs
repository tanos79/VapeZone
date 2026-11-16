/**
 * Self-testing keamanan VapeZone.
 * Jalankan saat aplikasi berjalan:  npm run selftest   (atau node --env-file=.env scripts/selftest.mjs [baseURL])
 * Contoh:                           node --env-file=.env scripts/selftest.mjs http://localhost:3000
 *
 * Cakupan (sesuai tugas): SQL Injection, XSS, kontrol akses/IDOR,
 * autentikasi & sesi (password lemah, rate limit, logout), security headers,
 * CSRF (origin check), dan mitigasi CSV injection.
 * CATATAN: hasil otomatis ini tetap wajib diverifikasi manual di browser.
 *
 * Skrip membuat akun tes sendiri (admin + customer) lalu MENGHAPUSNYA lagi
 * di akhir, sehingga data toko (database vapezone_deni) tetap bersih.
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const BASE = process.argv[2] || "http://localhost:3000";
const stamp = Date.now().toString(36);
const ADMIN_USER = `admtes${stamp}`.slice(0, 16);
const CUST_USER = `cstes${stamp}`.slice(0, 16);
const CUST_EMAIL = `cstes${stamp}@example.com`;
const ADMIN_PASS = "TesAdmin99";
const CUST_PASS = "TesCustomer99";

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

function getCookie(res, name) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const [k, v] = pair.split("=");
    if (k.trim() === name) return v;
  }
  return null;
}

async function login(identifier, password, ip, extraHeaders = {}) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ip ? { "X-Forwarded-For": ip } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify({ identifier, password }),
    redirect: "manual",
  });
  return res;
}

// IP simulasi unik per run agar rate limiter tidak meneruskan batas run sebelumnya.
// (Limiter membaca X-Forwarded-For yang di produksi diset platform hosting.)
const RUN_IP = `172.16.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`;

let db;

/** Buat akun admin tes langsung di DB (password diketahui skrip sendiri). */
async function seedTestAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASS, 10);
  await db.query(
    `INSERT INTO users (name, email, username, password, role)
     VALUES (?, ?, ?, ?, 'admin')`,
    ["Admin Tes", `admtes${stamp}@example.com`, ADMIN_USER, hash]
  );
}

/** Hapus semua jejak akun/produk tes (idempotent). */
async function cleanup(createdProductIds = []) {
  try {
    const likeUsers = [ADMIN_USER, CUST_USER, CUST_EMAIL, `admtes${stamp}@example.com`];
    const placeholders = likeUsers.map(() => "?").join(",");
    const [users] = await db.query(
      `SELECT id FROM users WHERE username IN (${placeholders}) OR email IN (${placeholders})`,
      [...likeUsers, ...likeUsers]
    );
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      const inClause = ids.map(() => "?").join(",");
      await db.query(`DELETE FROM sales WHERE user_id IN (${inClause})`, ids);
      await db.query(`DELETE FROM customers WHERE user_id IN (${inClause})`, ids);
      await db.query(`DELETE FROM activity_logs WHERE user_id IN (${inClause})`, ids);
      await db.query(`DELETE FROM users WHERE id IN (${inClause})`, ids);
    }
    for (const id of createdProductIds) {
      await db.query("DELETE FROM sales WHERE product_id = ?", [id]);
      await db.query("DELETE FROM products WHERE id = ?", [id]);
    }
  } catch (err) {
    console.error("Peringatan: pembersihan data tes gagal:", err.message);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL tidak tersedia. Jalankan dengan: npm run selftest");
    process.exit(1);
  }
  db = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 2 });

  console.log(`\nSelf-test keamanan VapeZone → ${BASE}`);
  console.log(`(simulasi IP: ${RUN_IP})\n`);

  const createdProductIds = [];
  let adminCookie = null;
  let userCookie = null;

  try {
    // ============ 1. Security headers ============
    const page = await fetch(`${BASE}/login`, { redirect: "manual" });
    const h = page.headers;
    record(
      "Security headers lengkap",
      h.get("content-security-policy") && h.get("x-frame-options") && h.get("x-content-type-options") && h.get("referrer-policy"),
      `CSP=${!!h.get("content-security-policy")} XFO=${h.get("x-frame-options")} XCTO=${h.get("x-content-type-options")} RP=${h.get("referrer-policy")}`
    );
    record("X-Powered-By disembunyikan", !h.get("x-powered-by"));

    // ============ 2. Halaman privat tanpa login → redirect ============
    const guard = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
    record(
      "Tanpa login: /dashboard dialihkan ke /login",
      guard.status === 307 || guard.status === 302 || guard.status === 308,
      `status=${guard.status} lokasi=${guard.headers.get("location")}`
    );
    const apiGuard = await fetch(`${BASE}/api/products`);
    record("API tanpa login ditolak 401", apiGuard.status === 401, `status=${apiGuard.status}`);

    // ============ 3. Password lemah ditolak ============
    const weak = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": BASE, "X-Forwarded-For": RUN_IP },
      body: JSON.stringify({ username: `w${stamp}`, name: "Tes Lemah", email: `w${stamp}@example.com`, password: "1234" }),
    });
    record("Registrasi password lemah ditolak 400", weak.status === 400, `status=${weak.status}`);

    const weak2 = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": BASE, "X-Forwarded-For": RUN_IP },
      body: JSON.stringify({ username: `w2${stamp}`, name: "Tes Lemah", email: `w2${stamp}@example.com`, password: "abcdefghi" }),
    });
    record("Password tanpa angka ditolak 400", weak2.status === 400, `status=${weak2.status}`);

    // ============ 4. Registrasi normal + duplikat ============
    const reg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": BASE, "X-Forwarded-For": RUN_IP },
      body: JSON.stringify({ username: CUST_USER, name: "Customer Tes", email: CUST_EMAIL, password: CUST_PASS }),
    });
    record("Registrasi akun customer sukses 201", reg.status === 201, `status=${reg.status}`);
    const dup = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": BASE, "X-Forwarded-For": RUN_IP },
      body: JSON.stringify({ username: CUST_USER, name: "Duplikat", email: CUST_EMAIL, password: CUST_PASS }),
    });
    record("Registrasi email/username duplikat ditolak 409", dup.status === 409, `status=${dup.status}`);

    // ============ 5. Login + cookie sesi ============
    // Login bisa memakai email ATAU username (identik aplikasi lama).
    const loginOk = await login(CUST_USER, CUST_PASS, RUN_IP);
    const setCookie = loginOk.headers.getSetCookie?.().join(" | ") || "";
    record(
      "Cookie sesi HttpOnly + SameSite=Lax",
      setCookie.includes("HttpOnly") && setCookie.includes("SameSite=Lax"),
      setCookie.replace(/vz_session=[^;]+/, "vz_session=<JWT>")
    );
    userCookie = `vz_session=${getCookie(loginOk, "vz_session")}`;

    const badLogin = await login(CUST_USER, "salahbanget99", RUN_IP);
    record("Login password salah ditolak 401", badLogin.status === 401, `status=${badLogin.status}`);

    // ============ 6. SQL Injection ============
    const sqli1 = await login("admin' OR '1'='1' -- ", "apa saja", RUN_IP);
    record(
      "SQLi pada login tidak lolos",
      sqli1.status === 401 || sqli1.status === 400,
      `status=${sqli1.status}`
    );

    // Login admin tes (dibuat skrip di DB) untuk uji endpoint admin.
    await seedTestAdmin();
    const adminLogin = await login(ADMIN_USER, ADMIN_PASS, RUN_IP);
    record("Admin tes berhasil login (uji endpoint admin)", adminLogin.status === 200, `status=${adminLogin.status}`);
    adminCookie = `vz_session=${getCookie(adminLogin, "vz_session")}`;

    const sqliProd = await fetch(`${BASE}/api/products/${encodeURIComponent("1; DELETE FROM products--")}`, {
      method: "DELETE",
      headers: { "Cookie": adminCookie, "Origin": BASE },
    });
    record(
      "SQLi pada path parameter id ditolak",
      sqliProd.status === 400,
      `status=${sqliProd.status}`
    );

    // ============ 7. Kontrol akses customer → API admin ============
    const gUsers = await fetch(`${BASE}/api/users`, { headers: { "Cookie": userCookie } });
    record("Customer: GET /api/users ditolak 403", gUsers.status === 403, `status=${gUsers.status}`);

    const gProd = await fetch(`${BASE}/api/products`, {
      method: "POST",
      headers: { "Cookie": userCookie, "Content-Type": "application/json", "Origin": BASE },
      body: JSON.stringify({ name: "Makhluk Gelap", categoryId: 1, price: 5000, stock: 1 }),
    });
    record("Customer: POST /api/products ditolak 403", gProd.status === 403, `status=${gProd.status}`);

    const gSaleDel = await fetch(`${BASE}/api/sales/1`, {
      method: "DELETE",
      headers: { "Cookie": userCookie, "Origin": BASE },
    });
    record("Customer: DELETE /api/sales/1 ditolak 403", gSaleDel.status === 403, `status=${gSaleDel.status}`);

    const gExport = await fetch(`${BASE}/api/reports/sales/export`, { headers: { "Cookie": userCookie } });
    record("Customer: ekspor CSV ditolak 403", gExport.status === 403, `status=${gExport.status}`);

    const gPatch = await fetch(`${BASE}/api/users/3`, {
      method: "PATCH",
      headers: { "Cookie": userCookie, "Content-Type": "application/json", "Origin": BASE },
      body: JSON.stringify({ role: "customer" }),
    });
    record("Customer: PATCH role admin ditolak (privilage escalation diblok)", gPatch.status === 403, `status=${gPatch.status}`);

    // ============ 8. CSRF / Origin mismatch ============
    const csrf = await login(CUST_USER, CUST_PASS, null, {
      Origin: "https://evil.example",
      "X-Forwarded-For": RUN_IP,
    });
    record(
      "Login dari origin asing ditolak 403 (CSRF)",
      csrf.status === 403,
      `status=${csrf.status}`
    );

    // ============ 9. Rate limiting login ============
    const rlIp = `9.9.9.${Math.floor(Math.random() * 200) + 1}`;
    let got429 = 0;
    for (let i = 0; i < 12; i++) {
      const r = await login("tidak_ada_user", "salahbanget", rlIp);
      if (r.status === 429) got429++;
    }
    record("Rate limiting: percobaan login ke-11+ mendapat 429", got429 > 0, `jumlah 429 = ${got429}`);

    // ============ 10. XSS ============
    // Admin sudah login; buat produk berisi payload XSS lalu cek render halaman.
    const xssName = `<img src=x onerror=alert(1)>${stamp}`;
    const xssProd = await fetch(`${BASE}/api/products`, {
      method: "POST",
      headers: { "Cookie": adminCookie, "Content-Type": "application/json", "Origin": BASE },
      body: JSON.stringify({ name: xssName, categoryId: 1, price: 15000, stock: 3 }),
    });
    record("Admin dapat membuat produk (prasyarat uji XSS)", xssProd.status === 201, `status=${xssProd.status}`);
    if (xssProd.status === 201) {
      const data = await xssProd.json();
      if (data.product?.id) createdProductIds.push(data.product.id);
    }

    const productsPage = await fetch(`${BASE}/products`, { headers: { "Cookie": adminCookie } });
    const html = await productsPage.text();
    const rawInjected = html.includes("<img src=x");
    record(
      "Payload XSS dirender sebagai teks (escaped), bukan tag hidup",
      !rawInjected,
      rawInjected ? "DITEMUKAN tag mentah di HTML!" : "output ter-escape oleh React"
    );

    // ============ 11. CSV export admin ============
    const csv = await fetch(`${BASE}/api/reports/sales/export`, { headers: { "Cookie": adminCookie } });
    record("Admin: ekspor CSV sukses 200", csv.status === 200, `status=${csv.status} type=${csv.headers.get("content-type")}`);

    // ============ 12. Logout menghapus sesi ============
    const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Cookie": adminCookie, "Origin": BASE },
    });
    const cleared = logoutRes.headers.getSetCookie?.().join(" | ") || "";
    record("Logout menghapus cookie sesi (Max-Age=0)", cleared.includes("Max-Age=0"));
  } finally {
    // Pembersihan: hapus akun & produk tes agar database tetap bersih.
    await cleanup(createdProductIds);
    await db.end().catch(() => {});
  }

  // Ringkasan
  const failed = results.filter((r) => !r.passed);
  console.log(`\n===== ${results.length - failed.length}/${results.length} skenario lolos =====`);
  if (failed.length > 0) {
    console.log("GAGAL:");
    failed.forEach((f) => console.log(` - ${f.name}`));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Self-test gagal jalan:", e);
  process.exitCode = 1;
});
