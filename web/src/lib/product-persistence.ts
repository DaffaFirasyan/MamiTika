import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionResult, Database } from "./types.ts";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export async function persistProductRow(
  client: SupabaseClient<Database>,
  id: string | null,
  newId: string | null,
  slug: string | null,
  row: ProductUpdate,
): Promise<ActionResult<{ id: string }>> {
  if (id) {
    const { data, error } = await client.from("products").update(row).eq("id", id).select("id").maybeSingle();
    if (error) return { ok: false, message: "Produk belum tersimpan. Foto lama tetap digunakan; periksa isian lalu coba lagi." };
    if (!data) return { ok: false, message: "Produk tidak ditemukan. Isian tetap tersedia; coba muat ulang." };
    return { ok: true, data: { id: data.id } };
  }
  if (!newId || !slug) return { ok: false, message: "ID produk baru belum valid." };
  const { data, error } = await client.from("products").insert({ id: newId, slug, ...row }).select("id").single();
  if (error) return { ok: false, message: "Produk belum tersimpan. Foto kandidat tetap tersedia; coba simpan kembali." };
  return { ok: true, data: { id: data.id } };
}
