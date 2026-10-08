import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublicCatalog } from "@/lib/catalog";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Roti dan Kue Rumahan dari Bandung",
  description: "Kenali menu roti dan kue Mamitika, lalu konfirmasikan harga dan ketersediaan langsung kepada usaha.",
  alternates: { canonical: canonicalUrl("/") },
};

export default async function HomePage() {
  const { products, settings } = await getPublicCatalog();
  const featured = products.filter((product) => product.isFeatured).slice(0, 3);
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}`;

  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <p className="eyebrow">Bakery rumahan · Bandung</p>
          <h1>Roti dan kue rumahan, dari Bandung.</h1>
          <p>Pilihan roti, kue basah, risoles, dan lumpia untuk menemani hari Anda.</p>
          <div className="hero-actions">
            <Link className="button" href="/menu">Lihat menu</Link>
            <Link className="button button-secondary" href="/snack-box">Tanya snack box</Link>
          </div>
        </div>
        <div className="hero-photo">
          <Image src="/images/03-roti-smokedbeef-mamitika.jpg" alt="Roti buatan Mamitika di atas rak pendingin." width={1204} height={1204} priority sizes="(max-width: 760px) 100vw, 54vw" />
        </div>
      </section>

      <section className="container section" aria-label="Jelajahi kategori menu">
        <div className="category-links">
          <Link href="/menu?kategori=roti"><span>Roti</span><span aria-hidden="true">→</span></Link>
          <Link href="/menu?kategori=kue_basah"><span>Kue Basah</span><span aria-hidden="true">→</span></Link>
          <Link href="/menu?kategori=risoles_lumpia"><span>Risoles &amp; Lumpia</span><span aria-hidden="true">→</span></Link>
        </div>
        <div className="review-callout">
          <div>
            <h2>{featured.length ? "Pilihan menu Mamitika" : "Pilihan menu belum ditentukan"}</h2>
            <p>{featured.length ? "Pilihan ini mengikuti produk yang ditandai pemilik." : "Produk aktif tersedia di katalog. Pilihan beranda akan tampil setelah ditentukan pemilik."}</p>
          </div>
          <Link className="text-link" href="/menu">Lihat semua menu <span aria-hidden="true">→</span></Link>
        </div>
        {featured.length > 0 && <div className="product-grid home-product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>

      <section className="container section" id="snack-box">
        <div className="snack-section">
          <div className="snack-photo">
            <Image src="/images/06-snackbox-mamitika.jpg" alt="Aneka snack box Mamitika dalam kotak kemasan." width={1204} height={1204} sizes="(max-width: 760px) 100vw, 48vw" />
          </div>
          <div className="snack-copy">
            <p className="eyebrow">Untuk momen bersama</p>
            <h2>Snack box untuk acara Anda.</h2>
            <p>{settings.snackDescription ?? "Ceritakan tanggal acara, jumlah box, dan pilihan isi yang Anda inginkan. Detail layanan dapat dikonfirmasi langsung kepada Mamitika."}</p>
            <Link className="button button-secondary" href="/snack-box">Konsultasi snack box</Link>
          </div>
        </div>
      </section>

      <section className="container section" id="galeri">
        <div className="gallery-intro">
          <div><p className="eyebrow">Dokumentasi pilihan</p><h2>Dari dapur Mamitika</h2><p>Galeri menampilkan foto yang sudah dipilih oleh Mamitika.</p></div>
          <Link className="button button-secondary" href="/galeri">Lihat galeri</Link>
        </div>
      </section>

      <section className="container contact" id="kontak">
        <div>
          <p className="eyebrow">Temukan kami</p>
          <h2>Salam dari Bandung.</h2>
          <p className="contact-details">{settings.addressText}</p>
          {settings.mapsUrl && <p><a href={settings.mapsUrl} target="_blank" rel="noreferrer">Lihat lokasi di peta</a></p>}
        </div>
        <div className="contact-details">
          <p><a href={whatsappUrl}>WhatsApp · +{settings.whatsappNumber}</a></p>
          <p><a href={settings.instagramUrl} target="_blank" rel="noreferrer">Instagram · @kuenyamamitika</a></p>
          <p>Jam layanan: {settings.openingTime.slice(0, 5)}–{settings.closingTime.slice(0, 5)} WIB</p>
          <p>Informasi harga, ketersediaan, dan pengiriman dikonfirmasi langsung.</p>
          <Link href="/kontak">Informasi kontak lengkap</Link>
        </div>
      </section>
    </>
  );
}
