import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublicCatalog } from "@/lib/catalog";
import { canonicalUrl } from "@/lib/site-url";
import type { Availability, Category } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Menu Mamitika",
  description: "Jelajahi pilihan roti, kue basah, risoles, dan lumpia Mamitika. Harga dan ketersediaan dikonfirmasi melalui WhatsApp.",
  alternates: { canonical: canonicalUrl("/menu") },
};

const categories: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "roti", label: "Roti" },
  { value: "kue_basah", label: "Kue Basah" },
  { value: "risoles_lumpia", label: "Risoles & Lumpia" },
];
const availabilityOptions: { value: Availability | "all"; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "ready", label: "Ready stock" },
  { value: "preorder", label: "Pre-order" },
  { value: "unconfirmed", label: "Konfirmasi ketersediaan" },
  { value: "unavailable", label: "Tidak tersedia" },
];
const sortingOptions = [
  { value: "default", label: "Urutan menu" },
  { value: "name", label: "Nama A–Z" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
];

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MenuPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { products } = await getPublicCatalog();
  const param = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const requestedCategory = param(params.kategori);
  const requestedAvailability = param(params.status);
  const requestedSort = param(params.urut);
  const selectedCategory = categories.some(({ value }) => value === requestedCategory) ? requestedCategory as Category : "all";
  const selectedAvailability = availabilityOptions.some(({ value }) => value === requestedAvailability) ? requestedAvailability as Availability : "all";
  const selectedSort = sortingOptions.some(({ value }) => value === requestedSort) ? requestedSort as typeof sortingOptions[number]["value"] : "default";
  let visibleProducts = products.filter((product) =>
    (selectedCategory === "all" || product.category === selectedCategory)
    && (selectedAvailability === "all" || product.availability === selectedAvailability));
  if (selectedSort === "name") visibleProducts = [...visibleProducts].sort((a, b) => a.name.localeCompare(b.name, "id"));
  if (selectedSort === "price-asc") visibleProducts = [...visibleProducts].sort((a, b) => (a.priceRupiah ?? Number.MAX_SAFE_INTEGER) - (b.priceRupiah ?? Number.MAX_SAFE_INTEGER));
  if (selectedSort === "price-desc") visibleProducts = [...visibleProducts].sort((a, b) => (b.priceRupiah ?? -1) - (a.priceRupiah ?? -1));

  const filterHref = (key: "kategori" | "status" | "urut", value: string) => {
    const query = new URLSearchParams();
    if (key !== "kategori" && selectedCategory !== "all") query.set("kategori", selectedCategory);
    if (key !== "status" && selectedAvailability !== "all") query.set("status", selectedAvailability);
    if (key !== "urut" && selectedSort !== "default") query.set("urut", selectedSort);
    if (value !== "all" && value !== "default") query.set(key, value);
    const suffix = query.toString();
    return suffix ? `/menu?${suffix}` : "/menu";
  };

  return (
    <div className="container">
      <header className="page-intro">
        <p className="eyebrow">Katalog Mamitika</p>
        <h1>Menu Mamitika</h1>
        <p>Produk, harga, dan status mengikuti informasi katalog dari pemilik.</p>
      </header>
      <div className="catalog-filters" aria-label="Filter dan urutkan menu">
        <nav className="filter-list" aria-label="Filter kategori">
          {categories.map(({ value, label }) => <Link key={value} href={filterHref("kategori", value)} aria-current={selectedCategory === value ? "page" : undefined}>{label}</Link>)}
        </nav>
        <nav className="filter-list" aria-label="Filter ketersediaan">
          {availabilityOptions.map(({ value, label }) => <Link key={value} href={filterHref("status", value)} aria-current={selectedAvailability === value ? "page" : undefined}>{label}</Link>)}
        </nav>
        <nav className="filter-list" aria-label="Urutkan menu">
          {sortingOptions.map(({ value, label }) => <Link key={value} href={filterHref("urut", value)} aria-current={selectedSort === value ? "page" : undefined}>{label}</Link>)}
        </nav>
      </div>
      {visibleProducts.length > 0 ? (
        <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      ) : (
        <div className="no-results">
          <h2>{products.length === 0 ? "Belum ada produk aktif" : "Tidak ada produk pada pilihan ini"}</h2>
          <p>{products.length === 0 ? "Menu sedang ditinjau pemilik. Hubungi Mamitika untuk menanyakan produk dan ketersediaan." : "Coba ubah filter kategori atau status."}</p>
          {products.length === 0 && <Link className="button" href="/kontak">Hubungi Mamitika</Link>}
        </div>
      )}
      {products.length > 0 && <p className="catalog-count">{visibleProducts.length} dari {products.length} produk aktif</p>}
    </div>
  );
}
