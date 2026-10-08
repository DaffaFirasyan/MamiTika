import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getPublicProduct, getStoredImageUrl } from "@/lib/catalog";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Produk tidak ditemukan", robots: { index: false, follow: true } };
  return {
    title: product.name,
    description: product.description || `Informasi ${product.name} dari Mamitika. Harga dan ketersediaan dikonfirmasi melalui WhatsApp.`,
    alternates: { canonical: canonicalUrl(`/menu/${encodeURIComponent(product.slug)}`) },
  };
}

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function ProductDetailPage({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();

  const imageUrl = product.imagePath ? getStoredImageUrl(product.imagePath) : null;
  const status = product.availability === "ready"
    ? "Ready stock. Ketersediaan akhir tetap dikonfirmasi melalui WhatsApp."
    : product.availability === "preorder"
      ? product.preorderLeadDays === null
        ? "Pre-order. Jadwal perlu dikonfirmasi melalui WhatsApp."
        : `Pre-order. Hubungi Mamitika setidaknya ${product.preorderLeadDays} hari sebelumnya untuk mengonfirmasi jadwal.`
      : product.availability === "unavailable"
        ? "Produk ini sedang tidak tersedia."
        : "Ketersediaan produk perlu dikonfirmasi langsung kepada Mamitika.";

  return (
    <article className="container product-detail">
      <p className="eyebrow"><Link href="/menu">Menu</Link> / Detail produk</p>
      <div className="product-detail-grid">
        <div className="product-detail-photo">
          {imageUrl && product.imageAlt && product.imageWidth && product.imageHeight
            ? <Image src={imageUrl} alt={product.imageAlt} width={product.imageWidth} height={product.imageHeight} sizes="(max-width: 760px) 100vw, 54vw" priority />
            : <div className="photo-placeholder">Foto produk belum tersedia</div>}
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.category.replaceAll("_", " ")}</p>
          <h1>{product.name}</h1>
          {product.description && <p>{product.description}</p>}
          {product.packageLabel && <p>{product.packageLabel}</p>}
          {product.quantityUnit && <p>Unit jual: {product.quantityUnit}</p>}
          <p className="product-detail-price">{product.priceRupiah === null ? "Harga dikonfirmasi langsung" : rupiah.format(product.priceRupiah)}</p>
          <p className={`product-status product-status-${product.availability}`}>{status}</p>
          <AddToCartButton product={product} showQuantity />
          <Link className="text-link" href="/kontak">Tanyakan kepada Mamitika</Link>
        </div>
      </div>
    </article>
  );
}
