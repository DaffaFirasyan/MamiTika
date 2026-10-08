import Link from "next/link";
import { GalleryForm } from "@/components/admin/gallery-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminGalleryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  let items: AdminGalleryItem[] = [];
  let error = false;
  try {
    const { data, error: queryError } = await (await createAdminClient())
      .from("gallery_items")
      .select("id,image_path,image_alt,caption,image_width,image_height,sort_order,is_active,created_at,updated_at")
      .order("sort_order")
      .order("created_at");
    if (queryError) throw queryError;
    items = (data ?? []).map((row) => ({
      id: row.id,
      imagePath: row.image_path,
      imageAlt: row.image_alt,
      caption: row.caption,
      imageWidth: row.image_width,
      imageHeight: row.image_height,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    error = true;
  }

  return (
    <main className="container admin-page admin-editor-page admin-content-page">
      <p className="eyebrow">Area pemilik · Konten publik</p>
      <div className="admin-title-row"><div><h1>Galeri</h1><p>Atur foto, caption, urutan, dan apakah foto tampil untuk pelanggan. Foto nonaktif tetap tersedia untuk pemilik.</p></div><Link className="text-button" href="/galeri">Lihat galeri publik</Link></div>
      {error ? <section className="admin-notice" role="alert"><h2>Galeri belum dapat dimuat</h2><p>Data belum diubah. Periksa koneksi lalu muat ulang.</p><Link className="text-button" href="/admin/galeri">Coba lagi</Link></section> : (
        <>
          <p className="admin-muted">{items.length} foto tersimpan · foto baru dimulai dalam status nonaktif.</p>
          <div className="admin-gallery-list">{items.map((item) => <GalleryForm key={`${item.id}-${item.updatedAt}`} item={item} />)}</div>
          <GalleryForm key={`new-${items.length}`} />
        </>
      )}
    </main>
  );
}
