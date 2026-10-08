import assert from "node:assert/strict";
import { test } from "node:test";
import { parseStoredCart, reconcileCart } from "../src/lib/cart.ts";
import { cartReducer, initialCartState, restoreCart } from "../src/lib/cart-state.ts";
import { isValidCalendarDate, todayInJakarta } from "../src/lib/dates.ts";
import { buildOrderMessage, buildSnackMessage, buildWhatsAppUrl } from "../src/lib/whatsapp.ts";
import type { PublicProduct, SnackInquiry } from "../src/lib/types.ts";

// Names and prices come from catalog.seed.json; active status here only enables rule tests.
const sobek: PublicProduct = {
  id: "7f7d47da-c903-57e4-94de-d08501f74dfe",
  slug: "roti-sobek-coklat-lumer",
  name: "Roti Sobek Coklat Lumer",
  category: "roti",
  description: "Roti sobek yang lembut dengan isian coklat lumer",
  priceRupiah: 38000,
  packageLabel: "isi 10 potong",
  quantityUnit: "kemasan",
  availability: "unconfirmed",
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

const soes: PublicProduct = {
  ...sobek,
  id: "72b6fcbe-48cf-514d-b74f-73eb42c0ce5c",
  slug: "soes",
  name: "Soes",
  category: "kue_basah",
  description: "Sus dengan isian fla lumer yang milky",
  priceRupiah: 32000,
  packageLabel: "isi 8 pcs",
  sortOrder: 1,
};

test("reconcile subtotal uses current catalog prices", () => {
  assert.equal(reconcileCart([
    { productId: sobek.id, quantity: 1 },
    { productId: soes.id, quantity: 2 },
  ], [sobek, soes]).subtotalRupiah, 102000);
});

test("reconcile blocks missing, inactive, and unavailable items without charging them", () => {
  const unavailable = { ...soes, availability: "unavailable" as const };
  const inactive = { ...sobek, isActive: false };
  const review = reconcileCart([
    { productId: "00000000-0000-4000-8000-000000000001", quantity: 1 },
    { productId: unavailable.id, quantity: 2 },
    { productId: inactive.id, quantity: 1 },
  ], [unavailable, inactive]);

  assert.deepEqual(review.blockedItems, [
    { productId: "00000000-0000-4000-8000-000000000001", reason: "missing" },
    { productId: unavailable.id, reason: "unavailable" },
    { productId: inactive.id, reason: "unavailable" },
  ]);
  assert.equal(review.subtotalRupiah, 0);
});

test("reconcile requires a date for preorder and applies only a configured lead", () => {
  const preorder = { ...sobek, availability: "preorder" as const, preorderLeadDays: 2 };
  const review = reconcileCart([{ productId: preorder.id, quantity: 1 }], [preorder], "2026-10-08");
  assert.equal(review.requiresPreorderDate, true);
  assert.equal(review.minimumRequestedDate, "2026-10-10");

  const unknownLead = reconcileCart([{ productId: sobek.id, quantity: 1 }], [{ ...sobek, availability: "preorder" }], "2026-10-08");
  assert.equal(unknownLead.requiresPreorderDate, true);
  assert.equal(unknownLead.minimumRequestedDate, null);
  assert.throws(() => reconcileCart([{ productId: preorder.id, quantity: 1 }], [preorder]), RangeError);
  assert.throws(() => reconcileCart([], [], "2026-02-30"), RangeError);
});

test("rejects unsafe quantity, multiplication, and subtotal overflow", () => {
  assert.throws(() => reconcileCart([{ productId: sobek.id, quantity: -1 }], [sobek]), RangeError);
  assert.throws(() => reconcileCart([{ productId: sobek.id, quantity: 1.5 }], [sobek]), RangeError);
  assert.throws(() => reconcileCart([{ productId: sobek.id, quantity: Number.MAX_SAFE_INTEGER }], [sobek]), RangeError);
  assert.throws(() => reconcileCart([{ productId: sobek.id, quantity: 2 }], [{ ...sobek, priceRupiah: Number.MAX_SAFE_INTEGER }]), RangeError);
  const hugePriceProducts = [
    { ...sobek, priceRupiah: Number.MAX_SAFE_INTEGER },
    { ...soes, priceRupiah: 1 },
  ];
  assert.throws(() => reconcileCart([
    { productId: sobek.id, quantity: 1 },
    { productId: soes.id, quantity: 1 },
  ], hugePriceProducts), RangeError);
});

test("parseStoredCart merges duplicate IDs and rejects corrupt or unknown versions", () => {
  const valid = parseStoredCart(JSON.stringify({ version: 1, items: [
    { productId: sobek.id, quantity: 1 },
    { productId: sobek.id, quantity: 2 },
    { productId: soes.id, quantity: 1 },
  ] }));
  assert.deepEqual(valid, {
    cart: { version: 1, items: [{ productId: sobek.id, quantity: 3 }, { productId: soes.id, quantity: 1 }] },
    hadInvalidData: false,
  });

  assert.deepEqual(parseStoredCart(null), { cart: { version: 1, items: [] }, hadInvalidData: false });
  const stripped = parseStoredCart(JSON.stringify({ version: 1, items: [{ productId: sobek.id, quantity: 2, name: "Nama lama", priceRupiah: 1 }] }));
  assert.deepEqual(stripped.cart.items, [{ productId: sobek.id, quantity: 2 }]);
  assert.equal(parseStoredCart("{").hadInvalidData, true);
  assert.deepEqual(parseStoredCart('{"version":2,"items":[]}'), {
    cart: { version: 1, items: [] },
    hadInvalidData: true,
  });
});

test("cart state waits for restore, merges additions, updates and removes by product ID", () => {
  assert.equal(initialCartState.hydrated, false);
  let state = cartReducer(initialCartState, { type: "restore", items: [], hadInvalidData: false, storageUnavailable: false });
  state = cartReducer(state, { type: "add", productId: sobek.id, quantity: 1 });
  state = cartReducer(state, { type: "add", productId: sobek.id, quantity: 2 });
  assert.deepEqual(state.items, [{ productId: sobek.id, quantity: 3 }]);
  state = cartReducer(state, { type: "set-quantity", productId: sobek.id, quantity: 2 });
  assert.deepEqual(state.items, [{ productId: sobek.id, quantity: 2 }]);
  state = cartReducer(state, { type: "remove", productId: sobek.id });
  assert.deepEqual(state.items, []);
});

test("storage restoration handles empty, invalid, unknown-version and denied storage", () => {
  assert.deepEqual(restoreCart(() => null), { items: [], hadInvalidData: false, storageUnavailable: false });
  assert.equal(restoreCart(() => JSON.stringify({ version: 9, items: [] })).hadInvalidData, true);
  assert.equal(restoreCart(() => { throw new Error("storage denied"); }).storageUnavailable, true);
});

test("parseStoredCart ignores invalid quantities and marks partial data", () => {
  for (const quantity of [-1, 1.25, Number.MAX_SAFE_INTEGER + 1]) {
    const result = parseStoredCart(JSON.stringify({ version: 1, items: [{ productId: sobek.id, quantity }] }));
    assert.equal(result.hadInvalidData, true);
    assert.deepEqual(result.cart.items, []);
  }

  const overflow = parseStoredCart(JSON.stringify({ version: 1, items: [
    { productId: sobek.id, quantity: Number.MAX_SAFE_INTEGER },
    { productId: sobek.id, quantity: 1 },
  ] }));
  assert.equal(overflow.hadInvalidData, true);
  assert.deepEqual(overflow.cart.items, []);
});

test("Jakarta date and strict calendar validation handle midnight and impossible dates", () => {
  assert.equal(todayInJakarta(new Date("2026-10-07T17:30:00Z")), "2026-10-08");
  assert.equal(isValidCalendarDate("2026-02-30"), false);
  assert.equal(isValidCalendarDate("2024-02-29"), true);
  assert.equal(isValidCalendarDate("2026-2-03"), false);
});

test("order and snack messages preserve values and encode exactly once", () => {
  const review = reconcileCart([
    { productId: sobek.id, quantity: 1 },
    { productId: soes.id, quantity: 2 },
  ], [sobek, soes]);
  const message = buildOrderMessage(review, {
    fulfillment: "delivery",
    area: "Bandung & sekitarnya",
    requestedDate: "2026-10-10",
    note: "Catatan: coklat & keju\nTerima kasih 😊",
  });
  assert.match(message, /Subtotal produk: Rp\u00a0102\.000/);
  assert.match(message, /Mohon konfirmasi/);

  const special = "Catatan: coklat & keju\nTerima kasih 😊";
  const url = buildWhatsAppUrl("6283197665812", special);
  assert.ok(url);
  assert.equal(new URL(url).searchParams.get("text"), special);
  assert.equal(buildWhatsAppUrl("6283197665812", "x".repeat(9000)), null);
  assert.equal(buildWhatsAppUrl("bad-number", "hi"), null);

  const snack: SnackInquiry = { eventDate: "2026-11-01", boxes: 12 };
  assert.match(buildSnackMessage(snack), /Permintaan snack box/);
  assert.match(buildSnackMessage(snack), /12 box/);
});
