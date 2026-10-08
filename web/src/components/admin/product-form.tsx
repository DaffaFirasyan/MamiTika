"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { saveProduct } from "@/app/admin/actions";
import type { AdminProduct, Availability, Category, ProductInput } from "@/lib/types";

const maxImageUploadBytes = 3 * 1024 * 1024;

type Draft = Omit<ProductInput, "priceRupiah" | "preorderLeadDays" | "sortOrder" | "imagePositionX" | "imagePositionY"> & {
  priceRupiah: string;
  preorderLeadDays: string;
  sortOrder: string;
  imagePositionX: string;
  imagePositionY: string;
};
type CandidateImage = { path: string; width: number; height: number };

const categories: { value: Category; label: string }[] = [
  { value: "roti", label: "Roti" },
  { value: "kue_basah", label: "Kue basah" },
  { value: "risoles_lumpia", label: "Risoles dan lumpia" },
];
const availabilityOptions: { value: Availability; label: string }[] = [
  { value: "unconfirmed", label: "Belum dikonfirmasi" },
  { value: "ready", label: "Ready stock" },
  { value: "preorder", label: "Pre-order" },
  { value: "unavailable", label: "Tidak tersedia" },
];
const uuidWebp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

function initialDraft(product?: AdminProduct): Draft {
  return {
    name: product?.name ?? "",
    category: product?.category ?? "roti",
    description: product?.description ?? "",
    priceRupiah: product ? String(product.priceRupiah) : "",
    packageLabel: product?.packageLabel ?? null,
    quantityUnit: product?.quantityUnit ?? null,
    availability: product?.availability ?? "unconfirmed",
    preorderLeadDays: product?.preorderLeadDays === null || product?.preorderLeadDays === undefined ? "" : String(product.preorderLeadDays),
    isActive: product?.isActive ?? false,
    isFeatured: product?.isFeatured ?? false,
    sortOrder: String(product?.sortOrder ?? 0),
    imagePath: product?.imagePath ?? null,
    imageAlt: product?.imageAlt ?? null,
    imagePositionX: String(product?.imagePositionX ?? 50),
    imagePositionY: String(product?.imagePositionY ?? 50),
  };
}

function publicImageUrl(path: string | null): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || !path || !uuidWebp.test(path)) return null;
  return `${baseUrl}/storage/v1/object/public/catalog-images/${path}`;
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => initialDraft(product));
  const [candidate, setCandidate] = useState<CandidateImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const candidatePath = candidate?.path ?? draft.imagePath;
  const imageUrl = publicImageUrl(candidatePath);
  const savedImageUrl = publicImageUrl(product?.imagePath ?? null);
  const canActivate = draft.availability !== "unconfirmed" && Boolean(candidatePath) && Boolean(draft.imageAlt?.trim());

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  async function uploadSelectedImage() {
    if (!selectedFile) return setMessage("Pilih foto sebelum mengunggah.");
    if (selectedFile.size <= 0 || selectedFile.size > maxImageUploadBytes) return setMessage("Ukuran foto harus lebih dari 0 dan maksimal 3 MiB.");
    setIsUploading(true);
    setMessage("");
    try {
      const data = new FormData();
      data.set("file", selectedFile);
      const response = await fetch("/api/admin/images", { method: "POST", body: data });
      const result = await response.json() as CandidateImage & { error?: string };
      if (!response.ok || !uuidWebp.test(result.path ?? "") || !Number.isSafeInteger(result.width) || !Number.isSafeInteger(result.height)) {
        setMessage(result.error ?? "Foto belum berhasil diunggah.");
        return;
      }
      setCandidate({ path: result.path, width: result.width, height: result.height });
      setDraft((current) => ({ ...current, imageAlt: current.imageAlt ?? "" }));
      setFieldErrors((current) => { const next = { ...current }; delete next.imagePath; return next; });
      setMessage("Foto kandidat tersimpan. Simpan produk agar foto ini tampil di katalog.");
    } catch {
      setMessage("Koneksi terputus saat mengunggah. Foto lama tetap aman; pilih ulang foto untuk mencoba lagi.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const input: ProductInput = {
      name: draft.name,
      category: draft.category,
      description: draft.description,
      priceRupiah: draft.priceRupiah.trim() ? Number(draft.priceRupiah) : Number.NaN,
      packageLabel: draft.packageLabel,
      quantityUnit: draft.quantityUnit,
      availability: draft.availability,
      preorderLeadDays: draft.preorderLeadDays === "" ? null : Number(draft.preorderLeadDays),
      isActive: draft.isActive && canActivate,
      isFeatured: draft.isFeatured,
      sortOrder: draft.sortOrder.trim() ? Number(draft.sortOrder) : Number.NaN,
      imagePath: candidate?.path ?? draft.imagePath,
      imageAlt: draft.imageAlt,
      imagePositionX: draft.imagePositionX.trim() ? Number(draft.imagePositionX) : Number.NaN,
      imagePositionY: draft.imagePositionY.trim() ? Number(draft.imagePositionY) : Number.NaN,
    };
    startTransition(async () => {
      const result = await saveProduct(product?.id ?? null, input);
      if (!result.ok) {
        setMessage(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.replace(`/admin/produk/${result.data.id}`);
      router.refresh();
    });
  }

  const errorFor = (name: keyof ProductInput) => fieldErrors[name] ? <span className="admin-field-error" id={`${name}-error`}>{fieldErrors[name]}</span> : null;
  const describedBy = (name: keyof ProductInput) => fieldErrors[name] ? `${name}-error` : undefined;

  return (
    <form className="admin-product-form" onSubmit={handleSubmit} noValidate>
      {message && <p className="admin-form-message" role="status" aria-live="polite">{message}</p>}
      {Object.keys(fieldErrors).length > 0 && <p className="admin-form-message" role="alert">Ada data yang perlu diperbaiki sebelum produk disimpan.</p>}
      <section className="admin-form-section" aria-labelledby="product-info-title">
        <h2 id="product-info-title">Informasi produk</h2>
        <div className="admin-form-grid">
          <label>Nama produk<input required maxLength={120} value={draft.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={describedBy("name")} />{errorFor("name")}</label>
          <label>Kategori<select value={draft.category} onChange={(event) => update("category", event.target.value as Category)} aria-invalid={Boolean(fieldErrors.category)} aria-describedby={describedBy("category")}>{categories.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}</select>{errorFor("category")}</label>
          {product && <label className="admin-full-width">Slug · hanya-baca<input readOnly value={product.slug} /></label>}
          {!product && <p className="admin-full-width admin-muted">Slug dibuat dari nama ketika produk pertama kali disimpan dan tidak berubah setelahnya.</p>}
          <label className="admin-full-width">Deskripsi<textarea rows={4} maxLength={1200} value={draft.description} onChange={(event) => update("description", event.target.value)} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={describedBy("description")} />{errorFor("description")}</label>
          <label>Harga (rupiah)<input required type="number" min="1" step="1" value={draft.priceRupiah} onChange={(event) => update("priceRupiah", event.target.value)} aria-invalid={Boolean(fieldErrors.priceRupiah)} aria-describedby={describedBy("priceRupiah")} />{errorFor("priceRupiah")}</label>
          <label>Unit jual<input maxLength={40} value={draft.quantityUnit ?? ""} onChange={(event) => update("quantityUnit", event.target.value || null)} aria-invalid={Boolean(fieldErrors.quantityUnit)} aria-describedby={describedBy("quantityUnit")} />{errorFor("quantityUnit")}</label>
          <label>Isi kemasan<input maxLength={80} value={draft.packageLabel ?? ""} onChange={(event) => update("packageLabel", event.target.value || null)} aria-invalid={Boolean(fieldErrors.packageLabel)} aria-describedby={describedBy("packageLabel")} />{errorFor("packageLabel")}</label>
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="product-status-title">
        <h2 id="product-status-title">Status katalog</h2>
        <div className="admin-form-grid">
          <label>Status ketersediaan<select value={draft.availability} onChange={(event) => update("availability", event.target.value as Availability)} aria-invalid={Boolean(fieldErrors.availability)} aria-describedby={describedBy("availability")}>{availabilityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>{errorFor("availability")}</label>
          <label>Tenggat pre-order (hari)<input type="number" min="0" step="1" placeholder="Belum ditetapkan" value={draft.preorderLeadDays} onChange={(event) => update("preorderLeadDays", event.target.value)} aria-invalid={Boolean(fieldErrors.preorderLeadDays)} aria-describedby={describedBy("preorderLeadDays")} />{errorFor("preorderLeadDays")}</label>
          <label>Urutan tampil<input type="number" min="0" step="1" value={draft.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} aria-invalid={Boolean(fieldErrors.sortOrder)} aria-describedby={describedBy("sortOrder")} />{errorFor("sortOrder")}</label>
          <div className="admin-checks">
            <label><input type="checkbox" checked={draft.isActive} disabled={!canActivate} onChange={(event) => update("isActive", event.target.checked)} /> Tampilkan di katalog publik</label>
            <label><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /> Pilihan menu</label>
            {!canActivate && <p className="admin-muted">Untuk mengaktifkan produk, pilih status yang sudah dikonfirmasi dan lengkapi foto serta teks alternatif.</p>}
          </div>
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="product-image-title">
        <h2 id="product-image-title">Foto dan crop</h2>
        <p className="admin-muted">JPEG, PNG, atau WebP · maksimal 3 MiB dan 20 MP. Foto baru baru menggantikan foto lama setelah produk berhasil disimpan.</p>
        <label>Foto produk<input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { setSelectedFile(event.target.files?.[0] ?? null); setMessage(""); }} /></label>
        <div className="admin-upload-row"><button className="auth-button" type="button" disabled={!selectedFile || isUploading || isPending} onClick={uploadSelectedImage}>{isUploading ? "Mengunggah…" : "Unggah foto kandidat"}</button>{selectedFile && <span>Foto dipilih · {(selectedFile.size / 1024).toFixed(0)} KiB</span>}</div>
        {product?.imagePath && <div className="admin-image-block"><p>Foto tersimpan saat ini</p>{savedImageUrl ? <Image className="admin-image-preview" src={savedImageUrl} alt={product.imageAlt ?? "Foto produk tersimpan"} width={product.imageWidth ?? 800} height={product.imageHeight ?? 600} sizes="(max-width: 600px) 100vw, 520px" style={{ objectPosition: `${draft.imagePositionX}% ${draft.imagePositionY}%` }} /> : <p>Referensi foto lama tidak dapat dipratinjau; foto tidak dihapus.</p>}</div>}
        {candidate && <div className="admin-image-block"><p>Foto kandidat · {candidate.width} × {candidate.height} px · belum tampil di katalog</p>{imageUrl && <Image className="admin-image-preview" src={imageUrl} alt="Pratinjau foto kandidat" width={candidate.width} height={candidate.height} sizes="(max-width: 600px) 100vw, 520px" style={{ objectPosition: `${draft.imagePositionX}% ${draft.imagePositionY}%` }} />}</div>}
        <div className="admin-form-grid admin-crop-grid">
          <label>Teks alternatif foto<input maxLength={180} value={draft.imageAlt ?? ""} onChange={(event) => update("imageAlt", event.target.value || null)} aria-invalid={Boolean(fieldErrors.imageAlt)} aria-describedby={describedBy("imageAlt")} />{errorFor("imageAlt")}</label>
          <label>Crop horizontal (0–100)<input type="number" min="0" max="100" step="1" value={draft.imagePositionX} onChange={(event) => update("imagePositionX", event.target.value)} aria-invalid={Boolean(fieldErrors.imagePositionX)} aria-describedby={describedBy("imagePositionX")} />{errorFor("imagePositionX")}</label>
          <label>Crop vertikal (0–100)<input type="number" min="0" max="100" step="1" value={draft.imagePositionY} onChange={(event) => update("imagePositionY", event.target.value)} aria-invalid={Boolean(fieldErrors.imagePositionY)} aria-describedby={describedBy("imagePositionY")} />{errorFor("imagePositionY")}</label>
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="product-preview-title">
        <h2 id="product-preview-title">Pratinjau ringkas</h2>
        <div className="admin-preview">
          {imageUrl ? <Image src={imageUrl} alt="" width={480} height={320} sizes="160px" /> : <div className="admin-preview-no-image">Foto belum tersedia</div>}
          <div><strong>{draft.name || "Nama produk"}</strong><p>{categories.find((item) => item.value === draft.category)?.label} · {draft.packageLabel || "Isi kemasan belum ditetapkan"}</p><p>{draft.priceRupiah ? `Rp${Number(draft.priceRupiah).toLocaleString("id-ID")}` : "Harga belum diisi"}</p><span className={`admin-status${draft.isActive ? " is-active" : ""}`}>{draft.isActive ? "Aktif" : "Nonaktif"}</span></div>
        </div>
      </section>

      <div className="admin-form-actions"><button className="auth-button" type="submit" disabled={isPending || isUploading}>{isPending ? "Menyimpan…" : "Simpan produk"}</button><Link className="text-button" href="/admin/produk">Batal</Link></div>
    </form>
  );
}
