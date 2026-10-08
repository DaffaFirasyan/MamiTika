import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>Mamitika · Bakery rumahan dari Bandung</p>
        <p>Konfirmasikan ketersediaan akhir melalui WhatsApp.</p>
        <p><Link href="/snack-box">Konsultasi snack box</Link> · <Link href="/galeri">Galeri</Link> · <Link href="/kontak">Kontak dan lokasi</Link></p>
      </div>
    </footer>
  );
}
