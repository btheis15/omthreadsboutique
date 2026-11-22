"use client";

import { useAdMode } from "./useAdMode";

/** On a campaign page: remembers for the rest of the visit that the shopper came from an ad. Renders nothing. */
export function AdModeFlag() {
  useAdMode(true);
  return null;
}
