"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { SettingsInput, SiteSettings } from "@/lib/types";

type NullableTextField = "mapsUrl" | "serviceDaysText" | "deliveryNote" | "pickupNote" | "gofoodUrl" | "shopeefoodUrl" | "snackDescription";
type Draft = Omit<SettingsInput, "snackMinBoxes" | "snackLeadDays" | NullableTextField> & Record<NullableTextField, string> & { snackMinBoxes: string; snackLeadDays: string };

function toDraft(settings: SiteSettings): Draft {
  return {
    whatsappNumber: settings.whatsappNumber,
    instagramUrl: settings.instagramUrl,
    addressText: settings.addressText,
    mapsUrl: settings.mapsUrl ?? "",
    openingTime: settings.openingTime.slice(0, 5),
    closingTime: settings.closingTime.slice(0, 5),
    serviceDaysText: settings.serviceDaysText ?? "",
    deliveryNote: settings.deliveryNote ?? "",
    pickupNote: settings.pickupNote ?? "",
    gofoodUrl: settings.gofoodUrl ?? "",
    shopeefoodUrl: settings.shopeefoodUrl ?? "",
    snackMinBoxes: settings.snackMinBoxes === null ? "" : String(settings.snackMinBoxes),
    snackLeadDays: settings.snackLeadDays === null ? "" : String(settings.snackLeadDays),
    snackDescription: settings.snackDescription ?? "",
  };
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const input: SettingsInput = {
      whatsappNumber: draft.whatsappNumber,
      instagramUrl: draft.instagramUrl,
      addressText: draft.addressText,
      mapsUrl: draft.mapsUrl.trim() || null,
      openingTime: draft.openingTime,
      closingTime: draft.closingTime,
      serviceDaysText: draft.serviceDaysText.trim() || null,
      deliveryNote: draft.deliveryNote.trim() || null,
      pickupNote: draft.pickupNote.trim() || null,
      gofoodUrl: draft.gofoodUrl.trim() || null,
      shopeefoodUrl: draft.shopeefoodUrl.trim() || null,
      snackMinBoxes: draft.snackMinBoxes.trim() ? Number(draft.snackMinBoxes) : null,
      snackLeadDays: draft.snackLeadDays.trim() ? Number(draft.snackLeadDays) : null,
      snackDescription: draft.snackDescription.trim() || null,
    };
    startTransition(async () => {
      const result = await saveSettings(input);
      if (!result.ok) {
        setMessage(result.message);
        setErrors(result.fieldErrors ?? {});
        return;
      }
      setMessage("Pengaturan tersimpan. Halaman publik dimuat ulang dengan data terbaru.");
      router.refresh();
    });
  }

  const errorFor = (key: keyof SettingsInput) => errors[key] ? <span className="admin-field-error" id={`settings-${key}-error`}>{errors[key]}</span> : null;
  const describedBy = (key: keyof SettingsInput) => errors[key] ? `settings-${key}-error` : undefined;

  return (
    <form className="admin-product-form admin-settings-form" onSubmit={submit} noValidate>
      {message && <p className="admin-form-message" role="status" aria-live="polite">{message}</p>}
      {Object.keys(errors).length > 0 && <p className="admin-form-message" role="alert">Periksa kembali kolom yang ditandai.</p>}
      <section className="admin-form-section" aria-labelledby="settings-contact-title">
        <h2 id="settings-contact-title">Kontak</h2>
        <div className="admin-form-grid">
          <label>Nomor WhatsApp<input required inputMode="numeric" autoComplete="tel" maxLength={15} value={draft.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} aria-invalid={Boolean(errors.whatsappNumber)} aria-describedby={describedBy("whatsappNumber")} /><small>Digit internasional tanpa + atau awalan 0.</small>{errorFor("whatsappNumber")}</label>
          <label>Instagram<input required type="url" maxLength={2048} value={draft.instagramUrl} onChange={(event) => update("instagramUrl", event.target.value)} aria-invalid={Boolean(errors.instagramUrl)} aria-describedby={describedBy("instagramUrl")} />{errorFor("instagramUrl")}</label>
          <label className="admin-full-width">Alamat<textarea required rows={2} maxLength={300} value={draft.addressText} onChange={(event) => update("addressText", event.target.value)} aria-invalid={Boolean(errors.addressText)} aria-describedby={describedBy("addressText")} />{errorFor("addressText")}</label>
          <label className="admin-full-width">Tautan peta <span className="admin-muted">(opsional)</span><input type="url" maxLength={2048} value={draft.mapsUrl} onChange={(event) => update("mapsUrl", event.target.value)} aria-invalid={Boolean(errors.mapsUrl)} aria-describedby={describedBy("mapsUrl")} />{errorFor("mapsUrl")}</label>
        </div>
      </section>
      <section className="admin-form-section" aria-labelledby="settings-hours-title">
        <h2 id="settings-hours-title">Jam layanan · WIB</h2>
        <div className="admin-form-grid">
          <label>Jam buka<input required type="time" value={draft.openingTime} onChange={(event) => update("openingTime", event.target.value)} aria-invalid={Boolean(errors.openingTime)} aria-describedby={describedBy("openingTime")} />{errorFor("openingTime")}</label>
          <label>Jam tutup<input required type="time" value={draft.closingTime} onChange={(event) => update("closingTime", event.target.value)} aria-invalid={Boolean(errors.closingTime)} aria-describedby={describedBy("closingTime")} />{errorFor("closingTime")}</label>
          <label className="admin-full-width">Hari layanan <span className="admin-muted">(kosongkan bila belum ditetapkan)</span><input maxLength={160} value={draft.serviceDaysText} onChange={(event) => update("serviceDaysText", event.target.value)} aria-invalid={Boolean(errors.serviceDaysText)} aria-describedby={describedBy("serviceDaysText")} />{errorFor("serviceDaysText")}</label>
        </div>
      </section>
      <section className="admin-form-section" aria-labelledby="settings-method-title">
        <h2 id="settings-method-title">Pengiriman dan pengambilan</h2>
        <div className="admin-form-grid">
          <label>Catatan pengiriman <span className="admin-muted">(opsional)</span><textarea rows={3} maxLength={500} value={draft.deliveryNote} onChange={(event) => update("deliveryNote", event.target.value)} aria-invalid={Boolean(errors.deliveryNote)} aria-describedby={describedBy("deliveryNote")} />{errorFor("deliveryNote")}</label>
          <label>Catatan pengambilan <span className="admin-muted">(opsional)</span><textarea rows={3} maxLength={500} value={draft.pickupNote} onChange={(event) => update("pickupNote", event.target.value)} aria-invalid={Boolean(errors.pickupNote)} aria-describedby={describedBy("pickupNote")} />{errorFor("pickupNote")}</label>
        </div>
      </section>
      <section className="admin-form-section" aria-labelledby="settings-marketplace-title">
        <h2 id="settings-marketplace-title">Marketplace</h2>
        <p className="admin-muted">Tautan kosong tidak ditampilkan ke pelanggan.</p>
        <div className="admin-form-grid">
          <label>GoFood <span className="admin-muted">(opsional)</span><input type="url" maxLength={2048} value={draft.gofoodUrl} onChange={(event) => update("gofoodUrl", event.target.value)} aria-invalid={Boolean(errors.gofoodUrl)} aria-describedby={describedBy("gofoodUrl")} />{errorFor("gofoodUrl")}</label>
          <label>ShopeeFood <span className="admin-muted">(opsional)</span><input type="url" maxLength={2048} value={draft.shopeefoodUrl} onChange={(event) => update("shopeefoodUrl", event.target.value)} aria-invalid={Boolean(errors.shopeefoodUrl)} aria-describedby={describedBy("shopeefoodUrl")} />{errorFor("shopeefoodUrl")}</label>
        </div>
      </section>
      <section className="admin-form-section" aria-labelledby="settings-snack-title">
        <h2 id="settings-snack-title">Aturan snack box</h2>
        <div className="admin-form-grid">
          <label>Minimum box <span className="admin-muted">(kosong = belum ditetapkan)</span><input type="number" min="1" step="1" value={draft.snackMinBoxes} onChange={(event) => update("snackMinBoxes", event.target.value)} aria-invalid={Boolean(errors.snackMinBoxes)} aria-describedby={describedBy("snackMinBoxes")} />{errorFor("snackMinBoxes")}</label>
          <label>Tenggat pemesanan · hari <span className="admin-muted">(kosong = belum ditetapkan)</span><input type="number" min="0" step="1" value={draft.snackLeadDays} onChange={(event) => update("snackLeadDays", event.target.value)} aria-invalid={Boolean(errors.snackLeadDays)} aria-describedby={describedBy("snackLeadDays")} />{errorFor("snackLeadDays")}</label>
          <label className="admin-full-width">Deskripsi layanan <span className="admin-muted">(opsional)</span><textarea rows={5} maxLength={1200} value={draft.snackDescription} onChange={(event) => update("snackDescription", event.target.value)} aria-invalid={Boolean(errors.snackDescription)} aria-describedby={describedBy("snackDescription")} />{errorFor("snackDescription")}</label>
        </div>
      </section>
      <div className="admin-form-actions"><button className="auth-button" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan pengaturan"}</button></div>
    </form>
  );
}
