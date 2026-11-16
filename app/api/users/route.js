import { query } from "@/lib/db";
import { requireApiAdmin } from "@/lib/auth";

// GET /api/users — hanya admin; daftar user untuk halaman manajemen user.
export async function GET() {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const rows = await query(
    "SELECT id, username, name, email, role, register_date FROM users ORDER BY id ASC"
  );
  return Response.json({ users: rows });
}
