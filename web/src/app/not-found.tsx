import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container not-found-page">
      <p className="eyebrow">Menu Mamitika</p>
      <h1>Produk tidak ditemukan atau sudah tidak ditawarkan.</h1>
      <p>Produk yang tidak aktif tidak ditampilkan di katalog publik.</p>
      <Link className="button" href="/menu">Kembali ke menu</Link>
    </main>
  );
}
