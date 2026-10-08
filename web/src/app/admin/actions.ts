"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { AdminAccessError, requireAdmin } from "@/lib/auth";
import { getStoredImageInfo } from "@/lib/images";
import { persistProductRow } from "@/lib/product-persistence";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateGalleryInput, validateProductInput, validateSettingsInput } from "@/lib/validation";
import type { ActionResult, GalleryInput, ProductInput, SettingsInput } from "@/lib/types";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function slugBase(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160).replace(/-+$/g, "") || "produk";
}

function productRow(input: ProductInput, image: { width: number; height: number } | null) {
  return {
    name: input.name,
    category: input.category,
    description: input.description,
    price_rupiah: input.priceRupiah,
    package_label: input.packageLabel,
    quantity_unit: input.quantityUnit,
    availability: input.availability,
    preorder_lead_days: input.preorderLeadDays,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    image_path: input.imagePath,
    image_alt: input.imagePath ? input.imageAlt : null,
    image_width: image?.width ?? null,
    image_height: image?.height ?? null,
    image_position_x: input.imagePositionX,
    image_position_y: input.imagePositionY,
  };
}

export async function saveProduct(id: string | null, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof AdminAccessError && error.reason === "unauthenticated"
      ? "Sesi pemilik tidak berlaku. Silakan masuk kembali."
      : error instanceof AdminAccessError && error.reason === "forbidden"
        ? "Akun ini tidak memiliki akses pemilik."
        : "Akses pemilik belum dapat diverifikasi.";
    return { ok: false, message };
  }

  if (id !== null && !uuid.test(id)) return { ok: false, message: "ID produk tidak valid." };
  const validation = validateProductInput(input);
  if (!validation.ok) return validation;

  try {
    const supabase = await createAdminClient();
    const image = validation.data.imagePath ? await getStoredImageInfo(supabase, validation.data.imagePath) : null;
    const row = productRow(validation.data, image);
    if (id) return persistProductRow(supabase, id, null, null, row);

    const newId = randomUUID();
    const base = slugBase(validation.data.name);
    const { data: existing, error: lookupError } = await supabase.from("products").select("id").eq("slug", base).maybeSingle();
    if (lookupError) return { ok: false, message: "Produk belum tersimpan. Coba lagi." };
    const slug = existing ? `${base.slice(0, 150)}-${newId.slice(0, 8)}` : base;
    return persistProductRow(supabase, null, newId, slug, row);
  } catch {
    return { ok: false, message: "Produk belum tersimpan. Foto lama tetap digunakan; periksa koneksi lalu coba lagi." };
  }
}

export async function saveGalleryItem(id: string | null, input: GalleryInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Sesi pemilik tidak berlaku atau akses pemilik belum dapat diverifikasi." };
  }
  if (id !== null && !uuid.test(id)) return { ok: false, message: "ID foto galeri tidak valid." };
  const validation = validateGalleryInput(input);
  if (!validation.ok) return validation;

  try {
    const supabase = await createAdminClient();
    const image = await getStoredImageInfo(supabase, validation.data.imagePath);
    const row = {
      image_path: validation.data.imagePath,
      image_alt: validation.data.imageAlt,
      caption: validation.data.caption,
      image_width: image.width,
      image_height: image.height,
      sort_order: validation.data.sortOrder,
      is_active: validation.data.isActive,
    };
    const result = id
      ? await supabase.from("gallery_items").update(row).eq("id", id).select("id").maybeSingle()
      : await supabase.from("gallery_items").insert({ id: randomUUID(), ...row }).select("id").single();
    if (result.error || !result.data) return { ok: false, message: "Foto galeri belum tersimpan. Foto sebelumnya tetap digunakan; coba lagi." };
    revalidatePath("/galeri");
    revalidatePath("/");
    revalidatePath("/api/gallery");
    return { ok: true, data: { id: result.data.id } };
  } catch {
    return { ok: false, message: "Foto galeri belum tersimpan. Foto sebelumnya tetap digunakan; periksa koneksi lalu coba lagi." };
  }
}

export async function saveSettings(input: SettingsInput): Promise<ActionResult<{ updated: true }>> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Sesi pemilik tidak berlaku atau akses pemilik belum dapat diverifikasi." };
  }
  const validation = validateSettingsInput(input);
  if (!validation.ok) return validation;

  try {
    const supabase = await createAdminClient();
    const value = validation.data;
    const { data, error } = await supabase.from("site_settings").update({
      whatsapp_number: value.whatsappNumber,
      instagram_url: value.instagramUrl,
      address_text: value.addressText,
      maps_url: value.mapsUrl,
      opening_time: value.openingTime,
      closing_time: value.closingTime,
      service_days_text: value.serviceDaysText,
      delivery_note: value.deliveryNote,
      pickup_note: value.pickupNote,
      gofood_url: value.gofoodUrl,
      shopeefood_url: value.shopeefoodUrl,
      snack_min_boxes: value.snackMinBoxes,
      snack_lead_days: value.snackLeadDays,
      snack_description: value.snackDescription,
    }).eq("id", 1).select("id").maybeSingle();
    if (error || !data) return { ok: false, message: "Pengaturan belum tersimpan. Tidak ada baris settings yang diubah atau koneksi gagal." };
    for (const path of ["/", "/kontak", "/snack-box", "/api/catalog"]) revalidatePath(path);
    return { ok: true, data: { updated: true } };
  } catch {
    return { ok: false, message: "Pengaturan belum tersimpan. Periksa koneksi lalu coba lagi." };
  }
}
