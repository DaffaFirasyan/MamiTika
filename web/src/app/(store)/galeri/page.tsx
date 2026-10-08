import type { Metadata } from "next";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { canonicalUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Galeri Mamitika",
  description: "Dokumentasi foto pilihan yang dikelola oleh Mamitika.",
  alternates: { canonical: canonicalUrl("/galeri") },
};

export default function GalleryPage() {
  return (
    <div className="container gallery-page">
      <header className="page-intro">
        <p className="eyebrow">Foto pilihan</p>
        <h1>Galeri Mamitika</h1>
        <p>Dokumentasi foto yang dipilih dan dikelola oleh Mamitika.</p>
      </header>
      <GalleryLightbox />
    </div>
  );
}
