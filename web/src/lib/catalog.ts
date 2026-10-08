import { createPublicClient, getSupabaseUrl } from "./supabase/public.ts";
import type { Availability, Category, PublicGalleryItem, PublicProduct, SiteSettings } from "./types.ts";

const productColumns = "id,slug,name,category,description,price_rupiah,package_label,quantity_unit,availability,preorder_lead_days,is_active,is_featured,sort_order,image_path,image_alt,image_width,image_height,image_position_x,image_position_y,updated_at";
const settingsColumns = "whatsapp_number,instagram_url,address_text,maps_url,opening_time,closing_time,timezone,service_days_text,delivery_note,pickup_note,gofood_url,shopeefood_url,snack_min_boxes,snack_lead_days,snack_description,updated_at";
const galleryColumns = "id,image_path,image_alt,caption,image_width,image_height,sort_order,updated_at";
const uuidWebp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;
const categories = new Set<Category>(["roti", "kue_basah", "risoles_lumpia"]);
const availabilities = new Set<Availability>(["unconfirmed", "ready", "preorder", "unavailable"]);

export class CatalogUnavailableError extends Error {
  constructor() {
    super("Katalog sedang tidak dapat dimuat.");
    this.name = "CatalogUnavailableError";
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function nullableString(value: unknown): string | null {
  return value === null || isString(value) ? value : null;
}

function isNullableString(value: unknown): boolean {
  return value === null || isString(value);
}

function nullableNumber(value: unknown): number | null {
  return value === null || (typeof value === "number" && Number.isSafeInteger(value)) ? value : null;
}

export function mapPublicProductRow(value: unknown): PublicProduct | null {
  const row = record(value);
  if (!row || row.is_active !== true || !categories.has(row.category as Category) || !availabilities.has(row.availability as Availability)) return null;
  if (!["id", "slug", "name", "description", "updated_at"].every((key) => isString(row[key]))) return null;
  if (typeof row.price_rupiah !== "number" || !Number.isSafeInteger(row.price_rupiah) || row.price_rupiah <= 0) return null;
  if (typeof row.is_featured !== "boolean" || typeof row.sort_order !== "number" || !Number.isSafeInteger(row.sort_order)) return null;
  const imagePath = isString(row.image_path) && uuidWebp.test(row.image_path) ? row.image_path : null;
  const imageAlt = imagePath && isString(row.image_alt) ? row.image_alt : null;
  const imageWidth = imagePath ? nullableNumber(row.image_width) : null;
  const imageHeight = imagePath ? nullableNumber(row.image_height) : null;

  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as Category,
    description: row.description as string,
    priceRupiah: row.price_rupiah,
    packageLabel: nullableString(row.package_label),
    quantityUnit: nullableString(row.quantity_unit),
    availability: row.availability as Availability,
    preorderLeadDays: nullableNumber(row.preorder_lead_days),
    isActive: true,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    imagePath: imageAlt && imageWidth && imageHeight ? imagePath : null,
    imageAlt: imageAlt && imageWidth && imageHeight ? imageAlt : null,
    imageWidth: imageAlt && imageWidth && imageHeight ? imageWidth : null,
    imageHeight: imageAlt && imageWidth && imageHeight ? imageHeight : null,
    imagePositionX: typeof row.image_position_x === "number" ? row.image_position_x : 50,
    imagePositionY: typeof row.image_position_y === "number" ? row.image_position_y : 50,
    updatedAt: row.updated_at as string,
  };
}

export function mapPublicSettingsRow(value: unknown): SiteSettings {
  const row = record(value);
  if (!row || row.timezone !== "Asia/Jakarta" || !isString(row.whatsapp_number) || !/^\d{8,15}$/.test(row.whatsapp_number) || !isString(row.instagram_url) || !URL.canParse(row.instagram_url) || new URL(row.instagram_url).protocol !== "https:" || !isString(row.address_text) || !isString(row.opening_time) || !isString(row.closing_time) || !isString(row.updated_at)) {
    throw new CatalogUnavailableError();
  }
  const nullableFields = ["maps_url", "service_days_text", "delivery_note", "pickup_note", "gofood_url", "shopeefood_url", "snack_description"];
  const nullableNumbers = ["snack_min_boxes", "snack_lead_days"];
  if (!nullableFields.every((key) => isNullableString(row[key])) || !nullableNumbers.every((key) => row[key] === null || (typeof row[key] === "number" && Number.isSafeInteger(row[key])))) throw new CatalogUnavailableError();
  const httpsUrl = (value: unknown) => isString(value) && URL.canParse(value) && new URL(value).protocol === "https:" ? value : null;
  for (const key of ["maps_url", "gofood_url", "shopeefood_url"]) {
    if (row[key] !== null && !httpsUrl(row[key])) throw new CatalogUnavailableError();
  }
  return {
    whatsappNumber: row.whatsapp_number,
    instagramUrl: row.instagram_url,
    addressText: row.address_text,
    mapsUrl: httpsUrl(row.maps_url),
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    timezone: "Asia/Jakarta",
    serviceDaysText: nullableString(row.service_days_text),
    deliveryNote: nullableString(row.delivery_note),
    pickupNote: nullableString(row.pickup_note),
    gofoodUrl: httpsUrl(row.gofood_url),
    shopeefoodUrl: httpsUrl(row.shopeefood_url),
    snackMinBoxes: nullableNumber(row.snack_min_boxes),
    snackLeadDays: nullableNumber(row.snack_lead_days),
    snackDescription: nullableString(row.snack_description),
    updatedAt: row.updated_at,
  };
}

function queryFailed(error: unknown): never {
  if (error) throw new CatalogUnavailableError();
  throw new CatalogUnavailableError();
}

export async function getPublicCatalog(): Promise<{ products: PublicProduct[]; settings: SiteSettings; fetchedAt: string }> {
  try {
    const supabase = createPublicClient();
    const [productResult, settingsResult] = await Promise.all([
      supabase.from("products").select(productColumns).eq("is_active", true).order("sort_order").order("name"),
      supabase.from("site_settings").select(settingsColumns).eq("id", 1).single(),
    ]);
    if (productResult.error) queryFailed(productResult.error);
    if (settingsResult.error) queryFailed(settingsResult.error);
    const products = (productResult.data ?? []).map((row) => {
      const product = mapPublicProductRow(row);
      if (!product) throw new CatalogUnavailableError();
      return product;
    });
    return { products, settings: mapPublicSettingsRow(settingsResult.data), fetchedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof CatalogUnavailableError) throw error;
    throw new CatalogUnavailableError();
  }
}

export async function getPublicProduct(slug: string): Promise<PublicProduct | null> {
  try {
    const { data, error } = await createPublicClient().from("products").select(productColumns).eq("slug", slug).eq("is_active", true).maybeSingle();
    if (error) queryFailed(error);
    if (data === null) return null;
    const product = mapPublicProductRow(data);
    if (!product) throw new CatalogUnavailableError();
    return product;
  } catch (error) {
    if (error instanceof CatalogUnavailableError) throw error;
    throw new CatalogUnavailableError();
  }
}

export async function getPublicGallery(): Promise<PublicGalleryItem[]> {
  try {
    const { data, error } = await createPublicClient().from("gallery_items").select(galleryColumns).eq("is_active", true).order("sort_order");
    if (error) queryFailed(error);
    return (data ?? []).map((row) => {
      if (!uuidWebp.test(row.image_path) || !row.image_alt || row.image_width <= 0 || row.image_height <= 0) throw new CatalogUnavailableError();
      return { id: row.id, imagePath: row.image_path, imageAlt: row.image_alt, caption: row.caption, imageWidth: row.image_width, imageHeight: row.image_height, sortOrder: row.sort_order, updatedAt: row.updated_at };
    });
  } catch (error) {
    if (error instanceof CatalogUnavailableError) throw error;
    throw new CatalogUnavailableError();
  }
}

export function getStoredImageUrl(path: string): string {
  if (!uuidWebp.test(path)) throw new CatalogUnavailableError();
  return `${getSupabaseUrl()}/storage/v1/object/public/catalog-images/${path}`;
}
