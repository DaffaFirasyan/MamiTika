import assert from "node:assert/strict";
import test from "node:test";
import { CatalogUnavailableError, mapPublicProductRow, mapPublicSettingsRow } from "../src/lib/catalog.ts";

const activeProduct = {
  id: "7f7d47da-c903-57e4-94de-d08501f74dfe",
  slug: "roti-sobek-coklat-lumer",
  name: "Roti Sobek Coklat Lumer",
  category: "roti",
  description: "Roti sobek lembut",
  price_rupiah: 38000,
  package_label: "isi 10 potong",
  quantity_unit: "kemasan",
  availability: "ready",
  preorder_lead_days: null,
  is_active: true,
  is_featured: true,
  sort_order: 0,
  image_path: "550e8400-e29b-41d4-a716-446655440000.webp",
  image_alt: "Roti sobek cokelat",
  image_width: 1200,
  image_height: 900,
  image_position_x: 50,
  image_position_y: 50,
  created_at: "2026-10-08T00:00:00.000Z",
  updated_at: "2026-10-08T00:00:00.000Z",
  private_note: "must not escape",
};

test("public product mapper exposes only active product fields in camelCase", () => {
  assert.deepEqual(mapPublicProductRow(activeProduct), {
    id: activeProduct.id,
    slug: activeProduct.slug,
    name: activeProduct.name,
    category: "roti",
    description: activeProduct.description,
    priceRupiah: 38000,
    packageLabel: "isi 10 potong",
    quantityUnit: "kemasan",
    availability: "ready",
    preorderLeadDays: null,
    isActive: true,
    isFeatured: true,
    sortOrder: 0,
    imagePath: activeProduct.image_path,
    imageAlt: activeProduct.image_alt,
    imageWidth: 1200,
    imageHeight: 900,
    imagePositionX: 50,
    imagePositionY: 50,
    updatedAt: activeProduct.updated_at,
  });
});

test("inactive and malformed rows are excluded rather than exposed", () => {
  assert.equal(mapPublicProductRow({ ...activeProduct, is_active: false }), null);
  assert.equal(mapPublicProductRow({ ...activeProduct, price_rupiah: "unknown" }), null);
});

test("public settings mapper returns only the public settings contract", () => {
  const mapped = mapPublicSettingsRow({
    id: 1,
    whatsapp_number: "6283197665812",
    instagram_url: "https://www.instagram.com/kuenyamamitika",
    address_text: "Derwati, Bandung",
    maps_url: null,
    opening_time: "06:30:00",
    closing_time: "17:00:00",
    timezone: "Asia/Jakarta",
    service_days_text: null,
    delivery_note: null,
    pickup_note: null,
    gofood_url: null,
    shopeefood_url: null,
    snack_min_boxes: null,
    snack_lead_days: null,
    snack_description: null,
    updated_at: "2026-10-08T00:00:00.000Z",
    internal_api_key: "must not escape",
  });
  assert.equal(mapped.whatsappNumber, "6283197665812");
  assert.equal(mapped.snackMinBoxes, null);
  assert.equal("internal_api_key" in mapped, false);
});

test("malformed settings are catalog errors, not a fallback or empty success", () => {
  assert.throws(() => mapPublicSettingsRow({ timezone: "UTC" }), CatalogUnavailableError);
});
