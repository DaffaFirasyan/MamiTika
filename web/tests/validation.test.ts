import assert from "node:assert/strict";
import { test } from "node:test";
import { reconcileCart } from "../src/lib/cart.ts";
import { validateGalleryInput, validateOrderPreferences, validateProductInput, validateSettingsInput, validateSnackInquiry } from "../src/lib/validation.ts";
import type { PublicProduct, SiteSettings } from "../src/lib/types.ts";

const product: PublicProduct = {
  id: "7f7d47da-c903-57e4-94de-d08501f74dfe",
  slug: "roti-sobek-coklat-lumer",
  name: "Roti Sobek Coklat Lumer",
  category: "roti",
  description: "Roti sobek yang lembut dengan isian coklat lumer",
  priceRupiah: 38000,
  packageLabel: "isi 10 potong",
  quantityUnit: "kemasan",
  availability: "preorder",
  preorderLeadDays: null,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  imagePath: null,
  imageAlt: null,
  imageWidth: null,
  imageHeight: null,
  imagePositionX: 50,
  imagePositionY: 50,
  updatedAt: null,
};

const settings: SiteSettings = {
  whatsappNumber: "6283197665812",
  instagramUrl: "https://instagram.com/kuenyamamitika",
  addressText: "Bandung",
  mapsUrl: null,
  openingTime: "06:30",
  closingTime: "17:00",
  timezone: "Asia/Jakarta",
  serviceDaysText: null,
  deliveryNote: null,
  pickupNote: null,
  gofoodUrl: null,
  shopeefoodUrl: null,
  snackMinBoxes: null,
  snackLeadDays: null,
  snackDescription: null,
  updatedAt: "2026-10-07T00:00:00Z",
};

test("order preferences require a preorder date but do not invent an unset lead", () => {
  const review = reconcileCart([{ productId: product.id, quantity: 1 }], [product], "2026-10-08");
  const missing = validateOrderPreferences({ fulfillment: "delivery" }, review, settings, "2026-10-08");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.ok(missing.fieldErrors?.requestedDate);

  const valid = validateOrderPreferences({
    fulfillment: "delivery",
    area: "  Bandung  ",
    requestedDate: "2026-10-08",
    note: "  Tolong kabari  ",
  }, review, settings, "2026-10-08");
  assert.deepEqual(valid, {
    ok: true,
    data: { fulfillment: "delivery", area: "Bandung", requestedDate: "2026-10-08", note: "Tolong kabari" },
  });
});

test("order validation rejects invalid and past dates, enums, and oversized fields", () => {
  const review = reconcileCart([{ productId: product.id, quantity: 1 }], [product], "2026-10-08");
  for (const requestedDate of ["2026-02-30", "2026-10-07"]) {
    const result = validateOrderPreferences({ fulfillment: "delivery", requestedDate }, review, settings, "2026-10-08");
    assert.equal(result.ok, false);
  }
  assert.equal(validateOrderPreferences({ fulfillment: "express" }, review, settings, "2026-10-08").ok, false);
  assert.equal(validateOrderPreferences({ fulfillment: "pickup", area: "x".repeat(121) }, review, settings, "2026-10-08").ok, false);
  assert.equal(validateOrderPreferences({ fulfillment: "pickup", note: "x".repeat(501) }, review, settings, "2026-10-08").ok, false);
});

test("snack inquiry accepts null minimum and lead without fabricating rules", () => {
  const result = validateSnackInquiry({ eventDate: "2026-10-08", boxes: 1 }, settings, "2026-10-08");
  assert.deepEqual(result, { ok: true, data: { eventDate: "2026-10-08", boxes: 1 } });
});

test("snack inquiry applies configured minimum and lead date", () => {
  const configured = { ...settings, snackMinBoxes: 10, snackLeadDays: 3 };
  assert.equal(validateSnackInquiry({ eventDate: "2026-10-10", boxes: 9 }, configured, "2026-10-08").ok, false);
  assert.equal(validateSnackInquiry({ eventDate: "2026-10-10", boxes: 10 }, configured, "2026-10-08").ok, false);

  const valid = validateSnackInquiry({
    eventType: "  Ulang tahun  ",
    eventDate: "2026-10-11",
    boxes: 10,
    contents: "  Isi bebas  ",
    budgetPerBox: 25000,
    area: " Bandung ",
    note: " Hubungi sore ",
  }, configured, "2026-10-08");
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.data.eventType, "Ulang tahun");
});

test("snack inquiry rejects impossible/past dates and invalid or overflowing numbers", () => {
  for (const eventDate of ["2026-02-30", "2026-10-07"]) {
    assert.equal(validateSnackInquiry({ eventDate, boxes: 1 }, settings, "2026-10-08").ok, false);
  }
  for (const boxes of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateSnackInquiry({ eventDate: "2026-10-09", boxes }, settings, "2026-10-08").ok, false);
  }
  for (const budgetPerBox of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateSnackInquiry({ eventDate: "2026-10-09", boxes: 1, budgetPerBox }, settings, "2026-10-08").ok, false);
  }
  assert.equal(validateSnackInquiry({ eventDate: "2026-10-09", boxes: 1, eventType: "x".repeat(121) }, settings, "2026-10-08").ok, false);
  assert.equal(validateSnackInquiry({ eventDate: "2026-10-09", boxes: 1, contents: "x".repeat(501) }, settings, "2026-10-08").ok, false);
  assert.equal(validateSnackInquiry({ eventDate: "2026-10-09", boxes: 1, area: "x".repeat(121) }, settings, "2026-10-08").ok, false);
  assert.equal(validateSnackInquiry({ eventDate: "2026-10-09", boxes: 1, note: "x".repeat(501) }, settings, "2026-10-08").ok, false);
});

test("gallery input accepts only validated fields and nullable captions", () => {
  const valid = validateGalleryInput({
    imagePath: "7f7d47da-c903-57e4-94de-d08501f74dfe.webp",
    imageAlt: "Roti di dalam kemasan",
    caption: null,
    sortOrder: 0,
    isActive: false,
    ignored: "not persisted",
  });
  assert.deepEqual(valid, {
    ok: true,
    data: {
      imagePath: "7f7d47da-c903-57e4-94de-d08501f74dfe.webp",
      imageAlt: "Roti di dalam kemasan",
      caption: null,
      sortOrder: 0,
      isActive: false,
    },
  });
  assert.equal(validateGalleryInput({ imagePath: "unsafe.webp", imageAlt: "x", caption: "x".repeat(241), sortOrder: -1, isActive: true }).ok, false);
});

test("settings validation keeps unknown optional business values null", () => {
  const result = validateSettingsInput({
    whatsappNumber: "62812345678",
    instagramUrl: "https://instagram.com/example",
    addressText: "Bandung",
    mapsUrl: null,
    openingTime: "06:30",
    closingTime: "17:00",
    serviceDaysText: null,
    deliveryNote: null,
    pickupNote: null,
    gofoodUrl: null,
    shopeefoodUrl: null,
    snackMinBoxes: null,
    snackLeadDays: null,
    snackDescription: null,
    id: 99,
    timezone: "UTC",
    updatedAt: "spoofed",
  });
  assert.deepEqual(result, {
    ok: true,
    data: {
      whatsappNumber: "62812345678",
      instagramUrl: "https://instagram.com/example",
      addressText: "Bandung",
      mapsUrl: null,
      openingTime: "06:30",
      closingTime: "17:00",
      serviceDaysText: null,
      deliveryNote: null,
      pickupNote: null,
      gofoodUrl: null,
      shopeefoodUrl: null,
      snackMinBoxes: null,
      snackLeadDays: null,
      snackDescription: null,
    },
  });
});

test("settings validation rejects bad contact, URLs, limits, time order, and long text", () => {
  const base = {
    whatsappNumber: "62812345678",
    instagramUrl: "https://instagram.com/example",
    addressText: "Bandung",
    mapsUrl: null,
    openingTime: "06:30",
    closingTime: "17:00",
    serviceDaysText: null,
    deliveryNote: null,
    pickupNote: null,
    gofoodUrl: null,
    shopeefoodUrl: null,
    snackMinBoxes: null,
    snackLeadDays: null,
    snackDescription: null,
  };
  for (const whatsappNumber of ["+62812345678", "0812345678", "123", "62812345678901234"]) {
    assert.equal(validateSettingsInput({ ...base, whatsappNumber }).ok, false);
  }
  for (const field of ["instagramUrl", "mapsUrl", "gofoodUrl", "shopeefoodUrl"] as const) {
    assert.equal(validateSettingsInput({ ...base, [field]: "http://example.com" }).ok, false, field);
  }
  for (const field of ["snackMinBoxes", "snackLeadDays"] as const) {
    for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(validateSettingsInput({ ...base, [field]: value }).ok, false, `${field}=${value}`);
    }
  }
  assert.equal(validateSettingsInput({ ...base, snackMinBoxes: 0 }).ok, false);
  assert.equal(validateSettingsInput({ ...base, snackLeadDays: 0 }).ok, true);
  assert.equal(validateSettingsInput({ ...base, openingTime: "17:00", closingTime: "06:30" }).ok, false);
  assert.equal(validateSettingsInput({ ...base, addressText: "x".repeat(501) }).ok, false);
  assert.equal(validateSettingsInput({ ...base, deliveryNote: "x".repeat(501) }).ok, false);
  assert.equal(validateSettingsInput({ ...base, snackDescription: "x".repeat(1201) }).ok, false);
});

const productInput = {
  name: "  Roti Baru  ",
  category: "roti",
  description: "Roti untuk dicoba",
  priceRupiah: 25000,
  packageLabel: null,
  quantityUnit: "kemasan",
  availability: "unconfirmed",
  preorderLeadDays: null,
  isActive: false,
  isFeatured: false,
  sortOrder: 0,
  imagePath: null,
  imageAlt: null,
  imagePositionX: 50,
  imagePositionY: 50,
};

test("product validation trims allowed fields and ignores slug changes", () => {
  const result = validateProductInput({ ...productInput, name: " Roti Baru ", slug: "slug-palsu" });
  assert.deepEqual(result, { ok: true, data: { ...productInput, name: "Roti Baru" } });
});

test("product validation rejects invalid name, category, negative price, image path, status and lead days", () => {
  const invalid = [
    { name: "   " },
    { category: "dessert" },
    { priceRupiah: -1 },
    { imagePath: "https://example.com/image.webp" },
    { availability: "available" },
    { preorderLeadDays: -1 },
  ];
  for (const change of invalid) {
    assert.equal(validateProductInput({ ...productInput, ...change }).ok, false, JSON.stringify(change));
  }
  assert.equal(validateProductInput({ ...productInput, priceRupiah: Number.MAX_SAFE_INTEGER + 1 }).ok, false);
  assert.equal(validateProductInput({ ...productInput, preorderLeadDays: 1.5 }).ok, false);
});

test("active products need confirmed availability and a verified image reference", () => {
  assert.equal(validateProductInput({ ...productInput, isActive: true }).ok, false);
  assert.equal(validateProductInput({ ...productInput, isActive: true, availability: "ready", imagePath: "bad.webp", imageAlt: "Foto roti" }).ok, false);
  assert.equal(validateProductInput({ ...productInput, imagePath: "088c64e6-d3d7-4368-9b6b-503913a722a6.webp" }).ok, false);
});
