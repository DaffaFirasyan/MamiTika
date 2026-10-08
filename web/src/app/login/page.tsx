import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Masuk pemilik", robots: { index: false, follow: false } };

const errorMessages: Record<string, string> = {
  session: "Sesi tidak tersedia atau sudah berakhir. Silakan masuk kembali.",
  "signed-out": "Sesi telah dikeluarkan.",
  "not-configured": "Login belum dikonfigurasi. Hubungi operator.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="container auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Area pemilik</p>
        <h1 id="login-title">Masuk ke Mamitika</h1>
        <p>Masuk menggunakan akun email pemilik Mamitika.</p>
        {error && errorMessages[error] && <p className="auth-message" role="status">{errorMessages[error]}</p>}
        <LoginForm />
        <p className="auth-help">Lupa kata sandi? Hubungi operator untuk pemulihan manual.</p>
      </section>
    </main>
  );
}
