import type { Metadata } from "next";
import Link from "next/link";
import { getPublicCatalog } from "@/lib/catalog";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kontak dan Lokasi",
  description: "Informasi kontak, lokasi, jam layanan, dan metode menerima pesanan dari Mamitika.",
  alternates: { canonical: canonicalUrl("/kontak") },
};

export default async function ContactPage() {
  const { settings } = await getPublicCatalog();
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}`;
  return (
    <div className="container contact-page">
      <header className="page-intro">
        <p className="eyebrow">Informasi usaha</p>
        <h1>Hubungi Mamitika</h1>
        <p>Konfirmasikan produk, harga terbaru, ketersediaan, dan cara menerima pesanan melalui kontak berikut.</p>
      </header>
      <section className="contact-details-full" aria-label="Kontak dan lokasi Mamitika">
        <h2>Kontak</h2>
        <p><a className="button" href={whatsappUrl}>WhatsApp · +{settings.whatsappNumber}</a></p>
        <p><a href={settings.instagramUrl} target="_blank" rel="noreferrer">Instagram · @kuenyamamitika</a></p>
        <h2>Lokasi</h2>
        <p>{settings.addressText}</p>
        {settings.mapsUrl && <p><a href={settings.mapsUrl} target="_blank" rel="noreferrer">Lihat lokasi di peta</a></p>}
        <h2>Jam layanan</h2>
        <p>{settings.openingTime.slice(0, 5)}–{settings.closingTime.slice(0, 5)} WIB</p>
        {settings.serviceDaysText && <p>{settings.serviceDaysText}</p>}
        <h2>Pengiriman dan pengambilan</h2>
        {settings.deliveryNote && <p>Pengiriman: {settings.deliveryNote}</p>}
        {settings.pickupNote && <p>Ambil sendiri: {settings.pickupNote}</p>}
        {!settings.deliveryNote && !settings.pickupNote && <p>Konfirmasikan pilihan pengiriman atau pengambilan langsung kepada Mamitika.</p>}
        {settings.gofoodUrl && <p><a href={settings.gofoodUrl} target="_blank" rel="noreferrer">Pesan melalui GoFood</a></p>}
        {settings.shopeefoodUrl && <p><a href={settings.shopeefoodUrl} target="_blank" rel="noreferrer">Pesan melalui ShopeeFood</a></p>}
      </section>
      <p><Link href="/menu">Kembali ke menu</Link></p>
    </div>
  );
}
