import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { MAX_IMAGE_UPLOAD_BYTES, getStoredImageInfo, normalizeImage, uploadNormalizedImage, validateImageUploadSize } from "../src/lib/images.ts";
import { persistProductRow } from "../src/lib/product-persistence.ts";

test("normalizes a decoded image to a fresh UUID WebP and real dimensions", async () => {
  const onePixelPng = await sharp({ create: { width: 1, height: 1, channels: 3, background: "#fff" } }).png().toBuffer();
  const result = await normalizeImage(onePixelPng);
  assert.deepEqual(Object.keys(result).sort(), ["bytes", "height", "width"]);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.equal(result.bytes[0], 0x52);
  assert.equal(result.bytes[1], 0x49);
  assert.equal(result.bytes[2], 0x46);
  assert.equal(result.bytes[3], 0x46);
});

test("rejects invalid image bytes", async () => {
  await assert.rejects(normalizeImage(Buffer.from("not an image")));
});

test("rejects decoded images above the 20 megapixel limit", async () => {
  const oversized = await sharp({ create: { width: 5000, height: 4001, channels: 3, background: "#fff" } }).png().toBuffer();
  await assert.rejects(normalizeImage(oversized));
});

test("enforces the 3 MiB image upload boundary", () => {
  validateImageUploadSize(MAX_IMAGE_UPLOAD_BYTES);
  assert.throws(() => validateImageUploadSize(MAX_IMAGE_UPLOAD_BYTES + 1), RangeError);
  assert.throws(() => validateImageUploadSize(0), RangeError);
});

test("upload failure is reported without upserting an old object", async () => {
  let options: Record<string, unknown> | undefined;
  const client = {
    storage: { from: () => ({ upload: async (_path: string, _bytes: Buffer, passed: Record<string, unknown>) => {
      options = passed;
      return { error: new Error("fixture upload failure") };
    } }) },
  } as never;
  await assert.rejects(uploadNormalizedImage(client, "088c64e6-d3d7-4368-9b6b-503913a722a6.webp", Buffer.from("webp")), /Foto belum berhasil/);
  assert.equal(options?.upsert, false);
});

test("stored image dimensions come from decoded storage bytes, not browser input", async () => {
  const image = await sharp({ create: { width: 4, height: 3, channels: 3, background: "#fff" } }).webp().toBuffer();
  const client = {
    storage: { from: () => ({ download: async () => ({ data: new Blob([image]), error: null }) }) },
  } as never;
  assert.deepEqual(await getStoredImageInfo(client, "088c64e6-d3d7-4368-9b6b-503913a722a6.webp"), { width: 4, height: 3 });
  await assert.rejects(getStoredImageInfo(client, "https://example.com/image.webp"));
});

test("uploaded candidate survives a database save failure while the old product image stays referenced", async () => {
  const oldPath = "c35b3292-9f66-41b5-a315-bf3227db5a9a.webp";
  const candidatePath = "088c64e6-d3d7-4368-9b6b-503913a722a6.webp";
  const storedObjects = new Set([oldPath]);
  const storedProductImagePath = oldPath;
  let removeCalls = 0;
  const query = {
    update: () => query,
    eq: () => query,
    select: () => query,
    maybeSingle: async () => ({ data: null, error: new Error("fixture database failure") }),
  };
  const client = {
    storage: { from: () => ({
      upload: async (path: string) => { storedObjects.add(path); return { data: { path }, error: null }; },
      remove: async () => { removeCalls += 1; return { data: [], error: null }; },
    }) },
    from: () => query,
  } as never;

  await uploadNormalizedImage(client, candidatePath, Buffer.from("normalized fixture bytes"));
  const saved = await persistProductRow(client, "15f5983d-d612-4596-a0d8-20c97b3badf6", null, null, { image_path: candidatePath } as never);
  assert.equal(saved.ok, false);
  assert.equal(storedObjects.has(candidatePath), true);
  assert.equal(storedProductImagePath, oldPath);
  assert.equal(removeCalls, 0);
});
