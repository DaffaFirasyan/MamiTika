import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { adminProductAccessMessage, getAdminProduct } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditAdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let product;
  try {
    product = await getAdminProduct(id);
  } catch (error) {
    return <main className="container admin-page"><h1>Produk belum dapat dimuat</h1><p role="alert">{adminProductAccessMessage(error)}</p><Link className="text-button" href="/admin/produk">Kembali ke produk</Link></main>;
  }
  if (!product) notFound();
  return (
    <main className="container admin-page admin-editor-page">
      <p className="eyebrow">Katalog · Edit produk</p>
      <Link className="text-button" href="/admin/produk">← Kembali ke produk</Link>
      <h1>Edit produk</h1>
      <p>Perubahan nama tidak mengubah alamat produk. Slug hanya-baca.</p>
      <ProductForm product={product} />
    </main>
  );
}
