import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Login — VapeZone" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-emerald-400">VapeZone</h1>
        <p className="mb-6 text-sm text-zinc-400">Masuk untuk mengelola penjualan.</p>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-zinc-400">
          Belum punya akun?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">Daftar</Link>
        </p>
      </div>
    </main>
  );
}
