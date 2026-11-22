/**
 * Meta Pixel event helper. Safe everywhere: does nothing when there is no pixel (no pixel id set, ad blocker,
 * Do Not Track / Global Privacy Control, server render). Other features just call `track` / `trackCustom`.
 *
 * The pixel script loads after the page is interactive (see components/MetaPixel.tsx), so an event fired
 * before that (e.g. ViewContent on first paint) waits in a small queue and is sent once the pixel is ready.
 * When the visitor has opted out, or there is no pixel, the queue is dropped and later events are ignored.
 */
type Params = Record<string, unknown>;
type Fbq = (...a: unknown[]) => void;
type W = { fbq?: Fbq; __omq?: unknown[][]; __omPixelOff?: boolean };

const QUEUE_MAX = 50;

function send(args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  try {
    if (w.fbq) w.fbq(...args);
    else if (!w.__omPixelOff) {
      const q = (w.__omq ??= []);
      if (q.length < QUEUE_MAX) q.push(args);
    }
  } catch {
    /* tracking must never break the page */
  }
}

export function track(event: string, params?: Params, eventId?: string): void {
  send(["track", event, params ?? {}, eventId ? { eventID: eventId } : undefined]);
}

export function trackCustom(event: string, params?: Params): void {
  send(["trackCustom", event, params ?? {}]);
}

/** Called by the loader once it knows there will be no pixel: forgets anything queued and ignores later events. */
export function pixelOff(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  w.__omPixelOff = true;
  w.__omq = [];
}

/** Called by the loader once `window.fbq` exists: sends what was waiting. */
export function flushQueued(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  const q = w.__omq ?? [];
  w.__omq = [];
  for (const args of q) {
    try {
      w.fbq?.(...args);
    } catch {
      /* ignore */
    }
  }
}
