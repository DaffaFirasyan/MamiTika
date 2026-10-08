"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { buildSnackMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { todayInJakarta } from "@/lib/dates";
import { validateSnackInquiry } from "@/lib/validation";
import type { ActionResult, SiteSettings, SnackInquiry } from "@/lib/types";

export function SnackInquiryForm({ settings, today }: { settings: SiteSettings; today: string }) {
  const [result, setResult] = useState<ActionResult<SnackInquiry> | null>(null);
  const [preview, setPreview] = useState<{ message: string; url: string | null } | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (result && !result.ok) errorRef.current?.focus();
  }, [result]);

  function reviewInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const optionalNumber = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" && value !== "" ? Number(value) : undefined;
    };
    const validation = validateSnackInquiry({
      eventType: form.get("eventType"),
      eventDate: form.get("eventDate"),
      boxes: optionalNumber("boxes"),
      contents: form.get("contents"),
      budgetPerBox: optionalNumber("budgetPerBox"),
      area: form.get("area"),
      note: form.get("note"),
    }, settings, todayInJakarta());
    setResult(validation);
    setCopyStatus("");
    if (!validation.ok) {
      setPreview(null);
      return;
    }
    const message = buildSnackMessage(validation.data);
    setPreview({ message, url: buildWhatsAppUrl(settings.whatsappNumber, message) });
  }

  async function copyMessage() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview.message);
      setCopyStatus("Pesan berhasil disalin.");
    } catch {
      setCopyStatus("Salin pesan secara manual dari kolom berikut.");
      requestAnimationFrame(() => manualCopyRef.current?.focus());
    }
  }

  const errors = result && !result.ok ? result.fieldErrors ?? {} : {};
  const fieldError = (name: string) => errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null;
  const describedBy = (name: string, hint?: string) => [hint, errors[name] ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="snack-inquiry">
      {result && !result.ok && (
        <div className="snack-validation-error" role="alert" ref={errorRef} tabIndex={-1}>
          <p>{result.message}</p>
          <ul>{Object.entries(errors).map(([name, message]) => <li key={name}><a href={`#${name}`}>{message}</a></li>)}</ul>
        </div>
      )}
      <form className="snack-form" method="post" noValidate onSubmit={reviewInquiry} onChange={() => { setResult(null); setPreview(null); setCopyStatus(""); }}>
        <div className="cart-field">
          <label htmlFor="eventType">Jenis acara <span>(opsional)</span></label>
          <input id="eventType" name="eventType" type="text" maxLength={120} aria-invalid={Boolean(errors.eventType)} aria-describedby={describedBy("eventType")} />
          {fieldError("eventType")}
        </div>
        <div className="cart-field">
          <label htmlFor="eventDate">Tanggal acara <span>(wajib)</span></label>
          <input id="eventDate" name="eventDate" type="date" min={today} required aria-invalid={Boolean(errors.eventDate)} aria-describedby={describedBy("eventDate")} />
          {fieldError("eventDate")}
        </div>
        <div className="cart-field">
          <label htmlFor="boxes">Perkiraan jumlah box <span>(wajib)</span></label>
          <input id="boxes" name="boxes" type="number" min={settings.snackMinBoxes ?? 1} step={1} inputMode="numeric" required aria-invalid={Boolean(errors.boxes)} aria-describedby={describedBy("boxes")} />
          {fieldError("boxes")}
        </div>
        <div className="cart-field">
          <label htmlFor="contents">Preferensi isi <span>(opsional)</span></label>
          <textarea id="contents" name="contents" rows={3} maxLength={500} aria-invalid={Boolean(errors.contents)} aria-describedby={describedBy("contents")} />
          {fieldError("contents")}
        </div>
        <div className="cart-field">
          <label htmlFor="budgetPerBox">Anggaran per box dalam rupiah <span>(opsional)</span></label>
          <input id="budgetPerBox" name="budgetPerBox" type="number" min={1} step={1} inputMode="numeric" aria-invalid={Boolean(errors.budgetPerBox)} aria-describedby={describedBy("budgetPerBox")} />
          {fieldError("budgetPerBox")}
        </div>
        <div className="cart-field">
          <label htmlFor="area">Area atau kecamatan <span>(opsional)</span></label>
          <input id="area" name="area" type="text" maxLength={120} aria-invalid={Boolean(errors.area)} aria-describedby={describedBy("area")} />
          {fieldError("area")}
        </div>
        <div className="cart-field">
          <label htmlFor="note">Catatan <span>(opsional)</span></label>
          <textarea id="note" name="note" rows={4} maxLength={500} aria-invalid={Boolean(errors.note)} aria-describedby={describedBy("note")} />
          {fieldError("note")}
        </div>
        <button className="button snack-review-button" type="submit">Tinjau permintaan</button>
      </form>

      {preview && (
        <section className="snack-message-preview" aria-labelledby="snack-preview-heading">
          <h2 id="snack-preview-heading">Pratinjau permintaan</h2>
          <p>Periksa pesan berikut. Permintaan belum dikirim dan detail akhir perlu dikonfirmasi oleh Mamitika.</p>
          <label className="visually-hidden" htmlFor="snack-message">Isi pesan WhatsApp</label>
          <textarea id="snack-message" readOnly value={preview.message} rows={10} />
          <div className="snack-message-actions">
            {preview.url ? <a className="button" href={preview.url} target="_blank" rel="noreferrer">Lanjut ke WhatsApp</a> : <a className="button" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer">Buka chat WhatsApp</a>}
            <button className="button button-secondary" type="button" onClick={copyMessage}>Salin pesan</button>
          </div>
          {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
          {copyStatus.startsWith("Salin pesan secara manual") && <textarea ref={manualCopyRef} readOnly value={preview.message} rows={10} aria-label="Pesan untuk disalin secara manual" onFocus={(event) => event.currentTarget.select()} />}
        </section>
      )}
    </div>
  );
}
