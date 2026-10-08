import { addCalendarDays, isValidCalendarDate } from "./dates.ts";
import type { CartItem, CartRestoreResult, CartReview, PublicProduct, StoredCart } from "./types.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseStoredCart(raw: string | null): CartRestoreResult {
  const empty: StoredCart = { version: 1, items: [] };
  if (raw === null) return { cart: empty, hadInvalidData: false };

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { cart: empty, hadInvalidData: true };
  }
  if (!value || typeof value !== "object" || (value as { version?: unknown }).version !== 1 || !Array.isArray((value as { items?: unknown }).items)) {
    return { cart: empty, hadInvalidData: true };
  }

  const quantities = new Map<string, number>();
  const invalidIds = new Set<string>();
  let hadInvalidData = false;
  for (const entry of (value as { items: unknown[] }).items) {
    if (!entry || typeof entry !== "object") {
      hadInvalidData = true;
      continue;
    }
    const item = entry as { productId?: unknown; quantity?: unknown };
    if (typeof item.productId !== "string" || !uuidPattern.test(item.productId) || !Number.isSafeInteger(item.quantity) || (item.quantity as number) <= 0) {
      hadInvalidData = true;
      continue;
    }
    const id = item.productId.toLowerCase();
    if (invalidIds.has(id)) continue;
    const total = (quantities.get(id) ?? 0) + (item.quantity as number);
    if (!Number.isSafeInteger(total)) {
      quantities.delete(id);
      invalidIds.add(id);
      hadInvalidData = true;
      continue;
    }
    quantities.set(id, total);
  }
  return {
    cart: { version: 1, items: [...quantities].map(([productId, quantity]) => ({ productId, quantity })) },
    hadInvalidData,
  };
}

export function reconcileCart(items: CartItem[], products: PublicProduct[], today?: string): CartReview {
  if (today !== undefined && !isValidCalendarDate(today)) throw new RangeError("Tanggal hari ini tidak valid.");
  const byId = new Map(products.map((product) => [product.id.toLowerCase(), product]));
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!uuidPattern.test(item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new RangeError("Jumlah keranjang harus bilangan bulat positif yang aman.");
    }
    const id = item.productId.toLowerCase();
    const quantity = (quantities.get(id) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new RangeError("Jumlah keranjang melampaui batas aman.");
    quantities.set(id, quantity);
  }

  const lines: CartReview["lines"] = [];
  const blockedItems: CartReview["blockedItems"] = [];
  let subtotalRupiah = 0;
  let maxLeadDays: number | null = null;
  let requiresPreorderDate = false;
  for (const [productId, quantity] of quantities) {
    const product = byId.get(productId);
    if (!product) {
      blockedItems.push({ productId, reason: "missing" });
      continue;
    }
    if (!product.isActive || product.availability === "unavailable") {
      blockedItems.push({ productId, reason: "unavailable" });
      continue;
    }
    if (!Number.isSafeInteger(product.priceRupiah) || (product.priceRupiah as number) <= 0) {
      throw new RangeError(`Harga ${product.name} tidak valid untuk subtotal.`);
    }
    const lineTotalRupiah = quantity * (product.priceRupiah as number);
    if (!Number.isSafeInteger(lineTotalRupiah) || !Number.isSafeInteger(subtotalRupiah + lineTotalRupiah)) {
      throw new RangeError("Subtotal keranjang melampaui batas aman.");
    }
    lines.push({ product, quantity, lineTotalRupiah });
    subtotalRupiah += lineTotalRupiah;
    if (product.availability === "preorder") {
      requiresPreorderDate = true;
      if (product.preorderLeadDays !== null) {
        if (!Number.isSafeInteger(product.preorderLeadDays) || product.preorderLeadDays < 0) {
          throw new RangeError(`Tenggat ${product.name} tidak valid.`);
        }
        maxLeadDays = Math.max(maxLeadDays ?? 0, product.preorderLeadDays);
      }
    }
  }

  if (maxLeadDays !== null && today === undefined) {
    throw new RangeError("Tanggal hari ini diperlukan untuk menghitung tenggat pre-order.");
  }
  return {
    lines,
    blockedItems,
    subtotalRupiah,
    requiresPreorderDate,
    minimumRequestedDate: maxLeadDays === null ? null : addCalendarDays(today as string, maxLeadDays),
  };
}

export function formatRupiah(amount: number): string {
  if (!Number.isSafeInteger(amount)) throw new RangeError("Nilai rupiah harus bilangan bulat aman.");
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}
