/**
 * Where a shopper came from, kept in their own browser, and what the checkout forwards to the shop so a paid
 * order can be matched to the ad that brought it (Meta Conversions API) and reported by campaign.
 *
 *  - `om_attr` (localStorage): the first visit that carried an ad click (`fbclid`) or `utm_*` tags, kept 30 days.
 *    Plain visits store nothing, so an ordinary first visit never blocks a later ad click from being recorded.
 *  - Do Not Track / Global Privacy Control: no `fbp`/`fbc`/`fbclid` is forwarded (the pixel isn't loaded either).
 *  - Nothing here may ever block or fail a checkout: every read is guarded.
 */
const KEY = "om_attr";
const EID_KEY = "om_eid";
const PURCHASED_KEY = "om_purchased";
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type Attribution = Partial<Record<(typeof UTM)[number] | "fbclid" | "landing", string>>;
type Stored = Attribution & { ts: number; /** the latest ad click, for building `_fbc` */ fc?: { id: string; ts: number } };

/** True when the browser asks not to be tracked (Do Not Track or Global Privacy Control). */
export function optedOut(): boolean {
  if (typeof window === "undefined") return false;
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const w = window as unknown as { doNotTrack?: string };
  return n.globalPrivacyControl === true || n.doNotTrack === "1" || w.doNotTrack === "1" || n.msDoNotTrack === "1";
}

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!s || typeof s.ts !== "number" || Date.now() - s.ts > THIRTY_DAYS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

/** Records an ad click / campaign tags found in the address bar (first touch kept for 30 days). Safe to call on every page. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Attribution = {};
    for (const k of [...UTM, "fbclid"] as const) {
      const v = params.get(k)?.trim().slice(0, 200);
      if (v) found[k] = v;
    }
    if (!Object.keys(found).length) return;
    const now = Date.now();
    const existing = readStored();
    if (!existing) {
      const next: Stored = { ...found, landing: window.location.pathname.slice(0, 200), ts: now, fc: found.fbclid ? { id: found.fbclid, ts: now } : undefined };
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } else if (found.fbclid && found.fbclid !== existing.fc?.id) {
      window.localStorage.setItem(KEY, JSON.stringify({ ...existing, fc: { id: found.fbclid, ts: now } }));
    }
  } catch {
    /* storage unavailable (private mode): attribution is simply not kept */
  }
}

/** True once an ad click or campaign tag has been recorded for this browser. */
export function hasAttribution(): boolean {
  return typeof window !== "undefined" && readStored() !== null;
}

/** The first-touch attribution as the checkout sends it (undefined when there is none). */
export function getAttribution(): Attribution | undefined {
  if (typeof window === "undefined") return undefined;
  const s = readStored();
  if (!s) return undefined;
  const out: Attribution = {};
  for (const k of [...UTM, "landing"] as const) if (s[k]) out[k] = s[k];
  if (s.fbclid && !optedOut()) out.fbclid = s.fbclid;
  return Object.keys(out).length ? out : undefined;
}

function cookie(name: string): string | undefined {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return undefined;
  }
}

function uuid(): string {
  const c = (typeof crypto !== "undefined" ? crypto : undefined) as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export type CheckoutMeta = {
  eventId: string;
  fbp?: string;
  fbc?: string;
  sourceUrl: string;
  userAgent: string;
  attribution?: Attribution;
  /** The browser asked not to be tracked (Do Not Track / Global Privacy Control). */
  optOut?: true;
};

/**
 * What a checkout request carries (contract: `meta`). A fresh `eventId` is made for this attempt and remembered,
 * so the browser's Purchase event on the thank-you page can reuse it (Meta then counts the sale once).
 * Never throws.
 */
export function checkoutMeta(): CheckoutMeta | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const eventId = uuid();
    try {
      window.localStorage.setItem(EID_KEY, JSON.stringify({ id: eventId, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    const out = optedOut();
    let fbc = out ? undefined : cookie("_fbc");
    if (!out && !fbc) {
      const fc = readStored()?.fc;
      if (fc) fbc = `fb.1.${fc.ts}.${fc.id}`;
    }
    return {
      eventId,
      fbp: out ? undefined : cookie("_fbp"),
      fbc,
      sourceUrl: window.location.origin + window.location.pathname,
      userAgent: navigator.userAgent,
      attribution: getAttribution(),
      optOut: out ? true : undefined,
    };
  } catch {
    return undefined;
  }
}

/** The event id of this browser's latest checkout attempt (kept a week), for the Purchase event on the thank-you page. */
export function lastCheckoutEventId(): string | undefined {
  try {
    const s = JSON.parse(window.localStorage.getItem(EID_KEY) ?? "null") as { id?: string; ts?: number } | null;
    if (s?.id && typeof s.ts === "number" && Date.now() - s.ts < 7 * 24 * 3600 * 1000) return s.id;
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Remembers that this order's Purchase was already sent from this browser (a reload doesn't send it again). Returns false if it was. */
export function markPurchaseSent(orderKey: string): boolean {
  try {
    const seen = JSON.parse(window.localStorage.getItem(PURCHASED_KEY) ?? "[]") as string[];
    if (seen.includes(orderKey)) return false;
    window.localStorage.setItem(PURCHASED_KEY, JSON.stringify([...seen, orderKey].slice(-20)));
  } catch {
    /* storage unavailable: send anyway; Meta de-duplicates on the event id */
  }
  return true;
}
