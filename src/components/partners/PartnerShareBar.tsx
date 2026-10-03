"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { savedCode, subscribeCode } from "./shared";

/** On a product page, for a partner signed in on this device: their link for this piece, to copy or share. */
export function PartnerShareBar({ title }: { title: string }) {
  const code = useSyncExternalStore(subscribeCode, savedCode, () => null);
  const path = usePathname();
  const [done, setDone] = useState("");
  if (!code) return null;
  const url = `${window.location.origin}${path}?s=${code}`;
  const flash = (t: string) => {
    setDone(t);
    setTimeout(() => setDone(""), 1800);
  };
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-zari-light bg-ivory p-3 text-sm">
      <span className="mr-auto">
        <span className="font-medium">Selling this piece?</span> <span className="text-muted">Your link earns you a commission.</span>
      </span>
      <button
        type="button"
        className="btn btn-outline"
        onClick={async () => {
          await navigator.clipboard?.writeText(url).catch(() => {});
          flash("Copied");
        }}
      >
        {done || "Copy my link"}
      </button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button type="button" className="btn btn-primary" onClick={() => navigator.share({ title: `${title} · Om Threads`, url }).catch(() => {})}>
          Share
        </button>
      )}
    </div>
  );
}
