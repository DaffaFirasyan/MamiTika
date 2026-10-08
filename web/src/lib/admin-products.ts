import "server-only";
import { AdminAccessError, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProduct, Category, Availability } from "@/lib/types";

const columns = "id,slug,name,category,description,price_rupiah,package_label,quantity_unit,availability,preorder_lead_days,is_active,is_featured,sort_order,image_path,image_alt,image_width,image_height,image_position_x,image_position_y,created_at,updated_at";

function mapAdminProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as Category,
    description: row.description as string,
    priceRupiah: row.price_rupiah as number,
    packageLabel: row.package_label as string | null,
    quantityUnit: row.quantity_unit as string | null,
    availability: row.availability as Availability,
    preorderLeadDays: row.preorder_lead_days as number | null,
    isActive: row.is_active as boolean,
    isFeatured: row.is_featured as boolean,
    sortOrder: row.sort_order as number,
    imagePath: row.image_path as string | null,
    imageAlt: row.image_alt as string | null,
    imageWidth: row.image_width as number | null,
    imageHeight: row.image_height as number | null,
    imagePositionX: row.image_position_x as number,
    imagePositionY: row.image_position_y as number,
    updatedAt: row.updated_at as string,
    createdAt: row.created_at as string,
  };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  await requireAdmin();
  const { data, error } = await (await createAdminClient()).from("products").select(columns).order("sort_order").order("name").order("id");
  if (error) throw new Error("Daftar produk belum dapat dimuat.");
  return (data ?? []).map((row) => mapAdminProduct(row as unknown as Record<string, unknown>));
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  await requireAdmin();
  const { data, error } = await (await createAdminClient()).from("products").select(columns).eq("id", id).maybeSingle();
  if (error) throw new Error("Data produk belum dapat dimuat.");
  return data ? mapAdminProduct(data as unknown as Record<string, unknown>) : null;
}

export function adminProductAccessMessage(error: unknown): string {
  if (error instanceof AdminAccessError && error.reason === "unauthenticated") return "Sesi pemilik tidak berlaku. Silakan masuk kembali.";
  if (error instanceof AdminAccessError && error.reason === "forbidden") return "Akun ini tidak memiliki akses pemilik.";
  return "Data admin belum dapat diverifikasi. Coba lagi.";
}
