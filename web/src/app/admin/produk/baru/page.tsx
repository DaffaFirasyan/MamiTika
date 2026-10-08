import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default function NewAdminProductPage() {
  return (
    <main className="container admin-page admin-editor-page">
      <p className="eyebrow">Katalog · Produk baru</p>
      <Link className="text-button" href="/admin/produk">← Kembali ke produk</Link>
      <h1>Tambah produk</h1>
      <p>Produk baru dimulai sebagai nonaktif dan berstatus belum dikonfirmasi. Isi hanya data yang sudah diperiksa.</p>
      <ProductForm />
    </main>
  );
}
