import type { Metadata } from "next";
import Link from "next/link";
import { Divider } from "@/components/ornaments";
import { countryOptions } from "@/components/partners/countries";
import { PartnerSignup, SignInByEmail } from "@/components/partners/PartnerSignup";
import { getCheckout, getFeedPage, getFeedText } from "@/lib/catalog";
import { fill, partnersContent, termsContent } from "@/lib/page-content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell for Om Threads",
  description: `Share ${site.name}'s handwoven pieces and earn a commission on every Bitcoin Cash sale your link brings.`,
  alternates: { canonical: "/partners" },
};

export const revalidate = 300;

export default async function PartnersPage() {
  const program = (await getCheckout())?.partners ?? null;
  const [page, termsPage, version, taxLimit] = await Promise.all([
    getFeedPage("partners"),
    getFeedPage("seller-terms"),
    getFeedText("sellerTermsVersion"),
    getFeedText("partnersTaxLimit"),
  ]);
  const c = partnersContent(page);
  const terms = termsContent(termsPage, { version, taxLimit });
  const [closedBefore, closedAfter] = c.closedText.split("get in touch");
  const rate = program ? `${program.ratePercent}%` : "a commission";
  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <p className="font-deva text-xl text-accent" data-reveal>
        साथ में
      </p>
      <h1 className="mt-2 text-4xl md:text-6xl" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        {c.title}
      </h1>
      <p className="mt-4 text-lg text-muted" data-reveal style={{ "--i": 2 } as React.CSSProperties}>
        {fill(c.intro, { rate })}
      </p>

      {program ? (
        <>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3" data-reveal>
            {c.steps.map(([title, text], i) => (
              <li key={title} className="rounded-2xl border border-line bg-white p-5">
                <p className="eyebrow mb-1">Step {i + 1}</p>
                <p className="font-display text-2xl">{title}</p>
                <p className="mt-1 text-sm text-muted">{fill(text, { rate })}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10" data-reveal>
            <PartnerSignup ratePercent={program.ratePercent} business={program.business} countries={countryOptions()} terms={terms} />
          </div>
          <Divider className="my-12" />
          <h2 className="text-2xl">{c.signedUpTitle}</h2>
          <p className="mt-2 text-muted">{c.signedUpText}</p>
          <div className="mt-4">
            <SignInByEmail />
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center" data-reveal>
          <p className="font-display text-2xl">{c.closedTitle}</p>
          <p className="mt-2 text-muted">
            {closedBefore}
            {closedAfter !== undefined && (
              <>
                <Link href="/contact" className="underline underline-offset-4">
                  get in touch
                </Link>
                {closedAfter}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
