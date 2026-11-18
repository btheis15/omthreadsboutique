"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * A tap on a link to another page answers at once: the page dims a little (html[data-navigating], globals.css)
 * while the next page loads, then the page transition takes over. Cleared when the new page is in, on
 * Back/Forward, and after a few seconds whatever happens.
 */
export function NavFeedback() {
  const pathname = usePathname();

  useEffect(() => {
    delete document.documentElement.dataset.navigating;
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      clearTimeout(timer);
      delete document.documentElement.dataset.navigating;
    };
    const onClick = (e: MouseEvent) => {
      // Next.js links cancel the browser's own navigation, so defaultPrevented doesn't mean "not a page change" here.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (/^\/(api|media|bcmr)\//.test(url.pathname)) return;
      document.documentElement.dataset.navigating = "";
      clearTimeout(timer);
      timer = setTimeout(clear, 4000);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", clear);
    window.addEventListener("pageshow", clear);
    return () => {
      clear();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", clear);
      window.removeEventListener("pageshow", clear);
    };
  }, []);

  return null;
}
