import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.ts";

export const MAX_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024;
const storedImagePath = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

export function validateImageUploadSize(size: number): void {
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new RangeError("Ukuran foto harus lebih dari 0 dan maksimal 3 MiB.");
  }
}

export async function normalizeImage(input: Uint8Array): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const source = sharp(input, { failOn: "error", limitInputPixels: 20_000_000, animated: false });
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
    throw new Error("Format foto tidak didukung.");
  }

  const { data, info } = await source
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return { bytes: data, width: info.width, height: info.height };
}

export async function uploadNormalizedImage(client: SupabaseClient<Database>, path: string, bytes: Uint8Array): Promise<void> {
  if (!storedImagePath.test(path)) throw new Error("Path foto tidak valid.");
  const { error } = await client.storage.from("catalog-images").upload(path, Buffer.from(bytes), {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw new Error("Foto belum berhasil diunggah.");
}

export async function getStoredImageInfo(client: SupabaseClient<Database>, path: string): Promise<{ width: number; height: number }> {
  if (!storedImagePath.test(path)) throw new Error("Path foto tidak valid.");
  const { data, error } = await client.storage.from("catalog-images").download(path);
  if (error || !data) throw new Error("Foto belum ditemukan di penyimpanan.");
  const bytes = new Uint8Array(await data.arrayBuffer());
  const metadata = await sharp(bytes, { failOn: "error", limitInputPixels: 20_000_000, animated: false }).metadata();
  if (metadata.format !== "webp" || !metadata.width || !metadata.height || metadata.width > 1600 || metadata.height > 1600 || metadata.width * metadata.height > 20_000_000) {
    throw new Error("Foto tersimpan tidak sesuai format dan ukuran yang diizinkan.");
  }
  return { width: metadata.width, height: metadata.height };
}
