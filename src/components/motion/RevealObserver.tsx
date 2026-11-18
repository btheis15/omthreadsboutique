"use client";

import { useEffect } from "react";

/**
 * Adds `is-visible` to every `[data-reveal]` element as it scrolls into view.
 * One observer serves the whole site; new elements (after navigation) are
 * picked up by a MutationObserver. Styles live in globals.css.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const scan = (root: ParentNode) =>
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((el) => {
        if (reduce) el.classList.add("is-visible");
        else io.observe(el);
      });
    scan(document);
    // A page opened by a click: what's on its first screen arrives with the page transition (shown at once),
    // rather than animating a second time on top of it. Further down still reveals on scroll.
    const firstScreen = (el: Element) => el.getBoundingClientRect().top + window.scrollY < window.innerHeight * 0.92;
    const added = (el: Element) => {
      if (reduce) el.classList.add("is-visible");
      else if (firstScreen(el)) el.classList.add("is-visible", "reveal-now");
      else io.observe(el);
    };
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.matches("[data-reveal]:not(.is-visible)")) added(n);
            n.querySelectorAll("[data-reveal]:not(.is-visible)").forEach(added);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
