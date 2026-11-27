"use client";

import { useSyncExternalStore } from "react";
import { track } from "@/lib/track";

export type CartItem = {
  /** One line per product, or per option of a product with options. */
  key: string;
  productId: string;
  /** Which option (e.g. Color: Teal), for a product with options */
  variantId?: string;
  /** "Teal" or "Teal / Large", shown under the title */
  option?: string;
  slug: string;
  title: string;
  price: number;
  image?: import("@/lib/types").ProductImage;
  etsyUrl?: string;
  qty: number;
  maxQty?: number;
  /** Ships from India (flat shipping, arranged by hand); set when added, refreshed from the catalog at checkout. */
  fromIndia?: boolean;
};

/** The shopper's free gift (see lib/free-gift.ts): one option of the gift product, at no charge. `price` is its regular price, shown struck through. */
export type GiftChoice = {
  productId: string;
  variantId?: string;
  option?: string;
  slug: string;
  title: string;
  price: number;
  image?: import("@/lib/types").ProductImage;
};

/** `aside`: the bag set aside while a Hot Sale piece is bought on its own; it comes back after (or on request). */
type State = { items: CartItem[]; open: boolean; aside: CartItem[]; gift: GiftChoice | null };

const KEY = "omthreads-cart-v1";
const GIFT_KEY = "omthreads-cart-gift-v1";
const ASIDE_KEY = "omthreads-cart-aside-v1";
const EMPTY: State = { items: [], open: false, aside: [], gift: null };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    // Carts saved before options existed have no key: each product was one line.
    if (raw) state = { ...state, items: (JSON.parse(raw) as CartItem[]).map((i) => ({ ...i, key: i.key ?? i.productId })) };
    const aside = window.localStorage.getItem(ASIDE_KEY);
    state = { ...state, aside: aside ? (JSON.parse(aside) as CartItem[]) : [] };
    const gift = window.localStorage.getItem(GIFT_KEY);
    state = { ...state, gift: gift ? (JSON.parse(gift) as GiftChoice) : null };
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
  if (next.aside) {
    try {
      if (state.aside.length) window.localStorage.setItem(ASIDE_KEY, JSON.stringify(state.aside));
      else window.localStorage.removeItem(ASIDE_KEY);
    } catch {
      /* ignore */
    }
  }
  if (next.gift !== undefined) {
    try {
      if (state.gift) window.localStorage.setItem(GIFT_KEY, JSON.stringify(state.gift));
      else window.localStorage.removeItem(GIFT_KEY);
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
    if (e.key !== KEY && e.key !== ASIDE_KEY && e.key !== GIFT_KEY) return;
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

export const cartKey = (productId: string, variantId?: string) => (variantId ? `${productId}:${variantId}` : productId);

export const cart = {
  add(item: Omit<CartItem, "qty" | "key">, qty = 1) {
    load();
    const key = cartKey(item.productId, item.variantId);
    const existing = state.items.find((i) => i.key === key);
    const items = existing
      ? state.items.map((i) => (i.key === key ? { ...i, ...item, key, qty: clamp(i.qty + qty, item.maxQty) } : i))
      : [...state.items, { ...item, key, qty: clamp(qty, item.maxQty) }];
    set({ items, open: true });
    // Meta Pixel (does nothing without a pixel): the product's slug is its Meta catalog content id.
    track("AddToCart", { content_ids: [item.slug], content_type: "product", contents: [{ id: item.slug, quantity: qty, item_price: item.price }], value: Math.round(item.price * qty * 100) / 100, currency: "USD" });
  },
  setQty(key: string, qty: number) {
    set({
      items: state.items.map((i) => (i.key === key ? { ...i, qty: clamp(qty, i.maxQty) } : i)).filter((i) => i.qty > 0),
    });
  },
  remove(key: string) {
    set({ items: state.items.filter((i) => i.key !== key) });
  },
  clear() {
    set({ items: [], gift: null });
  },
  /** Chooses (or with null, removes) the free gift. */
  setGift(gift: GiftChoice | null) {
    load();
    set({ gift });
  },
  /** Empties the cart and puts exactly these lines in it (a Meta Shops checkout link). */
  replace(items: Omit<CartItem, "key">[]) {
    load();
    set({
      items: items
        .map((i) => ({ ...i, key: cartKey(i.productId, i.variantId), qty: clamp(i.qty, i.maxQty) }))
        .filter((i) => i.qty > 0),
    });
  },
  /**
   * Buy one piece on its own (a Hot Sale tile): the bag's other lines are set aside (added to any already
   * set aside) and the cart holds just these lines.
   */
  buyAlone(items: Omit<CartItem, "key">[]) {
    load();
    const keys = new Set(items.map((i) => cartKey(i.productId, i.variantId)));
    const aside = [...state.aside];
    for (const i of state.items) {
      if (keys.has(i.key)) continue;
      const at = aside.findIndex((a) => a.key === i.key);
      if (at === -1) aside.push(i);
      else aside[at] = { ...i, qty: clamp(aside[at].qty + i.qty, i.maxQty) };
    }
    // A Hot Sale piece is bought on its own: no free gift with it.
    set({ aside, gift: null });
    cart.replace(items);
  },
  /** A direct link's pieces join the bag: a piece already in it keeps the larger quantity; anything set aside comes back. */
  addLink(items: Omit<CartItem, "key">[]) {
    load();
    const next = [...state.items, ...state.aside.filter((a) => !state.items.some((i) => i.key === a.key))];
    for (const l of items) {
      const key = cartKey(l.productId, l.variantId);
      const at = next.findIndex((i) => i.key === key);
      if (at === -1) next.push({ ...l, key, qty: clamp(l.qty, l.maxQty) });
      else next[at] = { ...next[at], ...l, key, qty: clamp(Math.max(next[at].qty, l.qty), l.maxQty) };
    }
    set({ items: next.filter((i) => i.qty > 0), aside: [] });
  },
  /** Swaps one line for another in the same place (a different colour picked at checkout). */
  swap(key: string, item: Omit<CartItem, "key" | "qty">) {
    load();
    const next = cartKey(item.productId, item.variantId);
    set({
      items: state.items
        .filter((i) => i.key === key || i.key !== next)
        .map((i) => (i.key === key ? { ...i, ...item, key: next, qty: clamp(i.qty, item.maxQty) } : i))
        .filter((i) => i.qty > 0),
    });
  },
  /** Puts the set-aside bag back in the cart (next to what's there). */
  bringBack() {
    load();
    const items = [...state.items];
    for (const a of state.aside) {
      const at = items.findIndex((i) => i.key === a.key);
      if (at === -1) items.push(a);
      else items[at] = { ...items[at], qty: clamp(items[at].qty + a.qty, a.maxQty) };
    }
    set({ items, aside: [] });
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
