import { fill, money, type TermsContent } from "@/lib/page-content";

/**
 * The seller terms: the written agreement between the shop and a sales partner (Illinois's Freelance Worker
 * Protection Act asks for one, naming both parties, the work, the pay and how and when it's paid). The wording,
 * version and 1099 limit come from the admin (feed page `seller-terms`, text keys `sellerTermsVersion` and
 * `partnersTaxLimit`), with the original wording as the fallback (see lib/page-content.ts). Changing the terms
 * means a new version: the admin keeps which version each partner agreed to, and when.
 */
export type Business = { name: string; address: string | null; email: string | null };

export function SellerTerms({ ratePercent, business, terms }: { ratePercent: number | null; business: Business | null; terms: TermsContent }) {
  const rate = ratePercent ? `${ratePercent}%` : "the commission rate shown on our sign-up page";
  const shop = business?.name ?? "Om Threads Boutique";
  const details = `${business?.address ? `, ${business.address}` : ", Lake Villa, Illinois"}${business?.email ? ` (${business.email})` : ""}`;
  const vars = { rate, taxLimit: money(terms.taxLimit), version: terms.version, details };
  const [before, after] = fill(terms.intro, { ...vars, shop: "\u0000" }).split("\u0000");
  return (
    <div className="space-y-3 text-sm text-muted">
      <p>
        {before}
        <b className="text-ink">{shop}</b>
        {after}
      </p>
      <ol className="list-decimal space-y-1.5 pl-5">
        {terms.clauses.map((c, i) => (
          <li key={i}>
            <b className="text-ink">{c.heading}</b> {fill(c.text, vars)}
          </li>
        ))}
      </ol>
      <p>{terms.closing}</p>
    </div>
  );
}
