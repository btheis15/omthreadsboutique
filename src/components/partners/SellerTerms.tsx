/**
 * The seller terms: the written agreement between the shop and a sales partner (Illinois's Freelance Worker
 * Protection Act asks for one, naming both parties, the work, the pay and how and when it's paid). Changing the
 * terms means a new TERMS_VERSION: the admin keeps which version each partner agreed to, and when.
 */
export const TERMS_VERSION = "2026-10";

export type Business = { name: string; address: string | null; email: string | null };

export function SellerTerms({ ratePercent, business }: { ratePercent: number | null; business: Business | null }) {
  const rate = ratePercent ? `${ratePercent}%` : "the commission rate shown on our sign-up page";
  const shop = business?.name ?? "Om Threads Boutique";
  return (
    <div className="space-y-3 text-sm text-muted">
      <p>
        This is the agreement between <b className="text-ink">{shop}</b>
        {business?.address ? `, ${business.address}` : ", Lake Villa, Illinois"}
        {business?.email ? ` (${business.email})` : ""} (&ldquo;we&rdquo;), and you, the sales partner named at sign-up, at the mailing address you give
        (&ldquo;you&rdquo;). Version {TERMS_VERSION}.
      </p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          <b className="text-ink">The work.</b> You share links to our shop and our pieces (your partner link) so people can buy from us. You choose when,
          where and how you share them.
        </li>
        <li>
          <b className="text-ink">Your pay.</b> For each order paid with Bitcoin Cash through your link within 30 days of the visit, you earn {rate} of the
          price of the items (after any coupon; not tax or shipping). We may give you a different rate; your seller page always shows yours.
        </li>
        <li>
          <b className="text-ink">How and when you&apos;re paid.</b> In Bitcoin Cash, to the address you give us, at the moment the shopper pays: as part of
          their payment, or sent by us right away, at the BCH rate they paid at. A commission already paid isn&apos;t taken back if the order is
          later refunded. Test orders earn nothing.
        </li>
        <li>
          <b className="text-ink">Prices are ours.</b> We set prices, discounts and your rate. You can&apos;t offer your own discounts, take orders or
          payments yourself, or make promises for us.
        </li>
        <li>
          <b className="text-ink">Be honest.</b> Say clearly that you earn a commission whenever you share your link (for example &ldquo;I earn a commission
          from Om Threads&rdquo;). No spam, and nothing untrue about us or our pieces.
        </li>
        <li>
          <b className="text-ink">Taxes.</b> You&apos;re responsible for reporting and paying your own taxes on what you earn, wherever you live. If
          you&apos;re a US person, we&apos;ll ask for a W-9 once your commissions reach the amount the IRS asks us to report in a year, send you a 1099,
          and hold your payouts until we have it.
        </li>
        <li>
          <b className="text-ink">Sanctions.</b> You confirm you don&apos;t live in a country or region under US embargo and aren&apos;t on a US sanctions
          list. If that changes, stop sharing and tell us.
        </li>
        <li>
          <b className="text-ink">Independent.</b> You&apos;re an independent seller, not our employee or agent. Either of us can end this at any time;
          we can pause or remove your link. We may change these terms; the new version applies to sales after we post it.
        </li>
        <li>
          <b className="text-ink">Your details.</b> We keep your name, email, mailing address, country and payout address to run the program, pay you and
          meet our tax duties.
        </li>
      </ol>
      <p>This agreement is governed by the laws of Illinois. Your seller page keeps a link to these terms and the date you agreed.</p>
    </div>
  );
}
