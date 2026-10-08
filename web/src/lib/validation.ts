import { addCalendarDays, isValidCalendarDate } from "./dates.ts";
import type { ActionResult, CartReview, Fulfillment, GalleryInput, OrderPreferences, ProductInput, SettingsInput, SiteSettings, SnackInquiry } from "./types.ts";

const fulfillmentValues: Fulfillment[] = ["delivery", "pickup", "undecided"];

function addError(errors: Record<string, string>, field: string, message: string) {
  errors[field] = message;
}

function validToday(today: string): boolean {
  return isValidCalendarDate(today);
}

function optionalText(input: Record<string, unknown>, field: string, max: number, errors: Record<string, string>): string | undefined {
  const value = input[field];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    addError(errors, field, "Isian harus berupa teks.");
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) addError(errors, field, `Maksimal ${max} karakter.`);
  return trimmed || undefined;
}

function isPastOrInvalid(date: unknown, today: string): date is string {
  return typeof date !== "string" || !isValidCalendarDate(date) || date < today;
}

const productCategories = ["roti", "kue_basah", "risoles_lumpia"] as const;
const availabilityValues = ["unconfirmed", "ready", "preorder", "unavailable"] as const;
const storedImagePath = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;
const timeValue = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function inputRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
}

function nullableTextField(value: unknown, field: string, max: number, errors: Record<string, string>): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    addError(errors, field, "Isian harus berupa teks atau kosong.");
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) addError(errors, field, `Maksimal ${max} karakter.`);
  return trimmed || null;
}

function nullableHttpsUrl(value: unknown, field: string, errors: Record<string, string>): string | null {
  const url = nullableTextField(value, field, 2048, errors);
  if (url === null) return null;
  try {
    if (new URL(url).protocol === "https:") return url;
  } catch { /* reported below */ }
  addError(errors, field, "Masukkan URL HTTPS yang valid.");
  return null;
}

export function validateGalleryInput(input: unknown): ActionResult<GalleryInput> {
  const value = inputRecord(input);
  const errors: Record<string, string> = {};
  const imagePath = value.imagePath;
  const imageAlt = typeof value.imageAlt === "string" ? value.imageAlt.trim() : "";
  const caption = nullableTextField(value.caption, "caption", 240, errors);
  const sortOrder = value.sortOrder;
  if (typeof imagePath !== "string" || !storedImagePath.test(imagePath)) addError(errors, "imagePath", "Pilih foto hasil unggah yang valid.");
  if (!imageAlt || imageAlt.length > 180) addError(errors, "imageAlt", "Teks alternatif wajib diisi (maksimal 180 karakter).");
  if (!Number.isSafeInteger(sortOrder) || (sortOrder as number) < 0 || (sortOrder as number) > 2_147_483_647) addError(errors, "sortOrder", "Urutan harus bilangan bulat nol atau lebih.");
  if (typeof value.isActive !== "boolean") addError(errors, "isActive", "Status aktif tidak valid.");
  if (Object.keys(errors).length) return { ok: false, message: "Periksa kembali data galeri.", fieldErrors: errors };
  return { ok: true, data: { imagePath: imagePath as string, imageAlt, caption, sortOrder: sortOrder as number, isActive: value.isActive as boolean } };
}

export function validateSettingsInput(input: unknown): ActionResult<SettingsInput> {
  const value = inputRecord(input);
  const errors: Record<string, string> = {};
  const whatsappNumber = typeof value.whatsappNumber === "string" ? value.whatsappNumber.trim() : "";
  const instagramUrl = typeof value.instagramUrl === "string" ? value.instagramUrl.trim() : "";
  const addressText = typeof value.addressText === "string" ? value.addressText.trim() : "";
  const openingTime = typeof value.openingTime === "string" ? value.openingTime : "";
  const closingTime = typeof value.closingTime === "string" ? value.closingTime : "";
  if (!/^[1-9]\d{7,14}$/.test(whatsappNumber)) addError(errors, "whatsappNumber", "Gunakan 8–15 digit internasional tanpa tanda + atau awalan 0.");
  try {
    if (!instagramUrl || new URL(instagramUrl).protocol !== "https:") addError(errors, "instagramUrl", "Masukkan URL HTTPS yang valid.");
  } catch { addError(errors, "instagramUrl", "Masukkan URL HTTPS yang valid."); }
  if (!addressText || addressText.length > 300) addError(errors, "addressText", "Alamat wajib diisi (maksimal 300 karakter).");
  if (!timeValue.test(openingTime)) addError(errors, "openingTime", "Masukkan jam dalam format 24 jam.");
  if (!timeValue.test(closingTime)) addError(errors, "closingTime", "Masukkan jam dalam format 24 jam.");
  if (timeValue.test(openingTime) && timeValue.test(closingTime) && openingTime >= closingTime) addError(errors, "closingTime", "Jam tutup harus setelah jam buka.");

  const mapsUrl = nullableHttpsUrl(value.mapsUrl, "mapsUrl", errors);
  const gofoodUrl = nullableHttpsUrl(value.gofoodUrl, "gofoodUrl", errors);
  const shopeefoodUrl = nullableHttpsUrl(value.shopeefoodUrl, "shopeefoodUrl", errors);
  const serviceDaysText = nullableTextField(value.serviceDaysText, "serviceDaysText", 160, errors);
  const deliveryNote = nullableTextField(value.deliveryNote, "deliveryNote", 500, errors);
  const pickupNote = nullableTextField(value.pickupNote, "pickupNote", 500, errors);
  const snackDescription = nullableTextField(value.snackDescription, "snackDescription", 1200, errors);
  const snackMinBoxes = value.snackMinBoxes;
  const snackLeadDays = value.snackLeadDays;
  if (snackMinBoxes !== null && (!Number.isSafeInteger(snackMinBoxes) || (snackMinBoxes as number) <= 0 || (snackMinBoxes as number) > 2_147_483_647)) addError(errors, "snackMinBoxes", "Minimum harus bilangan bulat positif atau kosong.");
  if (snackLeadDays !== null && (!Number.isSafeInteger(snackLeadDays) || (snackLeadDays as number) < 0 || (snackLeadDays as number) > 2_147_483_647)) addError(errors, "snackLeadDays", "Tenggat harus bilangan bulat nol atau lebih, atau kosong.");
  if (Object.keys(errors).length) return { ok: false, message: "Periksa kembali pengaturan usaha.", fieldErrors: errors };
  return {
    ok: true,
    data: {
      whatsappNumber,
      instagramUrl,
      addressText,
      mapsUrl,
      openingTime,
      closingTime,
      serviceDaysText,
      deliveryNote,
      pickupNote,
      gofoodUrl,
      shopeefoodUrl,
      snackMinBoxes: snackMinBoxes as number | null,
      snackLeadDays: snackLeadDays as number | null,
      snackDescription,
    },
  };
}

export function validateProductInput(input: unknown): ActionResult<ProductInput> {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const category = value.category;
  const availability = value.availability;
  const price = value.priceRupiah;
  const lead = value.preorderLeadDays;
  const sortOrder = value.sortOrder;
  const imagePath = value.imagePath;
  const imageAlt = value.imageAlt;
  const optionalProductText = (field: "packageLabel" | "quantityUnit", max: number) => {
    const raw = value[field];
    if (raw === null || raw === "") return null;
    if (typeof raw !== "string") {
      addError(errors, field, "Isian harus berupa teks.");
      return null;
    }
    const trimmed = raw.trim();
    if (trimmed.length > max) addError(errors, field, `Maksimal ${max} karakter.`);
    return trimmed || null;
  };

  if (!name || name.length > 120) addError(errors, "name", "Nama wajib diisi (maksimal 120 karakter).");
  if (!productCategories.includes(category as (typeof productCategories)[number])) addError(errors, "category", "Pilih kategori produk.");
  if (description.length > 1200 || typeof value.description !== "string") addError(errors, "description", "Deskripsi maksimal 1.200 karakter.");
  if (!Number.isSafeInteger(price) || (price as number) <= 0 || (price as number) > 2_147_483_647) addError(errors, "priceRupiah", "Harga harus bilangan rupiah positif yang valid.");
  if (!availabilityValues.includes(availability as (typeof availabilityValues)[number])) addError(errors, "availability", "Pilih status ketersediaan.");
  if (lead !== null && (!Number.isSafeInteger(lead) || (lead as number) < 0 || (lead as number) > 2_147_483_647)) addError(errors, "preorderLeadDays", "Tenggat harus bilangan bulat nol atau lebih, atau kosong.");
  if (typeof value.isActive !== "boolean") addError(errors, "isActive", "Status aktif tidak valid.");
  if (typeof value.isFeatured !== "boolean") addError(errors, "isFeatured", "Pilihan menu tidak valid.");
  if (!Number.isSafeInteger(sortOrder) || (sortOrder as number) < 0 || (sortOrder as number) > 2_147_483_647) addError(errors, "sortOrder", "Urutan harus bilangan bulat nol atau lebih.");
  if (imagePath !== null && (typeof imagePath !== "string" || !storedImagePath.test(imagePath))) addError(errors, "imagePath", "Pilih foto hasil unggah yang valid.");
  if (imagePath === null && imageAlt !== null && imageAlt !== "") addError(errors, "imageAlt", "Teks alternatif membutuhkan foto.");
  if (imagePath !== null && (typeof imageAlt !== "string" || !imageAlt.trim() || imageAlt.trim().length > 180)) addError(errors, "imageAlt", "Teks alternatif foto wajib diisi (maksimal 180 karakter).");
  for (const field of ["imagePositionX", "imagePositionY"] as const) {
    const position = value[field];
    if (!Number.isSafeInteger(position) || (position as number) < 0 || (position as number) > 100) addError(errors, field, "Posisi crop harus bilangan bulat 0–100.");
  }
  if (value.isActive === true && availability === "unconfirmed") addError(errors, "availability", "Produk dengan status belum dikonfirmasi tidak dapat ditampilkan.");
  if (value.isActive === true && !imagePath) addError(errors, "imagePath", "Produk aktif memerlukan foto yang sudah tersimpan.");

  const packageLabel = optionalProductText("packageLabel", 80);
  const quantityUnit = optionalProductText("quantityUnit", 40);
  if (Object.keys(errors).length) return { ok: false, message: "Periksa kembali data produk.", fieldErrors: errors };
  return {
    ok: true,
    data: {
      name,
      category: category as ProductInput["category"],
      description,
      priceRupiah: price as number,
      packageLabel,
      quantityUnit,
      availability: availability as ProductInput["availability"],
      preorderLeadDays: lead as number | null,
      isActive: value.isActive as boolean,
      isFeatured: value.isFeatured as boolean,
      sortOrder: sortOrder as number,
      imagePath: imagePath as string | null,
      imageAlt: typeof imageAlt === "string" && imageAlt.trim() ? imageAlt.trim() : null,
      imagePositionX: value.imagePositionX as number,
      imagePositionY: value.imagePositionY as number,
    },
  };
}

export function validateOrderPreferences(
  input: unknown,
  review: CartReview,
  _settings: SiteSettings,
  today: string,
): ActionResult<OrderPreferences> {
  if (!validToday(today)) throw new RangeError("Tanggal hari ini tidak valid.");
  const errors: Record<string, string> = {};
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const fulfillment = value.fulfillment;
  if (!fulfillmentValues.includes(fulfillment as Fulfillment)) addError(errors, "fulfillment", "Pilih metode pemenuhan.");
  const area = optionalText(value, "area", 120, errors);
  const note = optionalText(value, "note", 500, errors);
  const requestedDate = value.requestedDate;
  if (requestedDate !== undefined && requestedDate !== null && requestedDate !== "") {
    if (isPastOrInvalid(requestedDate, today)) addError(errors, "requestedDate", "Masukkan tanggal kalender hari ini atau setelahnya.");
    else if (review.minimumRequestedDate && requestedDate < review.minimumRequestedDate) {
      addError(errors, "requestedDate", `Pilih tanggal ${review.minimumRequestedDate} atau setelahnya.`);
    }
  } else if (review.requiresPreorderDate) {
    addError(errors, "requestedDate", "Tanggal yang diinginkan wajib untuk produk pre-order.");
  }
  if (Object.keys(errors).length) return { ok: false, message: "Periksa kembali isian keranjang.", fieldErrors: errors };
  return {
    ok: true,
    data: {
      fulfillment: fulfillment as Fulfillment,
      ...(area ? { area } : {}),
      ...(typeof requestedDate === "string" && requestedDate ? { requestedDate } : {}),
      ...(note ? { note } : {}),
    },
  };
}

export function validateSnackInquiry(input: unknown, settings: SiteSettings, today: string): ActionResult<SnackInquiry> {
  if (!validToday(today)) throw new RangeError("Tanggal hari ini tidak valid.");
  const errors: Record<string, string> = {};
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const eventType = optionalText(value, "eventType", 120, errors);
  const contents = optionalText(value, "contents", 500, errors);
  const area = optionalText(value, "area", 120, errors);
  const note = optionalText(value, "note", 500, errors);
  const eventDate = value.eventDate;
  if (typeof eventDate !== "string" || !isValidCalendarDate(eventDate) || eventDate < today) {
    addError(errors, "eventDate", "Masukkan tanggal kalender hari ini atau setelahnya.");
  } else if (settings.snackLeadDays !== null) {
    if (!Number.isSafeInteger(settings.snackLeadDays) || settings.snackLeadDays < 0) throw new RangeError("Tenggat snack box tidak valid.");
    const minimumDate = addCalendarDays(today, settings.snackLeadDays);
    if (eventDate < minimumDate) addError(errors, "eventDate", `Pilih tanggal ${minimumDate} atau setelahnya.`);
  }

  const boxes = value.boxes;
  if (!Number.isSafeInteger(boxes) || (boxes as number) <= 0) addError(errors, "boxes", "Jumlah box harus bilangan bulat positif.");
  else if (settings.snackMinBoxes !== null) {
    if (!Number.isSafeInteger(settings.snackMinBoxes) || settings.snackMinBoxes <= 0) throw new RangeError("Minimum snack box tidak valid.");
    if ((boxes as number) < settings.snackMinBoxes) addError(errors, "boxes", `Jumlah minimum adalah ${settings.snackMinBoxes} box.`);
  }

  const budgetPerBox = value.budgetPerBox;
  if (budgetPerBox !== undefined && budgetPerBox !== null && budgetPerBox !== "" && (!Number.isSafeInteger(budgetPerBox) || (budgetPerBox as number) <= 0)) {
    addError(errors, "budgetPerBox", "Anggaran harus bilangan rupiah positif.");
  }
  if (Object.keys(errors).length) return { ok: false, message: "Periksa kembali kebutuhan snack box.", fieldErrors: errors };
  return {
    ok: true,
    data: {
      eventDate: eventDate as string,
      boxes: boxes as number,
      ...(eventType ? { eventType } : {}),
      ...(contents ? { contents } : {}),
      ...(typeof budgetPerBox === "number" ? { budgetPerBox } : {}),
      ...(area ? { area } : {}),
      ...(note ? { note } : {}),
    },
  };
}
