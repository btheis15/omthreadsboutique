"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Set once an ad click is seen, so the rest of the visit (other pages, back and forth) stays in ad mode. */
const SESSION_KEY = "om_ad";
/** First-touch attribution kept 30 days by the tracking code (src/lib/track.ts's owner); its presence means "came from an ad". */
const ATTRIBUTION_KEY = "om_attr";

const fromUrl = () => {
  for (const k of new URLSearchParams(window.location.search).keys()) if (k === "fbclid" || k.startsWith("utm_")) return true;
  return false;
};

const detect = () => {
  try {
    return fromUrl() || sessionStorage.getItem(SESSION_KEY) === "1" || localStorage.getItem(ATTRIBUTION_KEY) !== null;
  } catch {
    // Storage blocked (private mode, in-app browser): the page address alone still counts.
    return fromUrl();
  }
};

const never = () => () => {};

/**
 * True when the visitor arrived from an ad: the address has `fbclid` or a `utm_*` tag, or this visit (or the last
 * 30 days, via `om_attr`) already did. False on the server and during hydration, so the page is the same HTML for
 * everyone and only changes once the page is up. Pass `force` on a page that is only ever reached from an ad.
 */
export function useAdMode(force = false): boolean {
  const seen = useSyncExternalStore(never, detect, () => false);
  const on = force || seen;
  useEffect(() => {
    if (!on) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  }, [on]);
  return on;
}
