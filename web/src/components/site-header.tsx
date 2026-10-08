"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";

const links = [
  ["Menu", "/menu"],
  ["Snack Box", "/snack-box"],
  ["Galeri", "/galeri"],
  ["Kontak", "/kontak"],
] as const;

export function SiteHeader() {
  const { items } = useCart();
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#main-content">Lewati ke konten</a>
      <p className="preview-notice">Mamitika · Bakery rumahan dari Bandung</p>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="Mamitika, beranda">
            <Image src="/brand/logo.png" alt="Mamitika" width={810} height={303} priority />
          </Link>
          <button
            ref={toggleRef}
            className="menu-toggle"
            type="button"
            aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={open}
            aria-controls="site-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Tutup" : "Menu"}
          </button>
          <nav id="site-navigation" className={`site-nav${open ? " is-open" : ""}`} aria-label="Navigasi utama">
            {links.map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>
            ))}
          </nav>
          <Link className="cart-header-link" href="/keranjang" aria-label={`Keranjang, ${quantity} unit jual`}>
            <span>Keranjang</span> <span aria-hidden="true">({quantity > 99 ? "99+" : quantity})</span>
          </Link>
        </div>
      </header>
    </>
  );
}
