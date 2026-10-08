import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccessError, requireAdmin } from "@/lib/auth";
import { SignOutButton } from "./session-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError && error.reason === "unauthenticated") redirect("/login?error=session");
    if (!(error instanceof AdminAccessError)) throw error;
    const isUnavailable = error.reason === "unavailable";

    return (
      <main className="container auth-page">
        <section className="auth-card" aria-labelledby="access-title">
          <p className="eyebrow">Area pemilik</p>
          <h1 id="access-title">{isUnavailable ? "Akses belum dapat diverifikasi" : "Akun ini belum memiliki akses admin"}</h1>
          <p>{isUnavailable ? "Layanan belum dapat memverifikasi akses pemilik. Coba muat ulang beberapa saat lagi." : "Akun ini belum terdaftar sebagai pemilik Mamitika."}</p>
          <SignOutButton />
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <p><strong>Mamitika</strong><span>Area pemilik</span></p>
          <SignOutButton />
        </div>
      </header>
      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <p>Navigasi admin</p>
          <nav aria-label="Navigasi admin">
            <Link href="/admin/produk">Produk</Link>
            <Link href="/admin/galeri">Galeri</Link>
            <Link href="/admin/pengaturan">Pengaturan usaha</Link>
          </nav>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
