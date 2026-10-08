import Link from "next/link";
import { SettingsForm } from "@/components/admin/settings-form";
import { mapPublicSettingsRow } from "@/lib/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  let settings: SiteSettings | null = null;
  let error = false;
  try {
    const { data, error: queryError } = await (await createAdminClient())
      .from("site_settings")
      .select("id,whatsapp_number,instagram_url,address_text,maps_url,opening_time,closing_time,timezone,service_days_text,delivery_note,pickup_note,gofood_url,shopeefood_url,snack_min_boxes,snack_lead_days,snack_description,updated_at")
      .eq("id", 1)
      .single();
    if (queryError || !data) throw queryError ?? new Error("Settings row missing");
    settings = mapPublicSettingsRow(data);
  } catch {
    error = true;
  }

  return (
    <main className="container admin-page admin-editor-page admin-content-page">
      <p className="eyebrow">Area pemilik · Konten publik</p>
      <div className="admin-title-row"><div><h1>Pengaturan usaha</h1><p>Nilai yang belum diketahui tetap kosong sampai pemilik mengisinya.</p></div><Link className="text-button" href="/kontak">Lihat kontak publik</Link></div>
      {error || !settings ? <section className="admin-notice" role="alert"><h2>Pengaturan belum dapat dimuat</h2><p>Data usaha tidak diubah. Pastikan baris settings tersedia, lalu muat ulang.</p><Link className="text-button" href="/admin/pengaturan">Coba lagi</Link></section> : <SettingsForm settings={settings} />}
    </main>
  );
}
