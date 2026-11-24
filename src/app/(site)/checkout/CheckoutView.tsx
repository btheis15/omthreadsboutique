"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bold } from "@/components/Bold";
import { FreeGift, giftLine } from "@/components/cart/FreeGift";
import { type CartItem, cart, cartKey, useCart } from "@/components/cart/store";
import { ExternalIcon, ShieldIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { wcProjectId } from "@/lib/bch/walletConnect";
import type { FreeGiftOffer } from "@/lib/free-gift";
import type { CheckoutLine } from "@/lib/payments";
import { shippingCents } from "@/lib/payments-shared";
import { formatPrice, site } from "@/lib/site";
import { makeT } from "@/lib/site-text";
import { checkoutMeta } from "@/lib/attribution";
import { track } from "@/lib/track";
import type { CheckoutInfo } from "@/lib/types";
import { ExpressPay } from "./ExpressPay";
import { PayPalButtons } from "./PayPalButtons";
import { PiecePhotosViewer, photosFor } from "./PiecePhotos";
import { PieceSpotlight } from "./PieceSpotlight";
import type { Product } from "@/lib/types";
import { regularKey, variantLabel, variantPrice } from "@/lib/variants";
import { Price } from "@/components/Price";
import type { PiecePhotos } from "@/app/api/piece-photos/route";

type Provider = CheckoutInfo["providers"][number];
type Fulfil = "ship" | "pickup" | "delivery";
// PayPal, crypto, Zelle and Venmo need the details on this page (Stripe asks on its own page when shipping; pickup and delivery are always asked here).
const asksAddress = (p: Provider, f: Fulfil) => f !== "ship" || p !== "stripe";
type Coupon = { code: string; label: string; discountCents: number; text: string; freeShipping?: boolean; state?: string };
type Customer = { name: string; email: string; phone: string; line1: string; line2: string; city: string; state: string; postal_code: string };
const EMPTY: Customer = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "" };
const dollars = (cents: number) => formatPrice(cents / 100);
/** A live carrier rate from the shop (see /api/shipping-rates). */
type LiveRate = { id: string; label: string; cents: number; /** Estimated sales tax for this option (null when the shop couldn't work it out). */ taxCents?: number | null; minDays?: number | null; maxDays?: number | null; carrier?: string };
type Quote = { id: string; rates: LiveRate[]; forKey: string };
const daysText = (r: LiveRate) => {
  const a = r.minDays ?? null;
  const b = r.maxDays ?? null;
  if (a === null && b === null) return "";
  return a !== null && b !== null && a !== b ? `${a}\u2013${b}` : String(b ?? a);
};

/** Four corners pointing out: "see it bigger". */
const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

/**
 * The cart and, when the shop's own checkout is on, the way to pay: Stripe
 * (cards, Apple Pay, Google Pay, and UPI for shoppers in India), PayPal and
 * Venmo, Bitcoin Cash (paid on the shop's own payment screen), Exodus
 * (USDC/USDT stablecoins), Zelle or Venmo. Without it, each piece links to Etsy.
 */
export function CheckoutView({
  checkout,
  cancelled,
  testerLink,
  returnDays,
  text,
  linkCart,
  linkCoupon,
  buyAlone = false,
  spotlight = null,
  spotlightWoven = false,
  soldOutLink = null,
  colorNote = null,
  freeShippingThreshold = 0,
  freeGift = null,
  regular = {},
}: {
  checkout: CheckoutInfo | null;
  cancelled: boolean;
  testerLink: "on" | "invalid" | null;
  returnDays: number;
  /** The owner's text overrides (feed `text`). */
  text?: Record<string, string>;
  /** A Meta Shops checkout link's products: they replace the cart (null when the link has none). */
  linkCart?: Omit<CartItem, "key">[] | null;
  /** That link's coupon code, tried once the cart is in place (ignored if it isn't valid). */
  linkCoupon?: string | null;
  /** A one-piece or Hot Sale link: the piece is added to the bag (the rest of the bag stays). */
  buyAlone?: boolean;
  /** A one-piece link's piece (/checkout?product=): shown large, with its colours, while it's the only thing in the cart. */
  spotlight?: Product | null;
  /** The spotlight piece's craft is a weave (it says "Handwoven in …"). */
  spotlightWoven?: boolean;
  /** That link's piece when it has sold out (its title), to say so. */
  soldOutLink?: string | null;
  /** A one-piece link named a colour that's sold out or unknown: what was picked instead. */
  colorNote?: { text: string; variantId?: string } | null;
  /** The site-wide free standard shipping amount in dollars (0 = none); the shop's own US rate wins when it has one. */
  freeShippingThreshold?: number;
  /** The free-gift offer (e.g. a free pouch with 2+ items), when it's on and in stock. Never with a buy-alone piece. */
  freeGift?: FreeGiftOffer | null;
  /** Regular prices of lines on sale, from the catalog (see regularPrices), shown struck through. */
  regular?: Record<string, number>;
}) {
  const t = makeT(text);
  const saved = useCart();
  // Until the link's products are in the cart, show them (not what the cart held before).
  const [linkPending, setLinkPending] = useState(Boolean(linkCart));
  // A bag set aside by an older version of the site comes straight back: nothing is ever hidden at checkout.
  useEffect(() => {
    if (saved.aside.length) cart.bringBack();
  }, [saved.aside.length]);
  useEffect(() => {
    if (!linkCart) return;
    // A one-piece or Hot Sale link adds the piece to the bag (nothing is set aside); a Meta Shops cart replaces it.
    if (buyAlone) cart.addLink(linkCart);
    else cart.replace(linkCart);
    // Drop Meta's parameters, so reloading keeps the shopper's own changes to the cart.
    const url = new URL(window.location.href);
    for (const k of ["products", "product", "color", "coupon", "cart_origin"]) url.searchParams.delete(k);
    window.history.replaceState(window.history.state, "", url);
    // The cart store now holds the link's products; read from it from here on.
    queueMicrotask(() => setLinkPending(false));
  }, [linkCart, buyAlone]);
  const items: CartItem[] =
    linkPending && linkCart
      ? linkCart.map((i) => ({ ...i, key: cartKey(i.productId, i.variantId), qty: Math.min(i.qty, i.maxQty ?? 10) })).filter((i) => i.qty > 0)
      : saved.items;
  const regularOf = (i: CartItem) => regular[regularKey(i.productId, i.variantId)];
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
  // The free gift: with any bag of enough paid items.
  const offer = linkPending ? null : freeGift;
  const paidCount = items.reduce((n, i) => n + i.qty, 0);
  const gift = offer && saved.gift && paidCount >= offer.minItems ? saved.gift : null;
  const router = useRouter();
  // Every photo of the pieces in the cart (the cart keeps one each), for a closer look before paying.
  const [photos, setPhotos] = useState<Record<string, PiecePhotos>>(() =>
    spotlight
      ? { [spotlight.slug]: { images: spotlight.images, optionImages: Object.fromEntries((spotlight.variants ?? []).filter((v) => v.image?.url).map((v) => [v.id, v.image!.url!])), details: [] } }
      : {},
  );
  const [viewing, setViewing] = useState<{ line: number; photo: number } | null>(null);
  // The link's piece, shown large while it's the only line (adding the bag back shows the usual list).
  const spotLine = spotlight && items.length === 1 && items[0].productId === spotlight.id ? items[0] : null;
  const photoSlugs = [...new Set(items.map((i) => i.slug))].sort().join(",");
  useEffect(() => {
    if (!photoSlugs) return;
    let live = true;
    fetch(`/api/piece-photos?slugs=${encodeURIComponent(photoSlugs)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: Record<string, PiecePhotos>) => live && setPhotos(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [photoSlugs]);
  const onSite = Boolean(checkout);
  const [country, setCountry] = useState(checkout?.countries[0]?.code ?? "US");
  const [how, setHow] = useState<Fulfil>("ship");
  const [rateId, setRateId] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState<Provider>(checkout?.providers[0] ?? "stripe");
  const [testAsIndia, setTestAsIndia] = useState(false);
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  // Mobile: the three screens (on larger screens everything shows on one page).
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [giftNote, setGiftNote] = useState("");
  // Bitcoin Cash: the receipt as an email, an Om Receipt CashToken, or both (when the shop offers it).
  const [receipt, setReceipt] = useState<"email" | "token" | "both">("both");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // After "Continue" with PayPal: the priced order, ready for PayPal's buttons.
  const [paypalOrder, setPaypalOrder] = useState<string | null>(null);
  const [paypalMessage, setPaypalMessage] = useState<string | null>(null);
  const onPayPalMessage = useCallback((m: string | null) => setPaypalMessage(m), []);

  const subtotalCents = items.reduce((n, i) => n + Math.round(i.price * 100) * i.qty, 0);
  const place = checkout?.countries.find((c) => c.code === country) ?? checkout?.countries[0];
  const rate = place?.rates.find((r) => r.id === rateId) ?? place?.rates[0];
  const pickup = checkout?.pickup ?? null;
  const delivery = checkout?.delivery ?? null;
  const fulfil: Fulfil = how === "pickup" && pickup ? "pickup" : how === "delivery" && delivery ? "delivery" : "ship";
  // Pickup and delivery are US-only, so the country and shipping rate don't apply.
  const placeCode = fulfil === "ship" ? (place?.code ?? "US") : "US";
  // Live carrier rates: every provider gets the address form here, then the shopper picks a quoted option.
  // The shop says when a cart can't be priced live (an export over the AES limit): the flat prices apply to that cart.
  const [flatFor, setFlatFor] = useState<string | null>(null);
  const flatKey = JSON.stringify([placeCode, items.map((i) => [i.productId, i.variantId, i.qty]), gift?.variantId ?? gift?.productId ?? null]);
  const live = fulfil === "ship" && place?.live === true && flatFor !== flatKey;
  const needsForm = asksAddress(provider, fulfil) || live;
  // Apple Pay / Google Pay without typing the address: only where the shop prices shipping live and Stripe can take it.
  const liveCountries = checkout?.countries.filter((c) => c.live === true).map((c) => c.code) ?? [];
  const expressOn = Boolean(fulfil === "ship" && live && checkout?.providers.includes("stripe") && checkout.stripe?.express && checkout.stripe.publishableKey && liveCountries.length);
  // True only while the express button is really showing on this device (then the card option drops the wallet wording).
  const [walletsReady, setWalletsOnPage] = useState(false);
  const walletsOnPage = expressOn && walletsReady;
  const [moreRates, setMoreRates] = useState(false);
  const itemCount = items.reduce((n, i) => n + i.qty, 0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteRateId, setQuoteRateId] = useState<string | undefined>(undefined);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  // A quote is only good for the cart and address it was asked for; changing either makes it vanish.
  const quoteKey = JSON.stringify([placeCode, items.map((i) => [i.productId, i.variantId, i.qty]), gift?.variantId ?? gift?.productId ?? null, customer.line1.trim(), customer.line2.trim(), customer.city.trim(), customer.state.trim(), customer.postal_code.trim(), coupon?.code ?? ""]);
  const activeQuote = live && quote && quote.forKey === quoteKey ? quote : null;
  // Ready to ask the carrier: everything the shop checks (name, email, phone, address) would pass.
  const addr = customer;
  const phoneOk = /^[+\d][\d\s().-]{6,23}$/.test(addr.phone.trim());
  const addressReadyNoPhone =
    addr.name.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.email.trim()) &&
    addr.line1.trim() !== "" &&
    addr.city.trim() !== "" &&
    (placeCode === "US"
      ? /^[A-Za-z]{2}$/.test(addr.state.trim()) && /^\d{5}(-\d{4})?$/.test(addr.postal_code.trim())
      : placeCode === "IN"
        ? addr.state.trim() !== "" && /^\d{6}$/.test(addr.postal_code.trim())
        : true);
  const addressReady = phoneOk && addressReadyNoPhone;
  // What the quote would be asked for, contact details included: an error is remembered against it, so it isn't retried on its own.
  const askKey = JSON.stringify([quoteKey, addr.name.trim(), addr.email.trim(), addr.phone.trim()]);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const quoteReqId = useRef(0);
  const optionsRef = useRef<HTMLDivElement>(null);
  const chosenRate = activeQuote ? (activeQuote.rates.find((r) => r.id === quoteRateId) ?? activeQuote.rates[0]) : undefined;
  const shippingFull =
    fulfil === "pickup"
      ? (pickup?.cents ?? 0)
      : fulfil === "delivery"
        ? (delivery?.cents ?? 0)
        : live
          ? (chosenRate?.cents ?? 0)
          : rate
            ? shippingCents(rate, subtotalCents, itemCount)
            : 0;

  // Typed coupon code: shown here for the shopper; the admin checks it again when the order is priced.
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const couponRef = useRef<Coupon | null>(null);
  useEffect(() => {
    couponRef.current = coupon;
  }, [coupon]);
  const couponsOn = Boolean(checkout?.couponCodes);
  const lines: CheckoutLine[] = [...items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })), ...(gift ? [giftLine(gift)] : [])];
  const linesKey = JSON.stringify(lines);
  // Meta Pixel InitiateCheckout, once, when the page opens with a bag (not for the "Buy on Etsy" view).
  const initiated = useRef(false);
  const hasBag = Boolean(checkout) && !linkPending && items.length > 0;
  useEffect(() => {
    if (!hasBag || initiated.current) return;
    initiated.current = true;
    const n = items.reduce((c, i) => c + i.qty, 0);
    track("InitiateCheckout", {
      content_ids: items.map((i) => i.slug),
      content_type: "product",
      contents: items.map((i) => ({ id: i.slug, quantity: i.qty, item_price: i.price })),
      num_items: n,
      value: Math.round(subtotal * 100) / 100,
      currency: "USD",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per page open
  }, [hasBag]);
  const discount = coupon ? Math.min(coupon.discountCents, subtotalCents) : 0;
  // A free-shipping code (the admin decides; it also covers personal delivery): every shipping price below shows as Free.
  // A code limited to a state only counts once the shopper's address is in it (the admin checks again when the order is priced).
  const freeShip = Boolean(coupon?.freeShipping) && (!coupon?.state || fulfil === "pickup" || (placeCode === "US" && addr.state.trim().toUpperCase() === coupon.state));
  const shipping = freeShip ? 0 : shippingFull;
  // Estimated sales tax: the shop works it out for the chosen option and address exactly as the order will be priced.
  const taxCents = live && chosenRate && typeof chosenRate.taxCents === "number" ? chosenRate.taxCents : null;
  const total = subtotalCents - discount + shipping + (taxCents ?? 0);
  const shippingKnown = fulfil !== "ship" || !live || Boolean(chosenRate);
  // Free standard shipping (US, by merchandise subtotal): the shop's own US rate decides, else the site-wide amount.
  const freeOverCents = checkout?.countries.find((c) => c.code === "US")?.rates.find((r) => r.freeOverCents !== null && r.freeOverCents !== undefined)?.freeOverCents ?? Math.round(freeShippingThreshold * 100);
  const awayFreeCents = fulfil === "ship" && placeCode === "US" && freeOverCents > 0 ? freeOverCents - subtotalCents : null;

  async function checkCoupon(code: string): Promise<Coupon | string | { error: string; gone: boolean }> {
    try {
      const res = await fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, lines: JSON.parse(linesKey) }) });
      const data = (await res.json().catch(() => ({}))) as Partial<Coupon> & { error?: string };
      if (res.ok && typeof data.discountCents === "number") return { code: data.code ?? code, label: data.label ?? "", discountCents: data.discountCents, text: data.text ?? "", ...(data.freeShipping ? { freeShipping: true, ...(typeof data.state === "string" ? { state: data.state } : {}) } : {}) };
      return { error: data.error ?? "That coupon code isn't valid.", gone: res.status === 404 || res.status === 409 };
    } catch {
      return "Couldn't check that code. Check your connection and try again.";
    }
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError(null);
    const result = await checkCoupon(code);
    if (typeof result === "string") setCouponError(result);
    else if ("error" in result) setCouponError(result.error);
    else {
      setCoupon(result);
      setCouponOpen(false);
      setCouponInput("");
    }
    setCouponBusy(false);
  }

  // The cart changed: check the applied code again, quietly (drop it if it no longer works).
  useEffect(() => {
    const applied = couponRef.current;
    if (!applied) return;
    let stale = false;
    checkCoupon(applied.code).then((result) => {
      if (stale) return;
      // Drop the code only when the server says it's gone (404/409); a 429, network or 5xx hiccup keeps it (re-checked at payment).
      if (typeof result === "string") return;
      setCoupon("error" in result ? (result.gone ? null : couponRef.current) : result);
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey]);

  // A Meta Shops link's coupon: tried once the link's cart is in place; no message if it isn't valid.
  const linkCouponTried = useRef(false);
  useEffect(() => {
    if (!linkCoupon || !couponsOn || linkPending || linkCouponTried.current || items.length === 0) return;
    linkCouponTried.current = true;
    checkCoupon(linkCoupon).then((result) => {
      if (typeof result !== "string" && !("error" in result)) setCoupon(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCoupon, couponsOn, linkPending, items.length]);

  // Personal delivery: is this ZIP close enough? (Result is kept with the ZIP it answered.)
  const zip5 = /^\d{5}/.test(customer.postal_code.trim()) ? customer.postal_code.trim().slice(0, 5) : "";
  const [zipCheck, setZipCheck] = useState<{ zip: string; ok: boolean | null } | null>(null);
  const [zipRetry, setZipRetry] = useState(0);
  useEffect(() => {
    if (fulfil !== "delivery" || !zip5) return;
    let stale = false;
    fetch("/api/delivery-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zip: zip5 }) })
      .then((r) => r.json().catch(() => ({})))
      .then((d: { ok?: boolean }) => {
        if (!stale) setZipCheck({ zip: zip5, ok: typeof d.ok === "boolean" ? d.ok : null });
      })
      .catch(() => {
        if (!stale) setZipCheck({ zip: zip5, ok: null });
      });
    return () => {
      stale = true;
    };
  }, [fulfil, zip5, zipRetry]);
  const zipAnswer = zipCheck && zipCheck.zip === zip5 ? zipCheck : null;
  const deliveryBlocked = fulfil === "delivery" && !(zipAnswer && zipAnswer.ok === true);

  /** The shop (or carrier) complained about something: show the screen it's on. */
  function jumpToErrors(errors?: Record<string, string>) {
    if (!errors) return;
    const keys = Object.keys(errors);
    if (keys.some((k) => k in EMPTY)) setStep(1);
    else if (keys.includes("rate")) setStep(2);
  }

  async function showShippingOptions() {
    const reqId = ++quoteReqId.current;
    const asked = askKey;
    setQuoteBusy(true);
    setQuoteError(null);
    setError(null);
    setFieldErrors({});
    const forKey = quoteKey;
    try {
      const res = await fetch("/api/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          country: placeCode,
          coupon: coupon?.code,
          customer: { name: customer.name, email: customer.email, phone: customer.phone, address: { line1: customer.line1, line2: customer.line2, city: customer.city, state: customer.state, postal_code: customer.postal_code } },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { quoteId?: string; rates?: LiveRate[]; fallback?: boolean; error?: string; errors?: Record<string, string> };
      if (reqId !== quoteReqId.current) return;
      if (res.ok && data.fallback === true) {
        setQuote(null);
        setFlatFor(flatKey);
      } else if (res.ok && data.quoteId && Array.isArray(data.rates) && data.rates.length) {
        setQuote({ id: data.quoteId, rates: data.rates, forKey });
        setQuoteRateId(data.rates[0].id);
      } else {
        setQuote(null);
        setQuoteError(data.error ?? "Couldn't get shipping options. Please try again.");
        setFieldErrors(data.errors ?? {});
        jumpToErrors(data.errors);
        setFailedKey(asked);
      }
    } catch {
      if (reqId !== quoteReqId.current) return;
      setQuoteError("Couldn't get shipping options. Check your connection and try again.");
      setFailedKey(asked);
    }
    setQuoteBusy(false);
  }

  // Ask for the options by itself once the address is complete and has stopped changing (not again after an error for the same answers: the button retries).
  const askRef = useRef(showShippingOptions);
  useEffect(() => {
    askRef.current = showShippingOptions;
  });
  const autoAsk = live && !paypalOrder && addressReady && !activeQuote && failedKey !== askKey;
  useEffect(() => {
    if (!autoAsk) return;
    const timer = setTimeout(() => void askRef.current(), 800);
    return () => clearTimeout(timer);
  }, [autoAsk, askKey]);

  // Options just arrived: bring them into view, only if they're off-screen.
  const optionsShown = Boolean(activeQuote);
  useEffect(() => {
    const el = optionsRef.current;
    if (!optionsShown || !el) return;
    const r = el.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
  }, [optionsShown]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          meta: checkoutMeta(),
          coupon: coupon?.code,
          provider,
          walletsOnPage: walletsOnPage && provider === "stripe" && fulfil === "ship" && placeCode !== "IN" ? true : undefined,
          country: placeCode,
          fulfillment: fulfil,
          rateId: fulfil === "ship" ? (live ? chosenRate?.id : rate?.id) : undefined,
          quoteId: live ? activeQuote?.id : undefined,
          testAs: checkout?.mode === "test" && testAsIndia && placeCode === "IN" ? "IN" : undefined,
          giftNote: needsForm && fulfil !== "pickup" ? giftNote : undefined,
          receipt: provider === "bch" && checkout?.bch?.receipts ? receipt : undefined,
          customer:
            needsForm
              ? fulfil === "pickup"
                ? { name: customer.name, email: customer.email, phone: customer.phone }
                : { name: customer.name, email: customer.email, phone: customer.phone, address: { line1: customer.line1, line2: customer.line2, city: customer.city, state: customer.state, postal_code: customer.postal_code } }
              : undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; paypal?: { token: string }; error?: string; errors?: Record<string, string> };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.paypal) {
        setPaypalOrder(data.paypal.token);
        setLoading(false);
        return;
      }
      if (res.status === 409 && gift && /gift|pouch/i.test(data.error ?? "")) {
        // The free gift was just taken (or the offer ended): clear it, refresh the stock, and let them pick again.
        cart.setGift(null);
        router.refresh();
        setError(`${data.error} Choose your ${offer?.label.toLowerCase() ?? "gift"} again below, then continue.`);
        setLoading(false);
        return;
      }
      if (data.errors?.coupon) {
        // The admin no longer accepts the code: drop it and say so.
        setCoupon(null);
        setCouponError(data.errors.coupon);
        setCouponOpen(true);
      }
      // A coupon-only problem is shown once, under the coupon box.
      if (!(data.errors?.coupon && Object.keys(data.errors).length === 1)) setError(data.error ?? "Something went wrong. Please try again.");
      setFieldErrors(data.errors ?? {});
      jumpToErrors(data.errors);
      // The shop no longer honours the quote (expired, or the cart or address changed): ask for options again.
      if (live && data.errors?.rate) setQuote(null);
    } catch {
      setError("Couldn't reach checkout. Check your connection and try again.");
    }
    setLoading(false);
  }

  // Mobile steps: which screens an element shows on (everything shows on larger screens).
  const stepped = onSite;
  const hideUnless = (...n: (1 | 2 | 3)[]) => (stepped && !n.includes(step) ? "max-md:hidden" : "");
  const STEP_NAMES = ["Information", "Shipping", "Payment"] as const;

  /** What step 1 needs before Next: the same rules the shop applies when the order is placed. */
  function addressProblems(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!needsForm) return e;
    const c = customer;
    if (!c.name.trim()) e.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = "Enter a valid email address.";
    if (!/^[+\d][\d\s().-]{6,23}$/.test(c.phone.trim())) e.phone = "Enter a phone number.";
    if (fulfil !== "pickup") {
      if (!c.line1.trim()) e.line1 = "Enter your street address.";
      if (!c.city.trim()) e.city = "Enter your city.";
      if (placeCode === "US") {
        if (!/^[A-Za-z]{2}$/.test(c.state.trim())) e.state = "Use the 2-letter state, e.g. IL.";
        if (!/^\d{5}(-\d{4})?$/.test(c.postal_code.trim())) e.postal_code = "Enter a 5-digit ZIP code.";
      } else if (placeCode === "IN") {
        if (!c.state.trim()) e.state = "Enter your state.";
        if (!/^\d{6}$/.test(c.postal_code.trim())) e.postal_code = "Enter a 6-digit PIN code.";
      }
      if (fulfil === "delivery" && deliveryBlocked && !e.postal_code) e.postal_code = "We can't deliver to that ZIP yet.";
    }
    return e;
  }

  function goTo(n: 1 | 2 | 3) {
    setStep(n);
    setError(null);
    window.scrollTo({ top: 0 });
  }
  function goNext() {
    if (step === 1) {
      const e = addressProblems();
      setFieldErrors(e);
      if (Object.keys(e).length) return;
      goTo(2);
    } else if (step === 2 && (!live || chosenRate)) goTo(3);
  }
  const payLabel = loading
    ? "Starting secure checkout…"
    : provider === "exodus"
      ? "Continue to Exodus Pay"
      : provider === "bch"
        ? "Pay with Bitcoin Cash"
        : provider === "paypal"
          ? "Continue to PayPal"
          : provider === "zelle"
            ? "Place order and get the Zelle details"
            : provider === "venmo"
              ? "Place order and get the Venmo details"
              : "Continue to secure payment";
  // One quiet reassurance by the pay button (US orders; international orders are final sale).
  const returnsLine = placeCode === "US" ? `${returnDays}-day returns on US orders — if it's not right, send it back.` : null;
  const showTax = taxCents !== null && (checkout?.taxAdded || taxCents > 0);
  const nextBlocked = step === 2 && live && (quoteBusy || !chosenRate);

  if (items.length === 0) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        {testerLink === "on" && <p className="mb-6 rounded-lg bg-sand p-3 text-sm">Tester link accepted: this browser now sees the test checkout. Add something to your cart to try it.</p>}
        <h1 className="text-4xl">Your cart is empty</h1>
        <Link href="/shop" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  const field = (name: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, wide = true, help?: string) => (
    <label className={`block ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <span className="mb-1 block text-sm">
        {label}
        {help && <span className="text-muted"> (required)</span>}
      </span>
      <input
        {...props}
        value={customer[name]}
        onChange={(e) => {
          setCustomer({ ...customer, [name]: e.target.value });
          if (fieldErrors[name]) setFieldErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== name)));
        }}
        aria-invalid={Boolean(fieldErrors[name])}
        className={`w-full rounded-lg border bg-ivory px-3 py-2.5 ${fieldErrors[name] ? "border-sale" : "border-line"}`}
      />
      {help && !fieldErrors[name] && <span className="mt-1 block text-xs text-muted">{help}</span>}
      {fieldErrors[name] && <span className="mt-1 block text-sm text-sale">{fieldErrors[name]}</span>}
    </label>
  );

  return (
    <div className={`container-page max-w-3xl pt-10 pb-16 md:pt-16 ${onSite ? "max-md:pt-4 max-md:pb-36" : ""}`}>
      <h1 className={`text-4xl md:text-5xl ${onSite ? "max-md:sr-only" : ""}`}>Checkout</h1>

      {/* Phone: where you are in the three steps, and a slim running total that stays under the header. */}
      {checkout && place && rate && (
        <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-ivory/95 px-4 pt-2 pb-2 backdrop-blur md:hidden">
          <p className="text-sm font-medium" aria-live="polite">
            Step {step} of 3 — {STEP_NAMES[step - 1]}
          </p>
          <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className="flex-1">
                <span className={`block h-1 rounded-full ${n <= step ? "bg-ink" : "bg-line"}`} />
                <span className={`mt-1 block text-center text-[0.7rem] ${n === step ? "font-medium text-ink" : "text-muted"}`}>{STEP_NAMES[n - 1]}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted">
              {itemCount} {itemCount === 1 ? "item" : "items"}
              {shippingKnown && ` · ${shipping ? `${dollars(shipping)} shipping` : "free shipping"}`}
              {showTax ? ` · ${dollars(taxCents)} est. tax` : placeCode === "US" && fulfil === "ship" ? " · tax at address" : ""}
            </span>
            <span className="shrink-0 font-medium">
              {dollars(total)}
              {!shippingKnown || (taxCents === null && checkout.taxAdded && provider === "stripe") ? <span className="font-normal text-muted"> + more</span> : null}
            </span>
          </p>
        </div>
      )}

      {/* Phone, step 1: the piece(s) in small, tap to see them bigger (the full piece view is on the last step). */}
      {checkout && place && rate && step === 1 && (
        <ul className="mt-3 space-y-2 md:hidden" aria-label="Your pieces">
          {items.map((item, index) => (
            <li key={item.key} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewing({ line: index, photo: 0 })}
                className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-md bg-sand"
                aria-label={`See photos of ${item.title}`}
              >
                <ProductImage image={item.image} sizes="56px" />
                <span className="absolute right-0.5 bottom-0.5 grid size-5 place-items-center rounded-full bg-ivory/90 text-ink" aria-hidden="true">
                  <ExpandIcon />
                </span>
              </button>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate text-muted">
                  {item.option ? `${item.option} · ` : ""}Qty {item.qty} · <Price price={item.price * item.qty} compareAt={regularOf(item) !== undefined ? regularOf(item)! * item.qty : undefined} className="gap-1.5" />
                </p>
              </div>
              <button type="button" onClick={() => setViewing({ line: index, photo: 0 })} className="shrink-0 text-sm font-medium text-accent underline underline-offset-4">
                See bigger
              </button>
            </li>
          ))}
        </ul>
      )}

      {testerLink === "invalid" && (
        <p className={`mt-6 rounded-lg bg-sale/10 p-3 text-sm text-sale ${hideUnless(1)}`}>That tester link is out of date. Copy the current one from the admin (Orders → Checkout setup).</p>
      )}
      {checkout?.mode === "test" && (
        <div className={`mt-6 rounded-xl border border-dashed border-zari bg-sand p-4 text-[0.95rem] ${hideUnless(1)}`}>
          <p className="font-medium">Test mode: only you can see this checkout.</p>
          <p className="mt-1 text-ink/80">
            Pay with the test card 4242 4242 4242 4242, any future date and any 3 digits. No real money moves, and your stock and Etsy aren&apos;t changed.
            {checkout.providers.includes("bch") && ` Bitcoin Cash has no test network: a test order asks for ${dollars(checkout.bch?.testCents ?? 25)} of real BCH, paid into the shop's own wallet.`}{" "}
            <a href="/api/tester?off=1" className="underline underline-offset-4">
              Leave test mode
            </a>
          </p>
        </div>
      )}
      {cancelled && onSite && <p className={`mt-6 rounded-lg bg-sand p-3 text-sm ${hideUnless(1)}`}>Payment canceled. Nothing was charged, and your cart is still here.</p>}

      {!onSite && (
        <div className="mt-6 rounded-xl border border-line bg-sand p-5">
          <p className="font-medium">{t("checkoutComingSoonTitle")}</p>
          <p className="mt-1 text-[0.95rem] text-ink/80">
            <Bold text={t("checkoutComingSoonBody")} />
          </p>
        </div>
      )}

      {viewing !== null && (
        <PiecePhotosViewer items={items} photos={photos} start={Math.min(viewing.line, items.length - 1)} startPhoto={viewing.photo} onClose={() => setViewing(null)} />
      )}

      {soldOutLink && <p className={`mt-6 rounded-lg bg-sand p-3 text-sm ${hideUnless(1, 3)}`}>Sorry, {soldOutLink} has just sold out.</p>}
      {/* Gone once the shopper picks a colour themselves. */}
      {colorNote && spotLine?.variantId === colorNote.variantId && <p className={`mt-6 rounded-lg bg-sand p-3 text-sm ${hideUnless(3)}`}>{colorNote.text}</p>}

      {spotLine && spotlight && (
        <div className={hideUnless(3)}>
        <PieceSpotlight
          product={spotlight}
          line={spotLine}
          photos={photosFor(spotLine, photos[spotlight.slug])}
          t={t}
          returnDays={returnDays}
          woven={spotlightWoven}
          onOpen={(photo) => setViewing({ line: 0, photo })}
          onPick={(v) =>
            cart.swap(spotLine.key, {
              productId: spotlight.id,
              variantId: v.id,
              option: variantLabel(v),
              slug: spotlight.slug,
              title: spotlight.title,
              price: variantPrice(spotlight, v),
              image: v.image ?? spotlight.images[0],
              etsyUrl: spotlight.etsyUrl,
              maxQty: v.stock,
            })
          }
        />
        </div>
      )}

      <ul className={`mt-8 divide-y divide-line border-y border-line ${spotLine ? "hidden" : hideUnless(3)}`}>
        {items.map((item, index) => (
          <li key={item.key} className="flex gap-4 py-5">
            <button
              type="button"
              onClick={() => setViewing({ line: index, photo: 0 })}
              className="group relative aspect-[4/5] w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-sand"
              aria-label={`See photos of ${item.title}`}
            >
              <ProductImage image={item.image} sizes="96px" className="transition duration-700 ease-soft group-hover:scale-[1.06]" />
              <span className="absolute right-1.5 bottom-1.5 grid size-7 place-items-center rounded-full bg-ivory/90 text-ink shadow-sm" aria-hidden="true">
                <ExpandIcon />
              </span>
            </button>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <button type="button" onClick={() => setViewing({ line: index, photo: 0 })} className="text-left hover:underline">
                  {item.title}
                </button>
                {item.option && <p className="text-sm text-muted">{item.option}</p>}
                <p className="text-sm text-muted">
                  Qty {item.qty} · <Price price={item.price * item.qty} compareAt={regularOf(item) !== undefined ? regularOf(item)! * item.qty : undefined} className="gap-1.5" />
                </p>
                <button type="button" onClick={() => setViewing({ line: index, photo: 0 })} className="mt-1 text-sm font-medium text-accent underline-offset-4 hover:underline">
                  {photosFor(item, photos[item.slug]).length > 1 ? `See all ${photosFor(item, photos[item.slug]).length} photos` : "See it bigger"}
                </button>
              </div>
              {!onSite && (
                <a
                  href={item.etsyUrl || site.etsyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary h-10 min-h-0 self-start px-4 text-sm sm:self-auto"
                >
                  Buy on Etsy <ExternalIcon size={14} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      {onSite && offer && <FreeGift offer={offer} paid={paidCount} className={`mt-5 ${hideUnless(1, 3)}`} />}

      {!onSite && (
        <div className="mt-6 flex items-center justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
      )}

      {checkout && place && rate && (
        <div className={`mt-8 space-y-8 ${stepped ? "max-md:mt-4 max-md:space-y-4" : ""}`}>
          {expressOn && checkout?.stripe && (
            <div className={`${provider === "stripe" ? "" : "hidden"} ${hideUnless(1)}`}>
            <ExpressPay
              publishableKey={checkout.stripe.publishableKey}
              lines={lines}
              openingCents={subtotalCents - discount}
              coupon={coupon?.code}
              giftNote={giftNote}
              countries={liveCountries}
              title={t("expressTitle")}
              orText={t("expressOr")}
              onAvailable={setWalletsOnPage}
            />
            </div>
          )}

          {(pickup || delivery) && (
            <section className={hideUnless(1)}>
              <h2 className="text-xl">How would you like to get it?</h2>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="How would you like to get it?">
                {(
                  [
                    ["ship", "Ship it", "To your door, anywhere we ship."],
                    ...(pickup ? [["pickup", pickup.label, pickup.cents && !freeShip ? dollars(pickup.cents) : "Free"]] : []),
                    ...(delivery ? [["delivery", delivery.label, `${freeShip ? "Free" : dollars(delivery.cents)} · within ${delivery.miles} miles of ${delivery.from || "our shop"}`]] : []),
                  ] as [Fulfil, string, string][]
                ).map(([value, label, hint]) => (
                  <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${fulfil === value ? "border-ink" : "border-line"}`}>
                    <input
                      type="radio"
                      name="fulfillment"
                      checked={fulfil === value}
                      onChange={() => {
                        setHow(value);
                        setPaypalOrder(null);
                        setPaypalMessage(null);
                        setFieldErrors({});
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{label}</span>
                      <span className="block text-sm text-muted">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {fulfil === "pickup" && pickup && (
                <p className="mt-3 text-sm text-ink/80">{pickup.details?.trim() || "We'll email you when it's ready, with where and when."}</p>
              )}
              {fulfil === "delivery" && delivery?.note?.trim() && <p className="mt-3 text-sm text-ink/80">{delivery.note}</p>}
            </section>
          )}

          {fulfil !== "ship" && (
            <section className={`md:hidden ${step === 2 ? "" : "hidden"}`}>
              <h2 className="text-xl">{fulfil === "pickup" ? "Pickup" : "Delivery"}</h2>
              <p className="mt-2 text-[0.95rem]">
                {fulfil === "pickup" ? pickup?.label : delivery?.label} · {shipping ? dollars(shipping) : "Free"}
              </p>
            </section>
          )}

          {fulfil === "ship" && (
          <section className={hideUnless(1, 2)}>
            <h2 className={`text-xl ${hideUnless(2)}`}>Shipping</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={`block ${hideUnless(1)}`}>
                <span className="mb-1 block text-sm">Ship to</span>
                <select
                  value={placeCode}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setRateId(undefined);
                  }}
                  className="w-full rounded-lg border border-line bg-ivory px-3 py-2.5"
                >
                  {checkout.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {live ? (
                <div className="hidden" />
              ) : place.rates.length > 1 ? (
                <label className={`block ${hideUnless(2)}`}>
                  <span className="mb-1 block text-sm">Delivery</span>
                  <select value={rate.id} onChange={(e) => setRateId(e.target.value)} className="w-full rounded-lg border border-line bg-ivory px-3 py-2.5">
                    {place.rates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} · {shippingCents(r, subtotalCents, itemCount) && !freeShip ? dollars(shippingCents(r, subtotalCents, itemCount)) : "Free"}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className={`self-end pb-2.5 text-[0.95rem] ${hideUnless(2)}`}>
                  {rate.label} · {shipping ? dollars(shipping) : "Free"}
                </div>
              )}
            </div>
            {awayFreeCents !== null && (
              <div className={`mt-3 rounded-lg bg-sand p-3 text-center text-sm ${hideUnless(2)}`}>
                {awayFreeCents > 0 ? <Bold text={t("cartAwayFree", { amount: dollars(awayFreeCents) })} /> : t("cartUnlockedFree")}
                <div className="mx-auto mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-marigold to-accent transition-[width] duration-700 ease-soft"
                    style={{ width: `${Math.min(1, Math.max(0, subtotalCents / freeOverCents)) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {!live && (
            <p className={`mt-2 text-sm text-muted ${hideUnless(2)}`}>
              Arrives in about {rate.minDays}–{rate.maxDays} business days after it ships.
              {rate.multiCents !== null && rate.multiCents !== undefined && rate.multiCents !== rate.cents && shipping > 0 && ` Shipping is ${dollars(rate.cents)} for one item, ${dollars(rate.multiCents)} for two or more.`}
            </p>
            )}
            {placeCode === "IN" && (
              <p className={`mt-3 rounded-lg bg-sand p-3 text-sm leading-relaxed ${hideUnless(2)}`}>
                {t("checkoutIndiaNote")}
              </p>
            )}
          </section>
          )}

          {checkout.providers.length > 1 && (
            <section className={hideUnless(3)}>
              <h2 className="text-xl">Pay with</h2>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Pay with">
                {checkout.providers.map((p) => (
                  <label key={p} className={`flex cursor-pointer items-start gap-3 rounded-xl border ${provider === p ? "border-ink p-4" : "border-line px-4 py-2.5"}`}>
                    <input
                      type="radio"
                      name="provider"
                      checked={provider === p}
                      onChange={() => {
                        setProvider(p);
                        setPaypalOrder(null);
                        setPaypalMessage(null);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">
                        {p === "stripe"
                          ? walletsOnPage && placeCode !== "IN"
                            ? t("payStripeCardLabel")
                            : `Card, Apple Pay or Google Pay${placeCode === "IN" ? ", or UPI" : ""}`
                          : p === "paypal"
                            ? "PayPal"
                            : p === "exodus"
                              ? "Exodus Pay or another crypto wallet"
                              : p === "bch"
                                ? "Bitcoin Cash"
                                : p === "venmo"
                                  ? "Venmo"
                                  : "Zelle"}
                      </span>
                      {provider === p && (
                      <span className="block text-sm text-muted">
                        {p === "stripe"
                          ? placeCode === "IN"
                            ? t("payStripeDescIndia")
                            : t("payStripeDesc")
                          : p === "paypal"
                            ? t("payPaypalDesc")
                            : p === "exodus"
                              ? t("payExodusDesc", { coins: checkout.exodusCoins || "USDC or USDT" })
                              : p === "bch"
                                ? wcProjectId
                                  ? t("payBchDescWallet")
                                  : t("payBchDescQr")
                                : p === "venmo"
                                  ? t("payVenmoDesc", { hours: checkout.venmo?.holdHours ?? 48 })
                                  : t("payZelleDesc", { hours: checkout.zelle?.holdHours ?? 48 })}
                      </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {needsForm && (
            <section className={hideUnless(1)}>
              <h2 className={`text-xl ${stepped ? "max-md:hidden" : ""}`}>Your details</h2>
              <p className={`mt-1 text-sm text-muted ${stepped ? "max-md:hidden" : ""}`}>
                {fulfil === "pickup" ? "So we can tell you when it's ready, and send your receipt." : fulfil === "delivery" ? "Where we bring it, and how to send your receipt." : "Where we ship it, and how to send your receipt."}
              </p>
              <fieldset disabled={Boolean(paypalOrder)} className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 disabled:opacity-60 md:gap-3 max-md:mt-0">
                {field("name", "Full name", { autoComplete: "name" })}
                {field("email", "Email", { type: "email", autoComplete: "email" })}
                {field("phone", "Phone", { type: "tel", autoComplete: "tel" }, true, t("checkoutPhoneHelp"))}
                {fulfil !== "pickup" && (
                  <>
                    <div className="hidden sm:block" aria-hidden="true" />
                    {field("line1", "Address", { autoComplete: "address-line1" })}
                    {field("line2", "Apt, suite (optional)", { autoComplete: "address-line2" }, false)}
                    {field("city", "City", { autoComplete: "address-level2" }, false)}
                    {field("state", placeCode === "US" ? "State" : "State / region", { autoComplete: "address-level1", placeholder: placeCode === "US" ? "IL" : undefined }, false)}
                    {field("postal_code", placeCode === "US" ? "ZIP code" : placeCode === "IN" ? "PIN code" : "Postal code", { autoComplete: "postal-code", inputMode: placeCode === "US" || placeCode === "IN" ? "numeric" : undefined }, false)}
                    {fulfil === "delivery" && zip5 && (
                      <p className={`col-span-2 text-sm ${zipAnswer?.ok === true ? "text-ink" : zipAnswer ? "text-sale" : "text-muted"}`} role="status">
                        {!zipAnswer
                          ? "Checking your ZIP…"
                          : zipAnswer.ok === true
                            ? `✓ We deliver to ${zip5}`
                            : zipAnswer.ok === false
                              ? `Sorry, we only deliver within ${delivery?.miles ?? ""} miles of ${delivery?.from || "our shop"}.`
                              : (
                                <>
                                  Couldn&apos;t check your ZIP right now.{" "}
                                  <button type="button" className="underline" onClick={() => { setZipCheck(null); setZipRetry((n) => n + 1); }}>Try again</button>
                                </>
                              )}
                      </p>
                    )}
                  </>
                )}
              </fieldset>
            </section>
          )}

          {needsForm && live && !paypalOrder && (
            <section className={hideUnless(2)}>
                {live && !paypalOrder && (
                  <div>
                    {!activeQuote && !quoteBusy && <p className="mb-2 text-sm text-muted">{!phoneOk && addressReadyNoPhone ? t("checkoutPhoneHint") : t("shipOptionsHint")}</p>}
                    {quoteBusy && (
                      <p role="status" aria-live="polite" className="mb-2 flex items-center gap-2 text-sm">
                        <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                        {t("shipFinding")}
                      </p>
                    )}
                    {!activeQuote && (
                      <button type="button" onClick={showShippingOptions} disabled={quoteBusy} className="btn btn-primary w-full">
                        {t("shipShowOptions")}
                      </button>
                    )}
                    {quoteError && failedKey === askKey && !quoteBusy && (
                      <p role="alert" className="mt-3 rounded-lg bg-sale/10 p-3 text-sm text-sale">
                        {quoteError}
                      </p>
                    )}
                    {activeQuote && chosenRate && (
                      <div ref={optionsRef}>
                        <h3 className="text-lg">{t("shipOptionsChoose")}</h3>
                        <div className="mt-2 grid gap-2" role="radiogroup" aria-label={t("shipOptionsChoose")}>
                          {(moreRates ? activeQuote.rates : [chosenRate]).map((r) => (
                            <label key={r.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-4 ${chosenRate.id === r.id ? "border-ink" : "border-line"}`}>
                              <input
                                type="radio"
                                name="shipping-option"
                                checked={chosenRate.id === r.id}
                                onChange={() => {
                                  setQuoteRateId(r.id);
                                  setMoreRates(false);
                                }}
                              />
                              <span className="block font-medium">
                                {r.label} — {freeShip || r.cents === 0 ? "Free" : dollars(r.cents)}
                                {daysText(r) && <span className="font-normal text-muted"> · {t("shipDays", { days: daysText(r) })}</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                        {activeQuote.rates.length > 1 && (
                          <button
                            type="button"
                            aria-expanded={moreRates}
                            onClick={() => setMoreRates((v) => !v)}
                            className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-medium text-accent underline underline-offset-4"
                          >
                            {moreRates ? t("shipFewerOptions") : t("shipMoreOptions")}
                            <span aria-hidden="true" className={`inline-block transition-transform ${moreRates ? "rotate-180" : ""}`}>▾</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </section>
          )}

          {provider === "bch" && checkout.bch?.receipts && (
            <section className={hideUnless(3)}>
              <h2 className="text-xl">Your receipt</h2>
              <p className="mt-1 text-sm text-muted">
                Get it as an <span className="font-medium text-ink">Om Receipt</span>: a CashToken in your own wallet, one of a kind and numbered by your order. Shipping updates still come by email.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Your receipt">
                {(
                  [
                    ["email", "Email", "To your inbox"],
                    ["token", "CashToken", "To your wallet"],
                    ["both", "Both", "Inbox and wallet"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={value} className={`receipt-choice ${receipt === value ? "on" : ""}`}>
                    <input type="radio" name="receipt" className="sr-only" checked={receipt === value} onChange={() => setReceipt(value)} />
                    <span className={`receipt-choice-mark ${value}`} aria-hidden="true" />
                    <span className="block font-medium">{label}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {needsForm && fulfil !== "pickup" && (
            <fieldset disabled={Boolean(paypalOrder)} className={`disabled:opacity-60 ${hideUnless(3)}`}>
                <label className="block">
                  <span className="mb-1 block text-sm">{t("giftNoteLabel")}</span>
                  <textarea
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value.slice(0, 255))}
                    rows={2}
                    placeholder={t("giftNotePlaceholder")}
                    className="w-full rounded-lg border border-line bg-ivory px-3 py-2.5"
                  />
                </label>
            </fieldset>
          )}

          <section className={hideUnless(3)}>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 border-t border-line pt-4 text-[0.95rem]">
              <dt className="text-muted">Items</dt>
              <dd className="text-right">{dollars(subtotalCents)}</dd>
              {gift && (
                <>
                  <dt className="text-muted">Free gift{gift.option ? ` · ${gift.option}` : ""}</dt>
                  <dd className="text-right text-accent">Free</dd>
                </>
              )}
              {coupon && (
                <>
                  <dt className="text-muted">
                    Coupon {coupon.code}
                    {coupon.text && ` (${coupon.text})`}{" "}
                    {!paypalOrder && (
                      <button type="button" onClick={() => setCoupon(null)} className="underline underline-offset-4">
                        Remove
                      </button>
                    )}
                  </dt>
                  <dd className="text-right">−{dollars(discount)}</dd>
                </>
              )}
              <dt className="text-muted">{fulfil === "pickup" ? "Pickup" : fulfil === "delivery" ? "Delivery" : "Shipping"}</dt>
              <dd className="text-right">{live && !chosenRate ? <span className="text-muted">{t("shipPickFirst")}</span> : shipping ? dollars(shipping) : "Free"}</dd>
              {(!live || showTax || taxCents === null) && placeCode === "US" && fulfil === "ship" && (
                <>
                  <dt className="text-muted">Estimated tax</dt>
                  <dd className="text-right">{taxCents !== null ? dollars(taxCents) : <span className="text-muted">{live && chosenRate ? "Added at payment" : t("checkoutTaxPending")}</span>}</dd>
                </>
              )}
              <dt className="text-lg font-medium">Total</dt>
              <dd className="text-right text-lg font-medium">{dollars(total)}</dd>
            </dl>
            {couponsOn && !coupon && !paypalOrder && (
              <div className="mt-2 text-sm">
                {couponOpen ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void applyCoupon();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.slice(0, 30))}
                      aria-label="Coupon code"
                      aria-invalid={Boolean(couponError)}
                      autoCapitalize="characters"
                      autoComplete="off"
                      className={`min-w-0 flex-1 rounded-lg border bg-ivory px-3 py-2 ${couponError ? "border-sale" : "border-line"}`}
                    />
                    <button type="submit" disabled={couponBusy || !couponInput.trim()} className="btn btn-primary h-10 min-h-0 px-4 text-sm">
                      {couponBusy ? "Checking…" : "Apply"}
                    </button>
                  </form>
                ) : (
                  <button type="button" onClick={() => setCouponOpen(true)} className="text-muted underline underline-offset-4">
                    Have a coupon code?
                  </button>
                )}
                {couponError && <p className="mt-1 text-sale">{couponError}</p>}
              </div>
            )}
            {checkout.taxAdded && provider === "stripe" && taxCents === null && <p className="mt-1 text-sm text-muted">Sales tax, where it applies, is added on the payment page.</p>}
            {provider === "stripe" && fulfil === "ship" && !live && <p className="mt-1 text-sm text-muted">{t("giftStripeNote")}</p>}

            {checkout.mode === "test" && provider === "stripe" && placeCode === "IN" && (
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={testAsIndia} onChange={(e) => setTestAsIndia(e.target.checked)} />
                Test as a shopper in India (shows rupees and UPI on Stripe&apos;s page)
              </label>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-sale/10 p-3 text-sm text-sale">
                {error}
              </p>
            )}
            {provider === "paypal" && paypalOrder && checkout.paypal ? (
              <>
                <PayPalButtons token={paypalOrder} clientId={checkout.paypal.clientId} sdkUrl={checkout.paypal.sdkUrl} onMessage={onPayPalMessage} />
                {paypalMessage && <p className="mt-3 text-center text-sm">{paypalMessage}</p>}
                <button type="button" onClick={() => setPaypalOrder(null)} className="mt-3 w-full text-sm text-muted underline underline-offset-4">
                  {fulfil === "pickup" ? "Change your details or cart" : "Change the address or cart"}
                </button>
              </>
            ) : (
              <button type="button" onClick={startCheckout} disabled={loading || deliveryBlocked || (live && !chosenRate)} className={`btn btn-primary mt-6 w-full ${stepped ? "max-md:hidden" : ""}`}>
                {payLabel}
              </button>
            )}
            {returnsLine && <p className={`mt-3 text-center text-sm text-muted ${stepped ? "max-md:hidden" : ""}`}>{returnsLine}</p>}
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-muted">
              <ShieldIcon size={16} />{" "}
              {provider === "exodus"
                ? t("checkoutNoteExodus")
                : provider === "bch"
                  ? t("checkoutNoteBch")
                : provider === "paypal"
                  ? t("checkoutNotePaypal")
                  : provider === "zelle"
                    ? t("checkoutNoteZelle")
                    : provider === "venmo"
                      ? t("checkoutNoteVenmo")
                      : t("checkoutNoteStripe")}
            </p>
            <p className="mt-1 text-center text-sm text-muted">
              <Link href="/policies/returns" className="underline underline-offset-4">
                {placeCode === "US" ? t("checkoutReturnsUS", { days: returnDays }) : `${t("finalSaleNote")} (no returns)`}
              </Link>{" "}
              ·{" "}
              <Link href="/policies/shipping" className="underline underline-offset-4">
                Shipping
              </Link>
            </p>
          </section>
        </div>
      )}

      <div className={`mt-8 flex justify-between text-sm ${hideUnless(3)}`}>
        <Link href="/shop" className="underline underline-offset-4">
          Continue shopping
        </Link>
        <button type="button" onClick={() => cart.clear()} className="text-muted underline underline-offset-4">
          Clear cart
        </button>
      </div>

      {/* Phone: Back / Next (Pay on the last step) fixed at the bottom of every step. */}
      {checkout && place && rate && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          {step === 3 && returnsLine && !paypalOrder && <p className="mb-2 text-center text-xs text-muted">{returnsLine}</p>}
          {step === 2 && nextBlocked && <p className="mb-2 text-center text-xs text-muted">{quoteBusy ? t("shipFinding") : t("shipPickFirst")}</p>}
          {Object.keys(fieldErrors).length > 0 && step === 1 && <p role="alert" className="mb-2 text-center text-xs text-sale">Please fix the highlighted fields.</p>}
          <div className="flex gap-3">
            {step > 1 && (
              <button type="button" onClick={() => goTo((step - 1) as 1 | 2)} className="btn btn-outline h-14 flex-1 text-base">
                Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={goNext} disabled={nextBlocked} className="btn btn-primary h-14 flex-[2] text-base">
                Next
              </button>
            ) : (
              !paypalOrder && (
                <button type="button" onClick={startCheckout} disabled={loading || deliveryBlocked || (live && !chosenRate)} className="btn btn-primary h-14 flex-[2] text-base">
                  {payLabel}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
