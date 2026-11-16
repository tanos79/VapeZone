import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ==================== Konstanta sesi ====================
export const SESSION_COOKIE = "vz_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 jam

const secretKeyCache = { encoded: null };

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET belum diisi (minimal 16 karakter). Set di file .env — lihat .env.example"
    );
  }
  if (!secretKeyCache.encoded) {
    secretKeyCache.encoded = new TextEncoder().encode(secret);
  }
  return secretKeyCache.encoded;
}

// ==================== Password (bcrypt) ====================
// Password TIDAK PERNAH disimpan plaintext — selalu di-hash bcrypt.
export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ==================== JWT ====================
export async function createSessionToken(payload) {
  return new SignJWT({
    sub: payload.sub,
    username: payload.username,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.role) return null;
    return {
      userId: Number(payload.sub),
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null; // token rusak/kadaluarsa/tanda tangan salah
  }
}

// ==================== Cookie ====================
export function sessionCookieOptions() {
  return {
    httpOnly: true, // tidak bisa dibaca JavaScript browser → mitigasi XSS
    sameSite: "lax", // mitigasi CSRF (cookie tak dikirim cross-site POST)
    secure: process.env.NODE_ENV === "production", // hanya HTTPS di produksi
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** Ambil sesi user yang sedang login (null bila tidak ada). */
export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ==================== Helper API ====================
export function unauthorized() {
  return Response.json({ error: "Belum login" }, { status: 401 });
}

export function forbidden(message = "Anda tidak memiliki hak akses") {
  return Response.json({ error: message }, { status: 403 });
}

/**
 * Verifikasi sesi untuk Route Handler.
 * @returns {Promise<{ session } | { response: Response }>}
 */
export async function requireApiAuth() {
  const session = await getSession();
  if (!session) return { response: unauthorized() };
  return { session };
}

/** Sama seperti requireApiAuth, tapi khusus admin. */
export async function requireApiAdmin() {
  const session = await getSession();
  if (!session) return { response: unauthorized() };
  if (session.role !== "admin") return { response: forbidden() };
  return { session };
}

/**
 * Penjaga halaman admin (Server Component): redirect bila belum login,
 * redirect bila bukan admin. Verifikasi role di sisi server, bukan
 * hanya di proxy (defense in depth — sama dengan halaman users).
 */
export async function requireAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard?denied=1");
  return session;
}

/**
 * Validasi Origin untuk request yang mengubah data (POST/PUT/PATCH/DELETE).
 * Ini proteksi CSRF tambahan selain cookie SameSite=Lax:
 * request dari situs lain akan punya Origin berbeda dan ditolak.
 */
export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // fetch same-origin selalu mengirim Origin untuk POST
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
