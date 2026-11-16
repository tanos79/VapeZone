import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST(request) {
  const session = await getSession();

  const response = Response.json({ ok: true });
  // Hapus cookie sesi dengan Max-Age=0.
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  if (session) {
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "logout",
      detail: "Logout",
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "-",
    });
  }
  return response;
}
