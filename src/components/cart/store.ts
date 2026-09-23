"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image?: import("@/lib/types").ProductImage;
  etsyUrl?: string;
  qty: number;
  maxQty?: number;
};

type State = { items: CartItem[]; open: boolean };

const KEY = "omthreads-cart-v1";
const EMPTY: State = { items: [], open: false };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...state, items: JSON.parse(raw) as CartItem[] };
  } catch {
    /* storage unavailable (private mode) — cart still works in memory */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  if (next.items) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const clamp = (qty: number, max?: number) => Math.max(0, max === undefined ? Math.min(qty, 10) : Math.min(qty, max));

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    load();
    const existing = state.items.find((i) => i.productId === item.productId);
    const items = existing
      ? state.items.map((i) =>
          i.productId === item.productId ? { ...i, ...item, qty: clamp(i.qty + qty, item.maxQty) } : i,
        )
      : [...state.items, { ...item, qty: clamp(qty, item.maxQty) }];
    set({ items, open: true });
  },
  setQty(productId: string, qty: number) {
    set({
      items: state.items
        .map((i) => (i.productId === productId ? { ...i, qty: clamp(qty, i.maxQty) } : i))
        .filter((i) => i.qty > 0),
    });
  },
  remove(productId: string) {
    set({ items: state.items.filter((i) => i.productId !== productId) });
  },
  clear() {
    set({ items: [] });
  },
  open() {
    set({ open: true });
  },
  close() {
    set({ open: false });
  },
};

export function useCart() {
  const s = useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => EMPTY,
  );
  const count = s.items.reduce((n, i) => n + i.qty, 0);
  const subtotal = s.items.reduce((n, i) => n + i.qty * i.price, 0);
  return { ...s, count, subtotal };
}
