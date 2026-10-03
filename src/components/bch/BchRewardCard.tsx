"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import logo from "@/assets/logo.png";
import type { BchPayment, BchReward } from "@/lib/bch";
import { declined, resumeWallet, startConnection, wcProjectId } from "@/lib/bch/walletConnect";
import { QrCode, RewardGlyph } from "./parts";

const touch = () => window.matchMedia("(pointer: coarse)");
const subscribeTouch = (fn: () => void) => {
  const m = touch();
  m.addEventListener("change", fn);
  return () => m.removeEventListener("change", fn);
};
const shortAddress = (a: string) => {
  const body = a.replace(/^bitcoincash:/, "");
  return `${body.slice(0, 6)}…${body.slice(-6)}`;
};

/**
 * The thank-you page's reward (the shop's tokens, cash back): on its way, sent, or to claim. Paid from a
 * connected wallet, they're sent straight back; paid from any other wallet (maybe an exchange), the shopper
 * claims them here, by connecting a wallet or pasting an address that holds tokens.
 */
export function BchRewardCard({ token, initial }: { token: string; initial: BchReward | null }) {
  const [reward, setReward] = useState(initial);
  const [uri, setUri] = useState<string | null>(null);
  const [paste, setPaste] = useState(false);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = useSyncExternalStore(subscribeTouch, () => touch().matches, () => false);

  // Just paid: the reward is worked out a moment later; and one on its way turns to "sent".
  useEffect(() => {
    if (reward && reward.state !== "sending") return;
    let tries = 0;
    let stop = false;
    let t: ReturnType<typeof setTimeout>;
    const look = async () => {
      try {
        const res = await fetch(`/api/checkout/status?order=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = (await res.json()) as { bch: BchPayment | null };
        if (stop) return;
        if (data.bch?.reward) setReward(data.bch.reward);
        if (data.bch?.reward && data.bch.reward.state !== "sending") return;
      } catch {
        /* again shortly */
      }
      if (!stop && ++tries < (reward ? 40 : 6)) t = setTimeout(look, reward ? 4000 : 3000);
    };
    t = setTimeout(look, 2000);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [token, reward]);

  async function claim(to: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/bch/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, address: to }) });
      const data = (await res.json().catch(() => ({}))) as { reward?: BchReward; error?: string };
      if (!res.ok || !data.reward) throw new Error(data.error ?? "Couldn't claim it just now. Please try again.");
      setReward(data.reward);
      setUri(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  async function claimWithWallet() {
    setError(null);
    setBusy(true);
    try {
      const known = await resumeWallet();
      if (known) return void (await claim(known.address));
      const c = await startConnection();
      setUri(c.uri);
      setBusy(false);
      const w = await c.connected;
      await claim(w.address);
    } catch (e) {
      setUri(null);
      setBusy(false);
      setError(declined(e) ? "The connection was declined in your wallet." : "Couldn't reach a wallet just now. Try again, or paste an address.");
    }
  }

  if (!reward) return null;

  return (
    <section className="reward-card mt-8 p-5 sm:p-6" aria-live="polite">
      <div className="flex items-center gap-4">
        <span className="reward-coin shrink-0">
          <Image src={logo} alt="" sizes="40px" className="size-10" />
        </span>
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1.5">
            <RewardGlyph size={14} /> Om Threads rewards
          </p>
          <p className="font-display text-2xl leading-tight">You earned {reward.text}</p>
          <p className="text-sm text-ink/70">{reward.rule}</p>
        </div>
      </div>

      {reward.state === "sent" ? (
        <p className="mt-4 text-[0.95rem]">
          Sent to your wallet{reward.to ? ` (${shortAddress(reward.to)})` : ""}.{" "}
          {reward.txUrl && (
            <a href={reward.txUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              See it on the blockchain
            </a>
          )}
          {reward.txUrl ? ". " : " "}
          Bring them to your next order: they take Bitcoin Cash off.
        </p>
      ) : reward.state === "sending" ? (
        <p className="mt-4 flex items-center gap-2 text-[0.95rem]">
          <span className="pay-watching inline-flex">
            <span aria-hidden="true" />
          </span>
          On their way to your wallet{reward.to ? ` (${shortAddress(reward.to)})` : ""}…
        </p>
      ) : reward.state === "expired" ? (
        <p className="mt-4 text-[0.95rem] text-ink/75">This reward wasn&apos;t claimed in time.</p>
      ) : uri ? (
        <div className="mt-5 flex flex-col items-center text-center">
          {phone ? (
            <a href={uri} className="pay-primary">
              Open my wallet app
            </a>
          ) : (
            <QrCode text={uri} size={208} label="QR code to connect your wallet" listening />
          )}
          <p className="mt-3 text-sm text-ink/75">Approve the connection in Cashonize, Paytaca or Zapit, and your reward goes straight to it.</p>
          <button type="button" onClick={() => setUri(null)} className="mt-2 text-sm text-muted underline underline-offset-4">
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-[0.95rem] text-ink/80">
            Claim them to a wallet that holds tokens: Cashonize, Paytaca, Zapit or Electron Cash.{reward.claimUntil ? ` Until ${new Date(reward.claimUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {wcProjectId && (
              <button type="button" onClick={claimWithWallet} disabled={busy} className="btn btn-primary">
                {busy ? "Claiming…" : "Claim with my wallet"}
              </button>
            )}
            <button type="button" onClick={() => setPaste((v) => !v)} className="btn btn-outline">
              Paste an address
            </button>
          </div>
          {paste && (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void claim(address.trim());
              }}
            >
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="bitcoincash:z… or bitcoincash:q…"
                spellCheck={false}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-full border border-line bg-ivory px-4 py-2.5"
                aria-label="Your wallet's address"
              />
              <button type="submit" disabled={busy || !address.trim()} className="btn btn-primary">
                {busy ? "Claiming…" : "Claim"}
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-muted">Not an exchange&apos;s address: exchanges can&apos;t hold the shop&apos;s tokens.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-sale/10 p-3 text-sm text-sale">
          {error}
        </p>
      )}
    </section>
  );
}
