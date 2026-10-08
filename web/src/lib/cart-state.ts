import { parseStoredCart } from "./cart.ts";
import type { CartItem } from "./types.ts";

export const cartStorageKey = "mamitika.cart.v1";

export type CartState = {
  items: CartItem[];
  hydrated: boolean;
  hadInvalidData: boolean;
  storageUnavailable: boolean;
  announcement: string;
};

export const initialCartState: CartState = {
  items: [],
  hydrated: false,
  hadInvalidData: false,
  storageUnavailable: false,
  announcement: "",
};

export type CartAction =
  | { type: "restore"; items: CartItem[]; hadInvalidData: boolean; storageUnavailable: boolean }
  | { type: "add"; productId: string; quantity: number }
  | { type: "set-quantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "announce"; message: string }
  | { type: "storage-unavailable" };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "restore") return { ...state, items: action.items, hydrated: true, hadInvalidData: action.hadInvalidData, storageUnavailable: action.storageUnavailable };
  if (action.type === "announce") return { ...state, announcement: action.message };
  if (action.type === "storage-unavailable") return state.storageUnavailable ? state : { ...state, storageUnavailable: true };
  if (action.type === "remove") return { ...state, items: state.items.filter((item) => item.productId !== action.productId) };
  if (!uuid.test(action.productId) || !Number.isSafeInteger(action.quantity) || action.quantity <= 0) return state;

  const existing = state.items.find((item) => item.productId === action.productId);
  if (action.type === "set-quantity") {
    if (!existing) return state;
    return { ...state, items: state.items.map((item) => item.productId === action.productId ? { ...item, quantity: action.quantity } : item) };
  }
  const total = (existing?.quantity ?? 0) + action.quantity;
  if (!Number.isSafeInteger(total)) return state;
  return existing
    ? { ...state, items: state.items.map((item) => item.productId === action.productId ? { ...item, quantity: total } : item) }
    : { ...state, items: [...state.items, { productId: action.productId, quantity: action.quantity }] };
}

export function restoreCart(read: () => string | null): Pick<CartState, "items" | "hadInvalidData" | "storageUnavailable"> {
  try {
    const restored = parseStoredCart(read());
    return { items: restored.cart.items, hadInvalidData: restored.hadInvalidData, storageUnavailable: false };
  } catch {
    return { items: [], hadInvalidData: false, storageUnavailable: true };
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({ version: 1, items });
}
