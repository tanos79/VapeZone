import { query, ER_DUP_ENTRY } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth";
import { registerSchema, parseBody } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { logActivity } from "@/lib/audit";

export async function POST(request) {
  // Verifikasi Origin untuk mencegah CSRF.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Request tidak valid" }, { status: 403 });
    }
  }

  // Rate limiting pendaftaran: maksimal 5 per jam per IP.
  const rl = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json(
      { error: "Terlalu banyak percobaan daftar. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const parsed = await parseBody(request, registerSchema);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { username, name, email, password } = parsed.data;

  // Cek duplikasi (email unique di skema DB; username dicek manual).
  const dup = await query(
    "SELECT id, email, username FROM users WHERE email = ? OR username = ?",
    [email, username]
  );
  if (dup.length > 0) {
    return Response.json(
      { error: "Email atau username sudah terdaftar" },
      { status: 409 }
    );
  }

  // Password selalu di-hash dengan bcrypt sebelum disimpan.
  const passwordHash = await hashPassword(password);

  try {
    const result = await query(
      `INSERT INTO users (name, email, username, password, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [name, email, username, passwordHash]
    );
    const userId = result.insertId;

    // Baris data customer (sama seperti aplikasi lama).
    await query(
      "INSERT INTO customers (user_id, name, address) VALUES (?, ?, '-')",
      [userId, name]
    );

    await logActivity({
      userId,
      username,
      action: "register",
      detail: "Registrasi akun baru",
      ip: clientIp(request),
    });

    // Langsung beri sesi setelah registrasi.
    const token = await createSessionToken({
      sub: String(userId),
      username,
      name,
      role: "customer",
    });

    const opts = sessionCookieOptions();
    const response = Response.json(
      { user: { id: userId, username, name, role: "customer" } },
      { status: 201 }
    );
    response.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=${opts.path}; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${opts.secure ? "; Secure" : ""}`
    );
    return response;
  } catch (err) {
    if (err && err.code === ER_DUP_ENTRY) {
      return Response.json({ error: "Email atau username sudah terdaftar" }, { status: 409 });
    }
    console.error("Register error:", err);
    return Response.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
