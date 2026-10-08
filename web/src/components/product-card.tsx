import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getStoredImageUrl } from "@/lib/catalog";
import type { PublicProduct } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function availabilityLabel(product: PublicProduct) {
  if (product.availability === "ready") return "Ready stock · konfirmasi akhir saat pemesanan";
  if (product.availability === "preorder") return product.preorderLeadDays === null
    ? "Pre-order · jadwal dikonfirmasi"
    : `Pre-order · pesan ${product.preorderLeadDays} hari sebelumnya`;
  if (product.availability === "unavailable") return "Sedang tidak tersedia";
  return "Konfirmasi ketersediaan";
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const imageUrl = product.imagePath && product.imageAlt ? getStoredImageUrl(product.imagePath) : null;
  return (
    <article className="product-card">
      <Link className="product-detail-link" href={`/menu/${product.slug}`} aria-label={`Lihat detail ${product.name}`}>
        <div className="product-photo">
          {imageUrl && product.imageAlt && product.imageWidth && product.imageHeight ? (
            <Image src={imageUrl} alt={product.imageAlt} width={product.imageWidth} height={product.imageHeight} sizes="(max-width: 760px) 90vw, (max-width: 1023px) 46vw, 28vw" />
          ) : (
            <div className="photo-placeholder" aria-label={`Foto ${product.name} belum tersedia`}>
              Foto produk belum tersedia
            </div>
          )}
        </div>
        <div className="product-info">
          <h2>{product.name}</h2>
          {product.description && <p>{product.description}</p>}
          {product.packageLabel && <p>{product.packageLabel}</p>}
          <div className="product-meta">
            <p className="product-price">{product.priceRupiah === null ? "Harga dikonfirmasi langsung" : rupiah.format(product.priceRupiah)}</p>
          </div>
          <p className={`product-status product-status-${product.availability}`}>{availabilityLabel(product)}</p>
          <span className="product-action">Lihat detail</span>
        </div>
      </Link>
      <AddToCartButton product={product} />
    </article>
  );
}
