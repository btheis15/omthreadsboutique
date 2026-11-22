import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdModeFlag } from "@/components/ad/AdModeFlag";
import { CampaignPiece } from "@/components/ad/CampaignPiece";
import { LeafIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { campaignBySlug, campaigns, SAMPLE_CAMPAIGN } from "@/data/campaigns";
import { getProduct, getSettings, getT } from "@/lib/catalog";
import { shipsFrom, startingVariant } from "@/lib/ad-landing";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export function generateStaticParams() {
  return campaigns.map((c) => ({ slug: c.slug }));
}

/** An ad's landing page is for the ad's traffic only: never listed in search. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = campaignBySlug((await params).slug);
  return { title: campaign?.headline ?? "Om Threads Boutique", description: campaign?.sub, robots: { index: false, follow: false } };
}

/** Only what the page needs (the full product has its long description, videos and care text). */
const slim = (p: Product): Product => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  type: p.type,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  images: p.images.slice(0, 1),
  shortDescription: "",
  colors: p.colors,
  stock: p.stock,
  options: p.options,
  variants: p.variants?.map((v) => ({ ...v, image: v.image?.url ? { url: v.image.url, alt: v.image.alt, lqip: v.image.lqip } : undefined })),
  collections: [],
  featured: p.featured,
  isNew: false,
  publishedAt: p.publishedAt,
});

export default async function CampaignPage({ params }: Props) {
  const campaign = campaignBySlug((await params).slug);
  if (!campaign) notFound();
  const [found, settings, t] = await Promise.all([Promise.all(campaign.productSlugs.map((s) => getProduct(s))), getSettings(), getT()]);
  const pieces = found.filter((p): p is Product => Boolean(p));
  if (pieces.length === 0) notFound();

  // Trust row: only real facts from Site settings (nothing is shown for a fact the shop hasn't set).
  const etsy = settings.etsyRating && settings.etsyReviewCount && settings.etsyReviewCount > 0
    ? `${settings.etsyRating.toFixed(1)} on Etsy · ${settings.etsyReviewCount} ${settings.etsyReviewCount === 1 ? "review" : "reviews"}`
    : null;
  const from = shipsFrom(settings.announcement);
  const trust = [
    settings.freeShippingThreshold > 0 && { icon: <TruckIcon size={18} />, text: t("promiseFreeShipping", { amount: settings.freeShippingThreshold }) },
    settings.returnDays > 0 && { icon: <ReturnIcon size={18} />, text: t("promiseReturns", { days: settings.returnDays }) },
    settings.shipsWithin && { icon: <LeafIcon size={18} />, text: t("productPromiseShips", { shipsWithin: settings.shipsWithin }) },
    from && { icon: <TruckIcon size={18} />, text: from },
    etsy && { icon: <ShieldIcon size={18} />, text: etsy },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div className="pb-10 md:container-page md:pt-8">
      <AdModeFlag />
      {campaign === SAMPLE_CAMPAIGN && (
        <p className="bg-marigold px-4 py-1.5 text-center text-xs font-medium text-ink md:rounded">AI sample campaign: shown only while developing, never on the live site.</p>
      )}
      <div className="container-page pt-5 md:px-0 md:pt-0 md:pb-6 md:text-center">
        <h1 className="text-[1.9rem] leading-tight md:text-5xl">{campaign.headline}</h1>
        {campaign.sub && <p className="mt-2 text-ink/80 md:text-lg">{campaign.sub}</p>}
      </div>
      <div className="mt-4 space-y-12 md:mt-0">
        {pieces.map((p, i) => (
          <CampaignPiece
            key={p.id}
            product={slim(p)}
            startId={startingVariant(p, campaign.color)?.id}
            coupon={campaign.coupon}
            first={i === 0}
            heading={pieces.length > 1}
            bar={pieces.length === 1}
          />
        ))}
      </div>
      {trust.length > 0 && (
        <ul className="container-page mt-8 grid grid-cols-2 gap-3 text-sm text-muted md:px-0">
          {trust.map((x) => (
            <li key={x.text} className="flex items-center gap-2">
              {x.icon} {x.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
