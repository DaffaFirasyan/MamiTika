import { formatRupiah } from "./cart.ts";
import type { CartReview, OrderPreferences, SnackInquiry } from "./types.ts";

export function buildOrderMessage(review: CartReview, preferences: OrderPreferences): string {
  const lines = review.lines.map(({ product, quantity, lineTotalRupiah }, index) => {
    const packageLabel = product.packageLabel ? ` — ${product.packageLabel}` : "";
    const unit = product.quantityUnit ?? "unit";
    return `${index + 1}. ${product.name}${packageLabel}\n   ${quantity} ${unit} × ${formatRupiah(product.priceRupiah as number)} = ${formatRupiah(lineTotalRupiah)}`;
  });
  const fulfillment = { delivery: "Pengiriman", pickup: "Ambil sendiri", undecided: "Belum ditentukan" }[preferences.fulfillment];
  return [
    "Halo Mamitika, saya ingin memesan:",
    "",
    ...lines,
    "",
    `Subtotal produk: ${formatRupiah(review.subtotalRupiah)}`,
    `Metode: ${fulfillment}`,
    ...(preferences.area ? [`Lokasi ringkas: ${preferences.area}`] : []),
    ...(preferences.requestedDate ? [`Tanggal yang diinginkan: ${preferences.requestedDate}`] : []),
    ...(preferences.note ? [`Catatan: ${preferences.note}`] : []),
    "",
    "Mohon konfirmasi ketersediaan, jadwal, pengiriman/pengambilan, dan total akhir pesanan. Terima kasih.",
  ].join("\n");
}

export function buildSnackMessage(inquiry: SnackInquiry): string {
  return [
    "Permintaan snack box",
    ...(inquiry.eventType ? [`Jenis acara: ${inquiry.eventType}`] : []),
    `Tanggal acara: ${inquiry.eventDate}`,
    `Perkiraan jumlah: ${inquiry.boxes} box`,
    ...(inquiry.contents ? [`Preferensi isi: ${inquiry.contents}`] : []),
    ...(inquiry.budgetPerBox !== undefined ? [`Anggaran per box: ${formatRupiah(inquiry.budgetPerBox)}`] : []),
    ...(inquiry.area ? [`Lokasi ringkas: ${inquiry.area}`] : []),
    ...(inquiry.note ? [`Catatan: ${inquiry.note}`] : []),
    "",
    "Mohon konfirmasi pilihan paket, harga, dan jadwal. Terima kasih.",
  ].join("\n");
}

export function buildWhatsAppUrl(number: string, message: string): string | null {
  if (!/^\d{8,15}$/.test(number)) return null;
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set("text", message);
  return url.href.length <= 8000 ? url.href : null;
}
