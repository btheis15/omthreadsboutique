"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { post, saveKey } from "./shared";

type Confirmed = { kind: "email" | "address" | "signin"; key?: string };

/** Where our emails' links land (#token=…): confirms the email or a new address, or signs the partner in. */
export function PartnerConfirm() {
  const router = useRouter();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const started = useRef(false);
  useEffect(() => {
    // Once only (the link works once).
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    // The token is used once; it's taken out of the address bar so it isn't shared or bookmarked.
    history.replaceState(null, "", window.location.pathname);
    const asked = token ? post<Confirmed>("/api/partners/confirm", { token }) : Promise.resolve({ ok: false as const, error: "This link is missing its code. Open it straight from the email.", status: 400 });
    asked.then((r) => {
      if (!r.ok) return setResult({ ok: false, text: r.error });
      if (r.data.kind === "signin" && r.data.key) {
        saveKey(r.data.key);
        return router.replace(`/partners/me#key=${r.data.key}`);
      }
      setResult({ ok: true, text: r.data.kind === "address" ? "Your new payout address is saved. Payouts to it start in a few days." : "Your email is confirmed. Thank you!" });
    });
  }, [router]);

  return (
    <div className="rounded-2xl border border-line bg-white p-8 text-center" role="status">
      {result ? (
        <>
          <p className="font-display text-3xl">{result.ok ? "Done" : "That didn't work"}</p>
          <p className="mt-2 text-muted">{result.text}</p>
          <p className="mt-6">
            <Link href={result.ok ? "/partners/me" : "/partners"} className="btn btn-primary">
              {result.ok ? "Go to my seller page" : "Sell for Om Threads"}
            </Link>
          </p>
        </>
      ) : (
        <p className="text-muted">Checking your link…</p>
      )}
    </div>
  );
}
