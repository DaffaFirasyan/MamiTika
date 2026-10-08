"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { cartReducer, cartStorageKey, initialCartState, restoreCart, serializeCart } from "@/lib/cart-state";
import type { Availability } from "@/lib/types";

type CartContextValue = {
  items: typeof initialCartState.items;
  hydrated: boolean;
  hadInvalidData: boolean;
  storageUnavailable: boolean;
  announcement: string;
  add(productId: string, quantity: number): boolean;
  setQuantity(productId: string, quantity: number): void;
  remove(productId: string): void;
  announce(message: string): void;
  rememberProduct(productId: string, price: number | null, availability: Availability): void;
  previousPrice(productId: string): number | null | undefined;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const productSnapshots = useRef(new Map<string, { price: number | null; availability: Availability }>());

  useEffect(() => {
    const restored = restoreCart(() => window.localStorage.getItem(cartStorageKey));
    dispatch({ type: "restore", ...restored });
  }, []);

  useEffect(() => {
    if (!state.hydrated || state.storageUnavailable) return;
    try {
      window.localStorage.setItem(cartStorageKey, serializeCart(state.items));
    } catch {
      dispatch({ type: "storage-unavailable" });
    }
  }, [state.hydrated, state.items, state.storageUnavailable]);

  const value = useMemo<CartContextValue>(() => ({
    items: state.items,
    hydrated: state.hydrated,
    hadInvalidData: state.hadInvalidData,
    storageUnavailable: state.storageUnavailable,
    announcement: state.announcement,
    add(productId, quantity) {
      if (productSnapshots.current.get(productId)?.availability === "unavailable") return false;
      dispatch({ type: "add", productId, quantity });
      return true;
    },
    setQuantity(productId, quantity) { dispatch({ type: "set-quantity", productId, quantity }); },
    remove(productId) { dispatch({ type: "remove", productId }); },
    announce(message) { dispatch({ type: "announce", message }); },
    rememberProduct(productId, price, availability) {
      if (!productSnapshots.current.has(productId)) productSnapshots.current.set(productId, { price, availability });
    },
    previousPrice(productId) { return productSnapshots.current.get(productId)?.price; },
  }), [state]);

  return (
    <CartContext.Provider value={value}>
      {state.storageUnavailable && <p className="cart-storage-notice" role="status">Penyimpanan browser tidak tersedia. Keranjang hanya tersimpan selama halaman ini terbuka.</p>}
      {state.hadInvalidData && <p className="cart-storage-notice" role="status">Sebagian keranjang lama tidak dapat dipulihkan dan telah diabaikan.</p>}
      <span className="visually-hidden" aria-live="polite">{state.announcement}</span>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart harus digunakan di dalam CartProvider.");
  return context;
}
