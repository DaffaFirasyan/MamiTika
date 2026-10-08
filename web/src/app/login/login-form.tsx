"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (result.error) {
      setMessage("Email atau password belum cocok. Silakan periksa kembali.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <label htmlFor="password">Password</label>
      <div className="password-field">
        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
        <button className="text-button" type="button" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? "Sembunyikan" : "Tampilkan"} password
        </button>
      </div>
      {message && <p className="auth-message" role="alert">{message}</p>}
      <button className="auth-button" type="submit" disabled={busy}>
        {busy ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
