"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureAttribution, optedOut } from "@/lib/attribution";
import { flushQueued, pixelOff } from "@/lib/track";

type Fbq = ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string };

function loadPixel(id: string) {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const n: Fbq = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue!.push(args);
  };
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  w.fbq = n;
  if (!w._fbq) w._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  n("init", id);
  n("track", "PageView");
  flushQueued();
}

/**
 * Loads the Meta Pixel once the page is interactive and the browser is idle (never blocks the first paint), and
 * sends PageView on every page change. Loads nothing when the owner hasn't set a pixel id, or when the visitor's
 * browser says Do Not Track / Global Privacy Control. Also notes an ad click's tags for order attribution.
 */
export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    captureAttribution();
  }, [pathname]);

  useEffect(() => {
    if (!pixelId || !/^\d{5,20}$/.test(pixelId) || optedOut()) {
      pixelOff();
      return;
    }
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
    let cancelled = false;
    const start = () => {
      if (!cancelled) loadPixel(pixelId);
    };
    if (w.requestIdleCallback) {
      const h = w.requestIdleCallback(start, { timeout: 4000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(h);
      };
    }
    const t = setTimeout(start, 2000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pixelId]);

  // A page change after the first one (the first PageView is sent when the pixel loads).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    (window as unknown as { fbq?: Fbq }).fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
