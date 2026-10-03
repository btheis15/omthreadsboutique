/** What the partner pages share: calling this site's /api/partners routes, money, and the page key on this device. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; errors?: Record<string, string>; status: number };

export async function post<T>(path: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as (T & { error?: string; errors?: Record<string, string> }) | null;
  if (res?.ok && data) return { ok: true, data };
  return { ok: false, error: data?.error ?? "Something went wrong. Please try again.", errors: data?.errors, status: res?.status ?? 0 };
}

export const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
export const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** The page key is kept on this device too, so /partners/me opens without the link (cleared by "Sign out"). */
const KEY = "omthreads-partner-key";
/** The partner's own code on this device, so product pages offer them their link for that piece. */
const CODE = "omthreads-partner-code";
const codeListeners = new Set<() => void>();
export const savedCode = () => {
  try {
    return localStorage.getItem(CODE);
  } catch {
    return null;
  }
};
export const saveCode = (code: string | null) => {
  try {
    if (code) localStorage.setItem(CODE, code);
    else localStorage.removeItem(CODE);
  } catch {
    /* private browsing */
  }
  codeListeners.forEach((fn) => fn());
};
/** For useSyncExternalStore: this tab's changes, and other tabs' (the storage event). */
export const subscribeCode = (fn: () => void) => {
  codeListeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    codeListeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
};
export const savedKey = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const saveKey = (key: string | null) => {
  try {
    if (key) localStorage.setItem(KEY, key);
    else localStorage.removeItem(KEY);
  } catch {
    /* private browsing: the link still works */
  }
};

export type Partner = { code: string; name: string; link: string; address: string; pendingAddress: string | null; email: string | null; emailConfirmed: boolean; ratePercent: number; status: string; country: string | null; usPerson: boolean | null; mailingAddress: string | null; termsVersion: string | null; termsAcceptedAt: string | null };
export type Commission = { id: string; order: string | null; at: string; test: boolean; ratePercent: number; baseCents: number; cents: number; state: "holding" | "sending" | "sent" | "cancelled" | "test"; how: "split" | "wallet"; waiting: string | null; bch: string | null; txUrl: string | null; note: string | null };
/** A piece to share (from the catalog): its page, title and first photo. */
export type SharePiece = { slug: string; title: string; image: { url: string; alt: string } | null; soldOut: boolean };
export type PartnerPageData = { partner: Partner; totals: { sales: number; paidCents: number; owedCents: number; paidThisYearCents: number }; limit: { limitCents: number; earnedCents: number; leftCents: number; reached: boolean } | null; owedBackCents: number; commissions: Commission[]; todo: string[] };

export const field = "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-ink";
