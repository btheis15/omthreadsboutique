import type { Metadata } from "next";
import Link from "next/link";
import { Divider } from "@/components/ornaments";
import { countryOptions } from "@/components/partners/countries";
import { PartnerSignup, SignInByEmail } from "@/components/partners/PartnerSignup";
import { getCheckout } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell for Om Threads",
  description: `Share ${site.name}'s handwoven pieces and earn a commission on every Bitcoin Cash sale your link brings.`,
  alternates: { canonical: "/partners" },
};

export const revalidate = 300;

export default async function PartnersPage() {
  const program = (await getCheckout())?.partners ?? null;
  const rate = program ? `${program.ratePercent}%` : "a commission";
  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <p className="font-deva text-xl text-accent" data-reveal>
        साथ में
      </p>
      <h1 className="mt-2 text-4xl md:text-6xl" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        Sell for Om Threads
      </h1>
      <p className="mt-4 text-lg text-muted" data-reveal style={{ "--i": 2 } as React.CSSProperties}>
        Love these pieces? Share them. Sign up for your own link, and when someone pays with Bitcoin Cash through it, {rate} of what they
        bought goes straight to your Bitcoin Cash wallet, the moment they pay.
      </p>

      {program ? (
        <>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3" data-reveal>
            {[
              ["Sign up", "Your name and a Bitcoin Cash address. Your link is ready at once."],
              ["Share it", "The whole shop, or any piece: every page has your link. Anyone who shops through it within 30 days counts."],
              ["Get paid", `${rate} of what the items sell for (sale prices and coupons included; not tax or shipping), in BCH, the moment the shopper pays.`],
            ].map(([title, text], i) => (
              <li key={title} className="rounded-2xl border border-line bg-white p-5">
                <p className="eyebrow mb-1">Step {i + 1}</p>
                <p className="font-display text-2xl">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10" data-reveal>
            <PartnerSignup ratePercent={program.ratePercent} business={program.business} countries={countryOptions()} />
          </div>
          <Divider className="my-12" />
          <h2 className="text-2xl">Already selling with us?</h2>
          <p className="mt-2 text-muted">We&apos;ll email a link to your seller page (to the email you confirmed).</p>
          <div className="mt-4">
            <SignInByEmail />
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center" data-reveal>
          <p className="font-display text-2xl">Not open right now</p>
          <p className="mt-2 text-muted">
            Sign-ups for selling with us are closed at the moment. Please check back soon, or{" "}
            <Link href="/contact" className="underline underline-offset-4">
              get in touch
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
