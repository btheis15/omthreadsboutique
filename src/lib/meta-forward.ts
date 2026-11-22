/**
 * Server side of the Meta ads link: turns the browser's `meta` block into what the shop's /api/checkout accepts
 * (contract 3). Everything is validated and size-limited, the `_fbp` / `_fbc` cookies win over what the browser
 * said, and nothing here can ever throw or fail a checkout (a problem just means no `meta`).
 */
import "server-only";

type CookieJar = { get(name: string): { value: string } | undefined };
export type ForwardedMeta = {
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
  userAgent?: string;
  eventId?: string;
  attribution?: Record<string, string>;
  /** Do Not Track / Global Privacy Control was on: the shop should not send this order to Meta. */
  optOut?: true;
};

const ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "landing"] as const;
// Meta's formats: fb.<subdomain index>.<creation time ms>.<id>
const FBP = /^fb\.\d\.\d{10,13}\.\d{1,20}$/;
const FBC = /^fb\.\d\.\d{10,13}\.[\w-]{1,500}$/;
const EVENT_ID = /^[\w-]{8,64}$/;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const decode = (v: string | undefined) => {
  if (!v) return "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export function metaForOrder(request: Request, raw: unknown, jar: CookieJar): ForwardedMeta | undefined {
  try {
    const b = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const optOut = b.optOut === true;
    const out: ForwardedMeta = {};

    const fbp = optOut ? "" : decode(jar.get("_fbp")?.value) || str(b.fbp, 80);
    if (FBP.test(fbp)) out.fbp = fbp;
    const fbc = optOut ? "" : decode(jar.get("_fbc")?.value) || str(b.fbc, 560);
    if (FBC.test(fbc)) out.fbc = fbc;

    const eventId = str(b.eventId, 64);
    if (EVENT_ID.test(eventId)) out.eventId = eventId;

    // Where the order was placed: the page the browser said, else the referring page; origin + path only.
    for (const candidate of [str(b.sourceUrl, 500), request.headers.get("referer") ?? ""]) {
      try {
        const u = new URL(candidate);
        if (u.protocol === "https:" || u.protocol === "http:") {
          out.sourceUrl = (u.origin + u.pathname).slice(0, 300);
          break;
        }
      } catch {
        /* try the next one */
      }
    }

    const ua = str(request.headers.get("user-agent"), 400) || str(b.userAgent, 400);
    if (ua) out.userAgent = ua;

    const a = b.attribution && typeof b.attribution === "object" ? (b.attribution as Record<string, unknown>) : {};
    const attribution: Record<string, string> = {};
    for (const k of ATTR_KEYS) {
      if (optOut && k === "fbclid") continue;
      const v = str(a[k], 200);
      if (v) attribution[k] = v;
    }
    if (Object.keys(attribution).length) out.attribution = attribution;

    if (optOut) out.optOut = true;
    return out;
  } catch {
    return undefined;
  }
}
