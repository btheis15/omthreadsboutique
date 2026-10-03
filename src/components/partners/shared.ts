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

export type Partner = { code: string; name: string; link: string; address: string; pendingAddress: string | null; email: string | null; emailConfirmed: boolean; ratePercent: number; status: string; holdDays: number };
export type Commission = { id: string; order: string | null; at: string; test: boolean; ratePercent: number; baseCents: number; cents: number; state: "holding" | "sending" | "sent" | "cancelled" | "test"; dueAt: string; waiting: string | null; bch: string | null; txUrl: string | null; note: string | null };
export type PartnerPageData = { partner: Partner; totals: { sales: number; paidCents: number; owedCents: number; paidThisYearCents: number }; commissions: Commission[]; todo: string[] };

export const field = "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-ink";
