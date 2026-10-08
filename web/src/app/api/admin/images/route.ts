import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/auth";
import { MAX_IMAGE_UPLOAD_BYTES, normalizeImage, uploadNormalizedImage, validateImageUploadSize } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const maxRequestBytes = MAX_IMAGE_UPLOAD_BYTES + 64 * 1024;

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  const configuredUrl = process.env.BETTER_AUTH_URL;
  if (!origin || !configuredUrl) return false;
  try {
    return new URL(origin).origin === new URL(configuredUrl).origin;
  } catch {
    return false;
  }
}

async function readBoundedFormData(request: Request): Promise<FormData> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Bad request");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxRequestBytes) {
      await reader.cancel();
      throw new RangeError("Payload too large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError && error.reason === "unauthenticated") {
      return NextResponse.json({ error: "Sesi pemilik diperlukan." }, { status: 401 });
    }
    if (error instanceof AdminAccessError && error.reason === "forbidden") {
      return NextResponse.json({ error: "Akun ini tidak memiliki akses pemilik." }, { status: 403 });
    }
    return NextResponse.json({ error: "Akses pemilik belum dapat diverifikasi." }, { status: 503 });
  }
  if (!originAllowed(request)) return NextResponse.json({ error: "Asal permintaan tidak diizinkan." }, { status: 403 });
  const requestLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(requestLength) && requestLength > maxRequestBytes) {
    return NextResponse.json({ error: "Ukuran foto maksimal 3 MiB." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await readBoundedFormData(request)).get("file");
  } catch (error) {
    const isTooLarge = error instanceof RangeError;
    return NextResponse.json({ error: isTooLarge ? "Ukuran permintaan terlalu besar." : "Berkas foto tidak dapat dibaca." }, { status: isTooLarge ? 413 : 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Pilih satu berkas foto." }, { status: 400 });
  try {
    validateImageUploadSize(file.size);
  } catch {
    return NextResponse.json({ error: "Ukuran foto harus lebih dari 0 dan maksimal 3 MiB." }, { status: 413 });
  }

  let normalized: Awaited<ReturnType<typeof normalizeImage>>;
  try {
    normalized = await normalizeImage(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Foto harus berupa JPEG, PNG, atau WebP yang valid dan maksimal 20 megapiksel." }, { status: 400 });
  }

  try {
    const client = await createAdminClient();
    const path = `${randomUUID()}.webp`;
    await uploadNormalizedImage(client, path, normalized.bytes);
    return NextResponse.json({ path, width: normalized.width, height: normalized.height }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Foto belum berhasil diunggah. Foto tersimpan sebelumnya tetap aman." }, { status: 503 });
  }
}
