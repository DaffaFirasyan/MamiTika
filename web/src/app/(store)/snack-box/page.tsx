import type { Metadata } from "next";
import Image from "next/image";
import { SnackInquiryForm } from "@/components/snack-inquiry-form";
import { getPublicCatalog } from "@/lib/catalog";
import { todayInJakarta } from "@/lib/dates";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Konsultasi Snack Box",
  description: "Ceritakan tanggal acara dan perkiraan kebutuhan snack box. Harga, minimum, dan tenggat mengikuti konfirmasi pemilik.",
  alternates: { canonical: canonicalUrl("/snack-box") },
};

export default async function SnackBoxPage() {
  const { settings } = await getPublicCatalog();

  return (
    <div className="container snack-page">
      <section className="snack-editorial" aria-labelledby="snack-heading">
        <div className="snack-editorial-photo">
          <Image
            src="/images/06-snackbox-mamitika.jpg"
            alt="Kotak snack box Mamitika dengan beberapa pilihan kue dan makanan."
            width={1204}
            height={1204}
            priority
            sizes="(max-width: 760px) 100vw, 48vw"
          />
        </div>
        <div>
          <p className="eyebrow">Konsultasi acara</p>
          <h1 id="snack-heading">Snack box untuk momen bersama.</h1>
          <p>{settings.snackDescription || "Ceritakan tanggal acara, jumlah box, dan pilihan isi yang Anda inginkan. Paket, harga, dan jadwal akan dikonfirmasi melalui WhatsApp."}</p>
          <p className="snack-hours">Jam layanan {settings.openingTime.slice(0, 5)}–{settings.closingTime.slice(0, 5)} WIB</p>
        </div>
      </section>

      <section className="snack-form-section" aria-labelledby="snack-form-heading">
        <div className="snack-form-intro">
          <h2 id="snack-form-heading">Ceritakan kebutuhan acara</h2>
          {settings.snackMinBoxes !== null && <p>Perkiraan jumlah minimum: {settings.snackMinBoxes} box.</p>}
          {settings.snackLeadDays !== null && <p>Tanggal acara paling cepat {settings.snackLeadDays} hari dari hari ini.</p>}
          {settings.snackMinBoxes === null && settings.snackLeadDays === null && <p>Jumlah minimum dan tenggat belum ditetapkan. Tanggal dan jumlah yang Anda kirim masih berupa permintaan untuk dikonfirmasi.</p>}
        </div>
        <SnackInquiryForm settings={settings} today={todayInJakarta()} />
      </section>
    </div>
  );
}
