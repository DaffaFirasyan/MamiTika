import Link from "next/link";
import { adminProductAccessMessage, getAdminProducts } from "@/lib/admin-products";
import { formatRupiah } from "@/lib/cart";
import type { AdminProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  unconfirmed: "Belum dikonfirmasi",
  ready: "Ready stock",
  preorder: "Pre-order",
  unavailable: "Tidak tersedia",
};

export default async function AdminProductsPage() {
  let products: AdminProduct[] = [];
  let error: string | null = null;
  try {
    products = await getAdminProducts();
  } catch (caught) {
    error = adminProductAccessMessage(caught);
  }

  return (
    <main className="container admin-page admin-products-page">
      <p className="eyebrow">Area pemilik</p>
      <div className="admin-title-row">
        <div><h1>Produk</h1><p>Periksa status dan perbarui informasi katalog.</p></div>
        <Link className="auth-button admin-action-link" href="/admin/produk/baru">Tambah produk</Link>
      </div>
      <nav className="admin-nav" aria-label="Navigasi admin">
        <Link href="/admin">Akun pemilik</Link><span aria-current="page">Produk</span>
      </nav>
      {error ? (
        <section className="admin-notice" role="alert"><p>{error}</p><Link className="text-button" href="/admin/produk">Coba lagi</Link></section>
      ) : products.length === 0 ? (
        <section className="admin-notice"><h2>Belum ada data produk</h2><p>Katalog development kosong. Tambahkan hanya informasi produk yang sudah diperiksa pemilik.</p><Link className="text-button" href="/admin/produk/baru">Buat produk pertama</Link></section>
      ) : (
        <div className="admin-product-list" role="list">
          {products.map((product) => (
            <article className="admin-product-row" role="listitem" key={product.id}>
              <div><h2>{product.name}</h2><p>{product.category.replaceAll("_", " ")} · {product.packageLabel ?? "Isi kemasan belum ditetapkan"}</p></div>
              <p className="admin-product-price">{formatRupiah(product.priceRupiah)}</p>
              <p><span className={`admin-status${product.isActive ? " is-active" : ""}`}>{product.isActive ? "Aktif" : "Nonaktif"}</span><br />{statusLabel[product.availability]}</p>
              <Link className="text-button" href={`/admin/produk/${product.id}`}>Edit {product.name}</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
