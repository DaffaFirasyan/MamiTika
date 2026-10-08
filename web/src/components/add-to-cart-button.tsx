"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { QuantityInput } from "@/components/quantity-input";
import type { PublicProduct } from "@/lib/types";

export function AddToCartButton({ product, showQuantity = false }: { product: PublicProduct; showQuantity?: boolean }) {
  const { add, announce, hydrated, rememberProduct } = useCart();
  const [quantity, setQuantity] = useState(1);
  const unavailable = !product.isActive || product.availability === "unavailable";

  return (
    <div className="product-purchase-controls">
      {showQuantity && <QuantityInput value={quantity} label={product.name} onChange={setQuantity} />}
      <button
        className="button product-add-button"
        type="button"
        disabled={!hydrated || unavailable || product.priceRupiah === null}
        onClick={() => {
          rememberProduct(product.id, product.priceRupiah, product.availability);
          if (add(product.id, quantity)) announce(`${quantity} ${product.quantityUnit ?? "unit"} ${product.name} ditambahkan ke keranjang`);
        }}
        aria-label={unavailable ? `${product.name} tidak tersedia` : product.availability === "unconfirmed" ? `Tambah ${product.name}; konfirmasi ketersediaan` : `Tambah ${product.name}`}
      >
        {unavailable ? "Tidak tersedia" : product.priceRupiah === null ? "Harga dikonfirmasi langsung" : "Tambah"}
      </button>
    </div>
  );
}
