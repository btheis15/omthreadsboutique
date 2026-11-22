/**
 * Meta Pixel event helper. Safe everywhere: does nothing until the pixel is loaded (no pixel id set, ad blocker,
 * server render). The `meta-pixel` work fills in the real calls; other features just call these.
 */
type Params = Record<string, unknown>;

export function track(event: string, params?: Params, eventId?: string): void {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  fbq?.("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

export function trackCustom(event: string, params?: Params): void {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  fbq?.("trackCustom", event, params ?? {});
}
