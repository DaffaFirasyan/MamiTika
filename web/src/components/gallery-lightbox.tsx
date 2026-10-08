"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PublicGalleryItem } from "@/lib/types";

type GalleryState = { status: "loading" } | { status: "error" } | { status: "ready"; items: PublicGalleryItem[] };

function imageUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/catalog-images/${path}` : "";
}

async function requestGallery(): Promise<GalleryState> {
  try {
    const response = await fetch("/api/gallery", { cache: "no-store" });
    if (!response.ok) throw new Error("gallery-unavailable");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) throw new Error("gallery-invalid");
    return { status: "ready", items: (data as { items: PublicGalleryItem[] }).items };
  } catch {
    return { status: "error" };
  }
}

export function GalleryLightbox() {
  const [state, setState] = useState<GalleryState>({ status: "loading" });
  const [selected, setSelected] = useState<PublicGalleryItem | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void requestGallery().then((nextState) => { if (active) setState(nextState); });
    return () => { active = false; };
  }, []);

  async function retryGallery() {
    setState({ status: "loading" });
    setState(await requestGallery());
  }

  function closeLightbox() {
    setSelected(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  if (state.status === "loading") return <p className="gallery-state" role="status">Memuat galeri…</p>;
  if (state.status === "error") return (
    <section className="gallery-state" role="alert">
      <h2>Galeri belum dapat dimuat</h2>
      <p>Periksa koneksi lalu coba lagi. Jika masih bermasalah, silakan hubungi Mamitika.</p>
      <button className="button" type="button" onClick={() => { void retryGallery(); }}>Coba lagi</button>
    </section>
  );
  if (state.items.length === 0) return (
    <section className="gallery-state">
      <h2>Belum ada foto galeri</h2>
      <p>Foto galeri belum tersedia saat ini. Silakan kembali lagi untuk melihat dokumentasi pilihan Mamitika.</p>
      <a className="text-link" href="/kontak">Hubungi Mamitika</a>
    </section>
  );

  return (
    <>
      <div className="full-gallery-grid">
        {state.items.map((item) => (
          <figure key={item.id}>
            <button className="gallery-thumbnail" type="button" aria-label={`Perbesar foto: ${item.caption || item.imageAlt}`} onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(item); }}>
              <Image src={imageUrl(item.imagePath)} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} sizes="(max-width: 760px) 48vw, 33vw" />
            </button>
            {(item.caption || item.imageAlt) && <figcaption>{item.caption || item.imageAlt}</figcaption>}
          </figure>
        ))}
      </div>
      {selected && <GalleryDialog item={selected} onClose={closeLightbox} />}
    </>
  );
}

function GalleryDialog({ item, onClose }: { item: PublicGalleryItem; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog ref={dialogRef} className="gallery-dialog" aria-label={item.caption || item.imageAlt} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <button className="gallery-dialog-close" type="button" onClick={onClose}>Tutup</button>
      <Image src={imageUrl(item.imagePath)} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} sizes="(max-width: 760px) 92vw, 80vw" />
      {item.caption && <p>{item.caption}</p>}
    </dialog>
  );
}
