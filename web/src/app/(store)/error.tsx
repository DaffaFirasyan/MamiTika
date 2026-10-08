"use client";

import Link from "next/link";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container store-error" role="alert">
      <p className="eyebrow">Informasi belum tersedia</p>
      <h1>Katalog belum dapat dimuat.</h1>
      <p>Periksa koneksi Anda lalu coba lagi. Jika masih bermasalah, hubungi Mamitika untuk menanyakan menu.</p>
      <div className="hero-actions">
        <button className="button" onClick={() => reset()}>Coba lagi</button>
        <Link className="button button-secondary" href="/kontak">Hubungi Mamitika</Link>
      </div>
    </main>
  );
}
