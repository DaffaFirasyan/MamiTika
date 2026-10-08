"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    const result = await authClient.signOut();
    if (result.error) {
      setBusy(false);
      return;
    }
    window.location.replace("/login?error=signed-out");
  }
  return <button className="text-button" type="button" onClick={signOut} disabled={busy}>{busy ? "Keluar…" : "Keluar"}</button>;
}

export function ChangePasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setMessage("Password baru dan konfirmasi belum sama.");
      setBusy(false);
      return;
    }

    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    if (result.error) {
      setMessage("Password belum dapat diubah. Periksa password saat ini dan coba lagi.");
      setBusy(false);
      return;
    }
    formElement.reset();
    setSuccess(true);
    setMessage("Password berhasil diubah.");
    setBusy(false);
  }

  return (
    <form className="auth-form password-change-form" onSubmit={submit}>
      <label htmlFor="current-password">Password saat ini</label>
      <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
      <label htmlFor="new-password">Password baru</label>
      <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <label htmlFor="confirm-password">Ulangi password baru</label>
      <input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      {message && <p className={success ? "auth-success" : "auth-message"} role="status">{message}</p>}
      <button className="auth-button" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Ubah password"}</button>
    </form>
  );
}
