import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import UsersClient from "@/components/UsersClient";

export const metadata = { title: "Manajemen User — VapeZone" };

export default async function UsersPage() {
  const session = await getSession();
  // Verifikasi role di sisi server, bukan hanya di proxy.
  if (session.role !== "admin") redirect("/dashboard?denied=1");

  const rows = await query(
    "SELECT id, username, name, email, role, register_date FROM users ORDER BY id ASC"
  );

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Manajemen User</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Kelola akun dan hak akses (role). Hanya admin yang dapat membuka halaman ini.
      </p>
      <UsersClient users={rows} currentUserId={session.userId} />
    </>
  );
}
