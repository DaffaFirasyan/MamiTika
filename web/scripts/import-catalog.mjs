import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { normalizeImage } from "../src/lib/images.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(here, "../data");
const sourceImages = path.resolve(here, "../../mamitika-redesign-reference");
const [catalog, assetMap] = await Promise.all([
  readFile(path.join(dataDirectory, "catalog.seed.json"), "utf8").then(JSON.parse),
  readFile(path.join(dataDirectory, "asset-map.json"), "utf8").then(JSON.parse),
]);
const verifiedImages = new Map(assetMap.products.filter((item) => item.verified && item.sourceFile).map((item) => [item.productSlug, item]));
const dryRun = process.argv.includes("--dry-run");

if (catalog.length !== 18) throw new Error("Seed katalog harus berisi 18 SKU.");
if (dryRun) {
  console.log(`DRY RUN · ${catalog.length} SKU · tidak ada koneksi database atau key yang diperlukan`);
  for (const product of catalog) {
    const mapping = verifiedImages.get(product.slug);
    console.log(`${product.slug} | ${mapping?.sourceFile ?? "tanpa foto terverifikasi"} | ${product.is_active ? "aktif" : "nonaktif"} | ${product.availability}`);
  }
} else {
  if (process.env.SUPABASE_ENVIRONMENT !== "development") {
    throw new Error("Tulis hanya diizinkan dengan SUPABASE_ENVIRONMENT=development yang dikonfirmasi operator.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const developmentUrl = process.env.SUPABASE_DEVELOPMENT_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  let urlsMatch = false;
  try { urlsMatch = Boolean(url && developmentUrl && new URL(url).origin === new URL(developmentUrl).origin); } catch { /* invalid URLs remain blocked */ }
  if (!urlsMatch || !key) throw new Error("URL project harus cocok dengan SUPABASE_DEVELOPMENT_URL yang dikonfirmasi operator.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const existingResult = await client.from("products").select("slug").in("slug", catalog.map((product) => product.slug));
  if (existingResult.error) throw new Error("Tidak dapat membaca SKU yang sudah ada.");
  const existing = new Set(existingResult.data.map((row) => row.slug));
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of catalog) {
    if (existing.has(product.slug)) {
      skipped += 1;
      console.log(`SKIP ${product.slug} · slug sudah ada`);
      continue;
    }
    const mapping = verifiedImages.get(product.slug);
    let image = null;
    if (mapping) {
      try {
        const sourcePath = path.resolve(sourceImages, mapping.sourceFile);
        if (!sourcePath.startsWith(`${sourceImages}${path.sep}`)) throw new Error("Invalid source path");
        const normalized = await normalizeImage(await readFile(sourcePath));
        const imagePath = `${randomUUID()}.webp`;
        const upload = await client.storage.from("catalog-images").upload(imagePath, normalized.bytes, { contentType: "image/webp", upsert: false });
        if (upload.error) throw new Error("Upload failed");
        image = { image_path: imagePath, image_width: normalized.width, image_height: normalized.height };
      } catch {
        errors += 1;
        console.log(`ERROR ${product.slug} · foto terverifikasi tidak dapat diproses`);
        continue;
      }
    }
    const { error } = await client.from("products").insert({
      ...product,
      image_path: image?.image_path ?? null,
      image_alt: mapping?.alt ?? null,
      image_width: image?.image_width ?? null,
      image_height: image?.image_height ?? null,
    });
    if (error) {
      errors += 1;
      console.log(`ERROR ${product.slug} · SKU tidak tersimpan`);
      continue;
    }
    inserted += 1;
    console.log(`INSERT ${product.slug} · ${mapping?.sourceFile ?? "tanpa foto terverifikasi"}`);
  }
  console.log(`Selesai · insert ${inserted} · skip ${skipped} · error ${errors}`);
  if (errors) process.exitCode = 1;
}
