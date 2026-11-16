import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Registrasi — VapeZone" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-emerald-400">VapeZone</h1>
        <p className="mb-6 text-sm text-zinc-400">Buat akun baru (role: user/kasir).</p>
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-sm text-zinc-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
