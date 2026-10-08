import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

const display = Lora({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500"] });
const body = Source_Sans_3({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  title: { default: "Mamitika — Roti dan Kue Rumahan dari Bandung", template: "%s | Mamitika" },
  description: "Lihat pilihan roti dan kue rumahan Mamitika dari Bandung. Konfirmasikan harga dan ketersediaan melalui kontak usaha.",
  openGraph: { type: "website", locale: "id_ID", siteName: "Mamitika" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>;
}
