"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "./CopyButton";
import { ProductImage } from "@/components/ProductImage";
import { type Commission, day, field, post, type PartnerPageData, saveCode, savedKey, saveKey, type SharePiece, usd } from "./shared";

const STATE: Record<Commission["state"], [string, string]> = {
  holding: ["Sending soon", "bg-zari-light/40"],
  sending: ["Sending", "bg-zari-light/40"],
  sent: ["Paid", "bg-peacock/15 text-peacock"],
  cancelled: ["Cancelled", "bg-line"],
  test: ["Test", "bg-line"],
};

/** The partner's own page, opened with their key (#key=… from their link, or kept on this device). */
export function PartnerPage({ pieces }: { pieces: SharePiece[] }) {
  const router = useRouter();
  const [key, setKey] = useState<string | null>(null);
  const [data, setData] = useState<PartnerPageData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (k: string) => {
    const r = await post<PartnerPageData>("/api/partners/me", { key: k });
    if (r.ok) {
      setData(r.data);
      // Product pages on this device offer them their link for each piece.
      saveCode(r.data.partner.code);
      setError("");
    } else {
      if (r.status === 401) {
        saveKey(null);
        saveCode(null);
      }
      setError(r.error);
    }
  }, []);

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.hash.slice(1)).get("key");
    if (fromLink) {
      saveKey(fromLink);
      // Out of the address bar, so it isn't shared by accident (it's kept on this device instead).
      history.replaceState(null, "", window.location.pathname);
    }
    const k = fromLink ?? savedKey();
    // After this render (state from outside React: the address and this device's storage).
    queueMicrotask(() => {
      if (!k) return setError("Open your seller page from the link you got when you signed up, or ask for one by email.");
      setKey(k);
      void load(k);
    });
  }, [load]);

  if (error && !data)
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-3xl">Your seller page</p>
        <p className="mt-2 text-muted">{error}</p>
        <p className="mt-6">
          <Link href="/partners" className="btn btn-primary">
            Get a new link by email
          </Link>
        </p>
      </div>
    );
  if (!data || !key) return <p className="text-muted">Loading your page…</p>;

  const { partner: p, totals: t } = data;
  return (
    <div>
      <p className="eyebrow">Your seller page</p>
      <h1 className="mt-1 text-4xl md:text-5xl">Namaste, {p.name}</h1>
      {p.status !== "active" && <p className="mt-3 rounded-xl bg-zari-light/40 p-3 text-sm">Your account is paused. Get in touch with us if you have questions.</p>}

      <section className="mt-8 rounded-2xl border border-line bg-white p-5 md:p-6">
        <p className="font-medium">Your link</p>
        <p className="mt-1 text-sm text-muted">
          Your link to the whole shop. Bitcoin Cash sales through it (within 30 days of the visit) earn you {p.ratePercent}% of the items, paid to
          you the moment the shopper pays.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <code className="flex min-h-12 flex-1 items-center rounded-xl border border-line bg-sand px-4 py-2 text-sm break-all">{p.link}</code>
          <CopyButton text={p.link} label="Copy link" />
        </div>
      </section>

      {pieces.length > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-5 md:p-6">
          <p className="font-medium">Share one piece</p>
          <p className="mt-1 text-sm text-muted">Each link opens that piece and still earns you your commission. On this device, every piece&apos;s page also shows your link.</p>
          <ul className="mt-3 max-h-[28rem] divide-y divide-line overflow-y-auto">
            {pieces.map((x) => {
              const url = `${p.link.replace(/\/\?s=.*$/, "")}/product/${x.slug}?s=${p.code}`;
              return (
                <li key={x.slug} className="flex items-center gap-3 py-2.5">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand">{x.image && <ProductImage image={x.image} sizes="48px" />}</div>
                  <Link href={`/product/${x.slug}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
                    {x.title}
                    {x.soldOut && <span className="text-muted"> · sold out</span>}
                  </Link>
                  <CopyButton text={url} label="Copy link" />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {data.todo.length > 0 && (
        <section className="mt-4 rounded-2xl border border-zari-light bg-ivory p-5" role="status">
          <p className="font-medium">Before we can pay you</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted">
            {data.todo.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ["Sales", String(t.sales)],
          ["Paid to you", usd(t.paidCents)],
          ["Still to come", usd(t.owedCents)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">{label}</p>
            <p className="mt-1 font-display text-2xl md:text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-2xl">Your commissions</h2>
        {data.commissions.length ? (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {data.commissions.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">
                    {usd(c.cents)} <span className="text-sm font-normal text-muted">({c.ratePercent}% of {usd(c.baseCents)})</span>
                  </p>
                  <p className="text-sm text-muted">
                    Order {c.order ?? "—"} · {day(c.at)}
                  </p>
                  {c.state === "sent" && <p className="text-sm text-muted">{c.how === "split" ? "Paid in the shopper's own payment" : "Sent to you when the shopper paid"}</p>}
                  {c.state === "holding" && <p className="text-sm text-muted">{c.waiting ?? "On its way"}</p>}
                  {c.note && c.state !== "holding" && <p className="text-sm text-muted">{c.note}</p>}
                </div>
                <div className="text-right text-sm">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE[c.state][1]}`}>{STATE[c.state][0]}</span>
                  {c.txUrl && (
                    <p className="mt-1">
                      <a href={c.txUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        {c.bch} BCH ↗
                      </a>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">None yet. They show here as soon as someone pays through your link.</p>
        )}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <EmailCard partner={p} pageKey={key} onSaved={setData} />
        <AddressCard partner={p} pageKey={key} onSaved={setData} />
      </section>

      <p className="mt-8 text-sm text-muted">
        {p.termsAcceptedAt && (
          <>
            You agreed to the{" "}
            <Link href="/partners/terms" className="underline underline-offset-4">
              seller terms
            </Link>{" "}
            (version {p.termsVersion}) on {day(p.termsAcceptedAt)}. You&apos;re responsible for your own taxes on what you earn.{" "}
          </>
        )}
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => {
            saveKey(null);
            saveCode(null);
            router.push("/partners");
          }}
        >
          Sign out on this device
        </button>
      </p>
    </div>
  );
}

type CardProps = { partner: PartnerPageData["partner"]; pageKey: string; onSaved: (d: PartnerPageData) => void };

function EmailCard({ partner: p, pageKey, onSaved }: CardProps) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="rounded-2xl border border-line bg-white p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await post<PartnerPageData>("/api/partners/me/email", { key: pageKey, email: new FormData(e.currentTarget).get("email") });
        if (r.ok) {
          onSaved(r.data);
          setMsg("We sent a link to confirm it.");
        } else setMsg(r.error);
      }}
    >
      <p className="font-medium">Email</p>
      {p.emailConfirmed ? (
        <p className="mt-1 text-sm text-muted">
          {p.email} <span className="text-peacock">· confirmed</span>
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">{p.email ? `${p.email}: not confirmed yet (check your inbox), or change it:` : "Needed before your first payout."}</p>
          <div className="mt-3 flex gap-2">
            <input name="email" type="email" required autoComplete="email" defaultValue={p.email ?? ""} className={field} aria-label="Your email" />
            <button type="submit" className="btn btn-outline shrink-0">
              {p.email ? "Send again" : "Save"}
            </button>
          </div>
        </>
      )}
      {msg && <p className="mt-2 text-sm" role="status">{msg}</p>}
    </form>
  );
}

function AddressCard({ partner: p, pageKey, onSaved }: CardProps) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="rounded-2xl border border-line bg-white p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const r = await post<PartnerPageData>("/api/partners/me/address", { key: pageKey, address: new FormData(form).get("address") });
        if (r.ok) {
          form.reset();
          onSaved(r.data);
          setMsg(r.data.partner.pendingAddress ? "Check your email to confirm the new address." : "Saved. Payouts to it start in a few days.");
        } else setMsg(r.errors?.address ?? r.error);
      }}
    >
      <p className="font-medium">Payout address</p>
      <p className="mt-1 font-mono text-xs break-all text-muted">{p.address}</p>
      {p.pendingAddress && <p className="mt-1 text-sm break-all text-muted">Waiting for your email confirmation: {p.pendingAddress}</p>}
      <div className="mt-3 flex gap-2">
        <input name="address" required autoComplete="off" spellCheck={false} placeholder="New bitcoincash:q… address" className={`${field} font-mono text-sm`} aria-label="New payout address" />
        <button type="submit" className="btn btn-outline shrink-0">
          Change
        </button>
      </div>
      {msg && <p className="mt-2 text-sm" role="status">{msg}</p>}
    </form>
  );
}
