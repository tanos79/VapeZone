import { query } from "@/lib/db";
import { requireApiAdmin, assertSameOrigin } from "@/lib/auth";
import { roleSchema, parseBody } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

// PATCH /api/users/[id] — hanya admin; ubah role user.
export async function PATCH(request, context) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const parsed = await parseBody(request, roleSchema);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const { role } = parsed.data;

  if (id === auth.session.userId && role !== "admin") {
    return Response.json({ error: "Tidak bisa menurunkan role akun sendiri" }, { status: 409 });
  }

  // Cegah jadinya tanpa admin: hitung admin lain saat role seorang admin diubah.
  if (role !== "admin") {
    const rows = await query(
      "SELECT COUNT(*) AS admins FROM users WHERE role = 'admin' AND id <> ?",
      [id]
    );
    if (Number(rows[0].admins) === 0) {
      return Response.json(
        { error: "Minimal harus ada satu admin di sistem" },
        { status: 409 }
      );
    }
  }

  const rows = await query(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, id]
  );
  if (rows.affectedRows === 0) {
    return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const updated = await query("SELECT id, username, role FROM users WHERE id = ?", [id]);
  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "user_role_ubah",
    detail: `Ubah role ${updated[0].username} menjadi ${role}`,
  });

  return Response.json({ user: updated[0] });
}

// DELETE /api/users/[id] — hanya admin.
export async function DELETE(request, context) {
  if (!assertSameOrigin(request)) {
    return Response.json({ error: "Request tidak valid (origin mismatch)" }, { status: 403 });
  }
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "ID tidak valid" }, { status: 400 });
  }
  if (id === auth.session.userId) {
    return Response.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 409 });
  }

  // Pastikan masih ada admin lain bila yang dihapus admin.
  const target = await query("SELECT role FROM users WHERE id = ?", [id]);
  if (target.length === 0) {
    return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if (target[0].role === "admin") {
    const rows = await query(
      "SELECT COUNT(*) AS admins FROM users WHERE role = 'admin' AND id <> ?",
      [id]
    );
    if (Number(rows[0].admins) === 0) {
      return Response.json(
        { error: "Minimal harus ada satu admin di sistem" },
        { status: 409 }
      );
    }
  }

  // Hapus juga baris customers terkait bila ada.
  await query("DELETE FROM customers WHERE user_id = ?", [id]);
  const rows = await query("DELETE FROM users WHERE id = ?", [id]);
  if (rows.affectedRows === 0) {
    return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  await logActivity({
    userId: auth.session.userId,
    username: auth.session.username,
    action: "user_hapus",
    detail: "Hapus user",
  });

  return Response.json({ ok: true });
}
