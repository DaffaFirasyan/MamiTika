import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CartProvider } from "@/components/cart-provider";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <CartProvider><SiteHeader /><main id="main-content">{children}</main><SiteFooter /></CartProvider>;
}
