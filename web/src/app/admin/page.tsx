import { requireAdmin } from "@/lib/auth";
import { ChangePasswordForm } from "./session-controls";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { userId } = await requireAdmin();
  return (
    <main className="container admin-page">
      <p className="eyebrow">Akses pemilik terverifikasi</p>
      <h1>Admin Mamitika</h1>
      <p>Sesi pemilik aktif. ID akun: <code>{userId}</code></p>
      <p><Link className="auth-button admin-action-link" href="/admin/produk">Kelola produk</Link></p>
      <section className="account-section" aria-labelledby="password-title">
        <h2 id="password-title">Keamanan akun</h2>
        <p>Gunakan password saat ini untuk menetapkan password baru. Sesi lain akan dikeluarkan setelah perubahan.</p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
