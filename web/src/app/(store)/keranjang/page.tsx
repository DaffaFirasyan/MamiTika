import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/site-url";
import { CartPageContent } from "./cart-page-content";

export const metadata: Metadata = {
  title: "Keranjang",
  description: "Tinjau pilihan dan jumlah produk sebelum menyiapkan pesan untuk dikonfirmasi melalui WhatsApp.",
  alternates: { canonical: canonicalUrl("/keranjang") },
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageContent />;
}
