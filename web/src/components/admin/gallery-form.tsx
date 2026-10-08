"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { saveGalleryItem } from "@/app/admin/actions";
import type { AdminGalleryItem, GalleryInput } from "@/lib/types";

const maxUploadBytes = 3 * 1024 * 1024;
const uuidWebp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;
type Candidate = { path: string; width: number; height: number };
type Draft = Omit<GalleryInput, "sortOrder"> & { sortOrder: string };

function imageUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base && path && uuidWebp.test(path) ? `${base}/storage/v1/object/public/catalog-images/${path}` : null;
}

function initialDraft(item?: AdminGalleryItem): Draft {
  return {
    imagePath: item?.imagePath ?? "",
    imageAlt: item?.imageAlt ?? "",
    caption: item?.caption ?? null,
    sortOrder: String(item?.sortOrder ?? 0),
    isActive: item?.isActive ?? false,
  };
}

export function GalleryForm({ item }: { item?: AdminGalleryItem }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => initialDraft(item));
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const path = candidate?.path ?? draft.imagePath;
  const preview = imageUrl(path);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  async function upload() {
    if (!selectedFile) return setMessage("Pilih foto sebelum mengunggah.");
    if (selectedFile.size <= 0 || selectedFile.size > maxUploadBytes) return setMessage("Ukuran foto harus lebih dari 0 dan maksimal 3 MiB.");
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", selectedFile);
      const response = await fetch("/api/admin/images", { method: "POST", body: form });
      const result = await response.json() as Candidate & { error?: string };
      if (!response.ok || !uuidWebp.test(result.path ?? "") || !Number.isSafeInteger(result.width) || !Number.isSafeInteger(result.height)) {
        setMessage(result.error ?? "Foto belum berhasil diunggah.");
        return;
      }
      setCandidate(result);
      update("imagePath", result.path);
      setMessage("Foto kandidat siap. Simpan perubahan agar foto galeri diperbarui.");
    } catch {
      setMessage("Koneksi terputus saat mengunggah. Foto tersimpan tetap aman; pilih ulang foto untuk mencoba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const input: GalleryInput = {
      imagePath: path,
      imageAlt: draft.imageAlt,
      caption: draft.caption,
      sortOrder: draft.sortOrder.trim() ? Number(draft.sortOrder) : Number.NaN,
      isActive: draft.isActive && Boolean(path && draft.imageAlt.trim()),
    };
    startTransition(async () => {
      const result = await saveGalleryItem(item?.id ?? null, input);
      if (!result.ok) {
        setMessage(result.message);
        setErrors(result.fieldErrors ?? {});
        return;
      }
      setCandidate(null);
      setSelectedFile(null);
      if (!item) setDraft(initialDraft());
      setMessage("Foto galeri tersimpan.");
      router.refresh();
    });
  }

  const fieldError = (name: string) => errors[name] ? <span className="admin-field-error" id={`gallery-${item?.id ?? "new"}-${name}-error`}>{errors[name]}</span> : null;
  const desc = (name: string) => errors[name] ? `gallery-${item?.id ?? "new"}-${name}-error` : undefined;
  const titleId = `gallery-${item?.id ?? "new"}-title`;
  const savedPreview = imageUrl(item?.imagePath ?? null);

  return (
    <form className="admin-product-form admin-gallery-form" onSubmit={submit} noValidate aria-labelledby={titleId}>
      <section className="admin-form-section">
        <div className="admin-title-row"><h2 id={titleId}>{item ? item.isActive ? "Foto aktif" : "Foto nonaktif" : "Tambah foto"}</h2>{item && <span className={`admin-status${item.isActive ? " is-active" : ""}`}>{item.isActive ? "Aktif" : "Nonaktif"}</span>}</div>
        {message && <p className="admin-form-message" role="status" aria-live="polite">{message}</p>}
        <div className="admin-form-grid">
          <label className="admin-full-width">Foto galeri<input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { setSelectedFile(event.target.files?.[0] ?? null); setMessage(""); }} />{fieldError("imagePath")}</label>
          <div className="admin-full-width admin-upload-row"><button className="auth-button" type="button" disabled={!selectedFile || uploading || pending} onClick={upload}>{uploading ? "Mengunggah…" : "Unggah foto kandidat"}</button>{selectedFile && <span>Foto dipilih · {(selectedFile.size / 1024).toFixed(0)} KiB</span>}<span>JPEG, PNG, atau WebP · maksimal 3 MiB. Foto lama dipertahankan sampai penyimpanan berhasil.</span></div>
          <label className="admin-full-width">Teks alternatif<input required maxLength={180} value={draft.imageAlt} onChange={(event) => update("imageAlt", event.target.value)} aria-invalid={Boolean(errors.imageAlt)} aria-describedby={desc("imageAlt")} />{fieldError("imageAlt")}</label>
          <label className="admin-full-width">Caption <span className="admin-muted">(opsional)</span><textarea rows={3} maxLength={240} value={draft.caption ?? ""} onChange={(event) => update("caption", event.target.value || null)} aria-invalid={Boolean(errors.caption)} aria-describedby={desc("caption")} />{fieldError("caption")}</label>
          <label>Urutan tampil<input type="number" min="0" step="1" value={draft.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} aria-invalid={Boolean(errors.sortOrder)} aria-describedby={desc("sortOrder")} />{fieldError("sortOrder")}</label>
          <label className="admin-switch"><input type="checkbox" checked={draft.isActive} disabled={!path || !draft.imageAlt.trim()} onChange={(event) => update("isActive", event.target.checked)} /> Tampilkan di galeri publik</label>
        </div>
        <div className="admin-gallery-previews">
          {item && <div><h3>Foto tersimpan</h3>{savedPreview ? <Image src={savedPreview} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} sizes="(max-width: 700px) 100vw, 420px" /> : <p>Pratinjau foto tersimpan tidak tersedia.</p>}<p>{item.caption || "Tanpa caption"} · {item.isActive ? "Ditampilkan publik" : "Tidak ditampilkan publik"}</p></div>}
          <div><h3>{candidate ? "Pratinjau kandidat" : item ? "Pratinjau perubahan" : "Pratinjau"}</h3>{preview ? <Image src={preview} alt={draft.imageAlt || "Pratinjau foto galeri"} width={candidate?.width ?? item?.imageWidth ?? 800} height={candidate?.height ?? item?.imageHeight ?? 600} sizes="(max-width: 700px) 100vw, 420px" /> : <div className="admin-preview-no-image">Unggah foto untuk menampilkan pratinjau</div>}<p>{draft.caption || "Caption belum diisi"} · {draft.isActive ? "Akan ditampilkan publik setelah disimpan" : "Nonaktif"}</p></div>
        </div>
        <div className="admin-form-actions"><button className="auth-button" type="submit" disabled={pending || uploading}>{pending ? "Menyimpan…" : "Simpan galeri"}</button></div>
      </section>
    </form>
  );
}
