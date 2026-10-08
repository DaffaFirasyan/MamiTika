"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { QuantityInput } from "@/components/quantity-input";
import { formatRupiah, reconcileCart } from "@/lib/cart";
import { todayInJakarta } from "@/lib/dates";
import { validateOrderPreferences } from "@/lib/validation";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { CartReview, OrderPreferences, PublicProduct, SiteSettings } from "@/lib/types";

type Catalog = { products: PublicProduct[]; settings: SiteSettings };
type CatalogResult = { catalog: Catalog; priceChanges: { name: string; price: number | null }[] };
type Preview = { message: string; url: string | null; chatUrl: string };

function outsideServiceHours(settings: SiteSettings) {
  const current = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  return current < settings.openingTime.slice(0, 5) || current >= settings.closingTime.slice(0, 5);
}

export function CartPageContent() {
  const { items, hydrated, setQuantity, remove, previousPrice } = useCart();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priceChanges, setPriceChanges] = useState<{ name: string; price: number | null }[]>([]);
  const [preferences, setPreferences] = useState<OrderPreferences>({ fulfillment: "undecided" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [invalidQuantities, setInvalidQuantities] = useState<string[]>([]);
  const [formMessage, setFormMessage] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [copyFallback, setCopyFallback] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const review: CartReview | null = useMemo(() => {
    if (!catalog) return null;
    try {
      return reconcileCart(items, catalog.products, todayInJakarta());
    } catch {
      return null;
    }
  }, [catalog, items]);

  const fetchCatalog = useCallback(async (): Promise<CatalogResult> => {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) throw new Error("catalog unavailable");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !Array.isArray((result as Catalog).products) || !(result as Catalog).settings) throw new Error("invalid catalog response");
    const latest = result as Catalog;
    const changes = latest.products.flatMap((product) => {
      const oldPrice = previousPrice(product.id);
      return oldPrice !== undefined && oldPrice !== product.priceRupiah ? [{ name: product.name, price: product.priceRupiah }] : [];
    });
    return { catalog: latest, priceChanges: changes };
  }, [previousPrice]);

  useEffect(() => {
    if (hydrated && items.length > 0 && !catalog && !catalogError && !loading) {
      void fetchCatalog().then(({ catalog: latest, priceChanges: changes }) => {
        setPriceChanges(changes);
        setCatalog(latest);
      }).catch(() => setCatalogError(true));
    }
  }, [hydrated, items.length, catalog, catalogError, loading, fetchCatalog]);

  function changePreference<K extends keyof OrderPreferences>(key: K, value: OrderPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setFieldErrors({});
    setFormMessage("");
    setPreview(null);
  }

  async function reviewOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || invalidQuantities.length > 0) return;
    setFormMessage("");
    setFieldErrors({});
    setLoading(true);
    setCatalog(null);
    setCatalogError(false);
    setPreview(null);
    setCopyNotice("");
    let catalogResult: CatalogResult;
    try {
      catalogResult = await fetchCatalog();
    } catch {
      setCatalogError(true);
      setLoading(false);
      return;
    }
    setLoading(false);
    const { catalog: latest, priceChanges: changes } = catalogResult;
    setCatalog(latest);
    setPriceChanges(changes);
    let freshReview: CartReview;
    try {
      freshReview = reconcileCart(items, latest.products, todayInJakarta());
    } catch {
      setFormMessage("Harga katalog belum dapat dihitung dengan aman. Silakan coba lagi.");
      return;
    }
    if (freshReview.blockedItems.length || freshReview.lines.length === 0) {
      setFormMessage("Hapus produk yang tidak tersedia sebelum membuat pratinjau pesan.");
      return;
    }
    const validationResult = validateOrderPreferences(preferences, freshReview, latest.settings, todayInJakarta());
    if (!validationResult.ok) {
      setFieldErrors(validationResult.fieldErrors ?? {});
      setFormMessage(validationResult.message);
      const firstField = Object.keys(validationResult.fieldErrors ?? {})[0];
      if (firstField) document.getElementById(firstField === "fulfillment" ? "order-fulfillment-delivery" : `order-${firstField}`)?.focus();
      return;
    }
    const message = buildOrderMessage(freshReview, validationResult.data);
    setPreview({
      message,
      url: buildWhatsAppUrl(latest.settings.whatsappNumber, message),
      chatUrl: `https://wa.me/${latest.settings.whatsappNumber}`,
    });
    setFormMessage("Pratinjau memakai katalog terbaru. Mohon tinjau sebelum membuka WhatsApp.");
  }

  function retryCatalog() {
    setLoading(true);
    setCatalog(null);
    setCatalogError(false);
    setPreview(null);
    setCopyNotice("");
    void fetchCatalog().then(({ catalog: latest, priceChanges: changes }) => {
      setCatalog(latest);
      setPriceChanges(changes);
    }).catch(() => setCatalogError(true)).finally(() => setLoading(false));
  }

  async function copyMessage() {
    if (!preview) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(preview.message);
      setCopyFallback(false);
      setCopyNotice("Ringkasan disalin. Anda tetap perlu menekan Kirim di WhatsApp.");
    } catch {
      setCopyFallback(true);
      setCopyNotice("Salin otomatis tidak tersedia. Pilih teks ringkasan berikut lalu salin secara manual.");
      requestAnimationFrame(() => {
        messageRef.current?.focus();
        messageRef.current?.select();
      });
    }
  }

  if (!hydrated) return <div className="container cart-page"><p role="status">Memulihkan keranjang…</p></div>;

  if (items.length === 0) {
    return (
      <section className="container cart-page">
        <p className="eyebrow">Pilihan Anda</p>
        <h1>Keranjang</h1>
        <div className="cart-empty"><h2>Keranjang Anda masih kosong.</h2><Link className="button" href="/menu">Kembali ke menu</Link></div>
      </section>
    );
  }

  const products = new Map(catalog?.products.map((product) => [product.id, product]) ?? []);
  const today = todayInJakarta();
  const blocked = review?.blockedItems ?? [];

  return (
    <section className="container cart-page">
      <header className="page-intro">
        <p className="eyebrow">Pilihan Anda</p>
        <h1>Keranjang</h1>
        <p>Harga mengikuti menu terbaru. Subtotal produk belum termasuk ongkir atau biaya tambahan.</p>
      </header>

      <div className="cart-layout">
        <div className="cart-items" aria-label="Produk di keranjang">
          {(loading || (hydrated && !catalog && !catalogError)) && <p role="status">Memuat menu terbaru…</p>}
          {catalogError && (
            <div className="cart-error" role="alert">
              <h2>Menu belum dapat dimuat.</h2>
              <p>Keranjang Anda tetap tersimpan. Harga lama tidak ditampilkan sebagai subtotal yang berlaku.</p>
              <button className="button button-secondary" type="button" onClick={retryCatalog}>Coba lagi</button>
              <Link className="text-link" href="/kontak">Hubungi Mamitika</Link>
            </div>
          )}
          {!loading && catalog && !review && <div className="cart-error" role="alert"><p>Harga katalog belum dapat dihitung dengan aman.</p><button className="button button-secondary" type="button" onClick={retryCatalog}>Coba lagi</button></div>}
          {review?.lines.map(({ product, quantity, lineTotalRupiah }) => (
            <article className="cart-line" key={product.id}>
              {product.imagePath && product.imageAlt ? (
                <Image className="cart-line-image" src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalog-images/${product.imagePath}`} alt={product.imageAlt} width={product.imageWidth ?? 88} height={product.imageHeight ?? 66} sizes="88px" />
              ) : <div className="cart-line-image photo-placeholder">Foto belum tersedia</div>}
              <div className="cart-line-info">
                <h2>{product.name}</h2>
                {product.packageLabel && <p>{product.packageLabel}</p>}
                <p>{formatRupiah(product.priceRupiah as number)} / {product.quantityUnit ?? "unit"}</p>
                <p className={`product-status product-status-${product.availability}`}>{product.availability === "unconfirmed" ? "Konfirmasi ketersediaan" : product.availability === "preorder" ? "Pre-order · jadwal dikonfirmasi" : "Ready stock · konfirmasi akhir"}</p>
                <div className="cart-line-controls">
                  <QuantityInput value={quantity} label={product.name} onChange={(value) => { setQuantity(product.id, value); setPreview(null); }} onInvalidChange={(invalid) => {
                    setPreview(null);
                    setInvalidQuantities((current) => invalid ? [...new Set([...current, product.id])] : current.filter((id) => id !== product.id));
                  }} />
                  <strong>{formatRupiah(lineTotalRupiah)}</strong>
                  <button className="text-button" type="button" onClick={() => { remove(product.id); setPreview(null); setInvalidQuantities((current) => current.filter((id) => id !== product.id)); }}>Hapus</button>
                </div>
              </div>
            </article>
          ))}
          {blocked.map(({ productId, reason }) => (
            <article className="cart-line cart-line-blocked" key={productId}>
              <div className="cart-line-image photo-placeholder">Tidak ditawarkan</div>
              <div className="cart-line-info">
                <h2>{products.get(productId)?.name ?? "Produk tidak lagi ada di menu"}</h2>
                <p>{reason === "missing" ? "Produk tidak ditemukan pada katalog terbaru." : "Produk sedang tidak tersedia dan dikecualikan dari ringkasan."}</p>
                <button className="text-button" type="button" onClick={() => { remove(productId); setPreview(null); setInvalidQuantities((current) => current.filter((id) => id !== productId)); }}>Hapus dari keranjang</button>
              </div>
            </article>
          ))}
          <Link className="text-link cart-continue" href="/menu">Lanjut belanja</Link>
        </div>

        <aside className="cart-summary" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">Ringkasan</h2>
          <form onSubmit={reviewOrder} noValidate>
            <fieldset className="fulfillment-options">
              <legend>Metode pemenuhan</legend>
              {([ ["delivery", "Pengiriman"], ["pickup", "Ambil sendiri"], ["undecided", "Belum ditentukan"] ] as const).map(([value, label]) => (
                <label key={value}><input id={`order-fulfillment-${value}`} type="radio" name="fulfillment" value={value} checked={preferences.fulfillment === value} aria-describedby={fieldErrors.fulfillment ? "order-fulfillment-error" : undefined} onChange={() => changePreference("fulfillment", value)} /> {label}</label>
              ))}
              {fieldErrors.fulfillment && <span id="order-fulfillment-error" className="field-error">{fieldErrors.fulfillment}</span>}
            </fieldset>

            {preferences.fulfillment === "delivery" && <div className="cart-field">
              <label htmlFor="order-area">Lokasi ringkas (opsional)</label>
              <input id="order-area" maxLength={120} value={preferences.area ?? ""} aria-describedby={fieldErrors.area ? "order-area-error" : undefined} onChange={(event) => changePreference("area", event.currentTarget.value)} />
              {fieldErrors.area && <span id="order-area-error" className="field-error">{fieldErrors.area}</span>}
            </div>}

            {review?.requiresPreorderDate && <div className="cart-field">
              <label htmlFor="order-requestedDate">Tanggal yang diinginkan <span>(wajib untuk pre-order)</span></label>
              <input id="order-requestedDate" type="date" min={review.minimumRequestedDate ?? today} required value={preferences.requestedDate ?? ""} aria-describedby={fieldErrors.requestedDate ? "order-date-error" : undefined} onChange={(event) => changePreference("requestedDate", event.currentTarget.value)} />
              {review.minimumRequestedDate && <small>Pilih {review.minimumRequestedDate} atau setelahnya; jadwal tetap perlu dikonfirmasi.</small>}
              {fieldErrors.requestedDate && <span id="order-date-error" className="field-error">{fieldErrors.requestedDate}</span>}
            </div>}

            <div className="cart-field">
              <label htmlFor="order-note">Catatan (opsional)</label>
              <textarea id="order-note" maxLength={500} rows={4} value={preferences.note ?? ""} aria-describedby={fieldErrors.note ? "order-note-error" : "order-note-count"} onChange={(event) => changePreference("note", event.currentTarget.value)} />
              <small id="order-note-count">{(preferences.note ?? "").length}/500 karakter</small>
              {fieldErrors.note && <span id="order-note-error" className="field-error">{fieldErrors.note}</span>}
            </div>

            <div className="cart-subtotal">
              <span>Subtotal produk</span>
              <strong>{review ? formatRupiah(review.subtotalRupiah) : "—"}</strong>
            </div>
            <p className="cart-hint">Ongkir, ketersediaan, dan total akhir dikonfirmasi melalui WhatsApp.</p>
            {catalog && <p className="cart-hours">Jam layanan {catalog.settings.openingTime.slice(0, 5)}–{catalog.settings.closingTime.slice(0, 5)} WIB{outsideServiceHours(catalog.settings) ? ". Tanggapan mengikuti jam layanan." : "."}</p>}
            {priceChanges.length > 0 && <div className="price-change-notice" role="status"><strong>Harga berubah sejak menu dilihat:</strong><ul>{priceChanges.map((change) => <li key={change.name}>{change.name}: {change.price === null ? "harga dikonfirmasi langsung" : formatRupiah(change.price)}</li>)}</ul>Silakan tinjau harga terbaru sebelum melanjutkan.</div>}
            {blocked.length > 0 && <p className="field-error" role="alert">Hapus item yang tidak tersedia agar dapat membuat pratinjau.</p>}
            {formMessage && <p className="cart-hint" role="status">{formMessage}</p>}
            <button className="button cart-review-button" type="submit" disabled={loading || !!catalogError || !catalog || !review || blocked.length > 0 || review.lines.length === 0 || invalidQuantities.length > 0}>
              {loading ? "Memeriksa menu…" : "Tinjau ringkasan"}
            </button>
          </form>

          {preview && <section className="cart-message-preview" aria-labelledby="cart-preview-title">
            <h3 id="cart-preview-title">Pratinjau pesan</h3>
            <p>Pesan ini meminta konfirmasi akhir. Pesan tidak dikirim sampai Anda menekan Kirim di WhatsApp.</p>
            <textarea ref={messageRef} aria-label="Isi pratinjau pesan WhatsApp" readOnly rows={14} value={preview.message} />
            <div className="cart-message-actions">
              {preview.url ? <a className="button" href={preview.url} target="_blank" rel="noreferrer">Lanjut ke WhatsApp</a> : <>
                <p className="cart-hint">Pesan tidak dapat dimuat otomatis. Salin ringkasan, buka chat, lalu tempel dan tinjau sebelum mengirim.</p>
                <a className="button" href={preview.chatUrl} target="_blank" rel="noreferrer">Buka chat tanpa pesan</a>
              </>}
              <button className="button button-secondary" type="button" onClick={() => void copyMessage()}>Salin ringkasan</button>
            </div>
            {copyNotice && <p role="status">{copyNotice}</p>}
            {copyFallback && <p>Pilih teks di atas lalu tekan Ctrl+C (Windows) atau ⌘C (Mac).</p>}
          </section>}
        </aside>
      </div>
    </section>
  );
}
