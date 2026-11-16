import { query } from "@/lib/db";
import {
  createSessionToken,
  verifyPassword,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth";
import { loginSchema, parseBody } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { logActivity } from "@/lib/audit";

export async function POST(request) {
  const ip = clientIp(request);
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

  // Rate limiting login: maksimal 10 percobaan per 10 menit per IP.
  const rl = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ${rl.retryAfterSeconds} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const parsed = await parseBody(request, loginSchema);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  // Login bisa memakai email ATAU username (identik dengan aplikasi lama).
  const rows = await query(
    "SELECT id, name, email, username, password, role FROM users WHERE email = ? OR username = ?",
    [identifier, identifier]
  );
  const user = rows[0];

  // Pesan error sengaja generik agar tidak membocorkan akun yang terdaftar.
  if (!user || !(await verifyPassword(password, user.password))) {
    await logActivity({
      username: identifier || "-",
      action: "login_gagal",
      detail: "Email/username atau password salah",
      ip,
    });
    return Response.json({ error: "Email/username atau password salah" }, { status: 401 });
  }

  await logActivity({
    userId: user.id,
    username: user.username,
    action: "login",
    detail: "Login berhasil",
    ip,
  });

  const token = await createSessionToken({
    sub: String(user.id),
    username: user.username,
    name: user.name,
    role: user.role === "admin" ? "admin" : "customer",
  });

  const opts = sessionCookieOptions();
  const response = Response.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=${opts.path}; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${opts.secure ? "; Secure" : ""}`
  );
  return response;
}
