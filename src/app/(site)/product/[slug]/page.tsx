import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeafIcon, ShieldIcon } from "@/components/icons";
import { ProductGrid, productVtName } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { TrackViewContent } from "@/components/TrackViewContent";
import { ArtisanCard } from "@/components/ArtisanCard";
import { EtsyRatingLine } from "@/components/EtsyRatingLine";
import { PartnerShareBar } from "@/components/partners/PartnerShareBar";
import { RichText } from "@/components/RichText";
import { directVideoUrl, getCheckout, getLists, getProduct, getT, getProducts, getSettings, getTestimonials, isSoldOut, relatedProducts } from "@/lib/catalog";
import { giftOffer } from "@/lib/free-gift";
import { liveCheckout, productExpress } from "@/lib/payments";
import { craftByValue, isWovenCraft, colorLabel, materialLabel, typeByValue } from "@/lib/lists";
import { formatPrice, siteUrl } from "@/lib/site";
import type { Product } from "@/lib/types";
import { defaultVariant, hasOptions, priceRange, variantAvailable } from "@/lib/variants";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  // The link-preview picture is drawn by opengraph-image.tsx next to this file.
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.title, description: product.shortDescription },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, all, settings, onSiteCheckout, express, lists, t, checkoutInfo, testimonials] = await Promise.all([getProduct(slug), getProducts(), getSettings(), liveCheckout(), productExpress(), getLists(), getT(), getCheckout(), getTestimonials()]);
  if (!product) notFound();

  const category = typeByValue(lists, product.type);
  const related = relatedProducts(all, product);
  const craft = craftByValue(lists, product.craft);

  const details = [
    craft && { label: "Craft", value: craft.label },
    product.origin && { label: "Made in", value: product.origin },
    product.material && { label: "Material", value: materialLabel(lists, product.material) },
    product.dimensions && { label: "Size", value: product.dimensions },
    product.colors.length && { label: "Color", value: product.colors.map((c) => colorLabel(lists, c)).join(", ") },
  ].filter(Boolean) as { label: string; value: string }[];

  const woven = isWovenCraft(craft);
  // Shops near Lake Villa can skip the wait: local pickup, when the shop offers it.
  const pickup = onSiteCheckout ? checkoutInfo?.pickup : null;
  // One real customer review near the price: one written about this piece if there is one, otherwise the newest.
  const about = (r: (typeof testimonials)[number]) => [product.id, product.slug.toLowerCase(), product.title.toLowerCase()].includes((r.product ?? "").trim().toLowerCase());
  const review = testimonials.find(about) ?? testimonials[0];
  const story = (
    <div className="mt-3 space-y-1 text-[0.95rem] leading-snug">
      <p className="font-medium">{t(woven ? "productStoryWoven" : "productStoryMade", { origin: product.origin || "India" })}</p>
      <p className="text-ink/85">{t("productStoryFamily")}</p>
      <p className="text-sm text-muted">{t("productTrustLine", { days: settings.returnDays })}</p>
      {pickup && <p className="text-sm text-muted">{pickup.cents === 0 ? t("productPickupFree") : t("productPickupPaid", { price: formatPrice(pickup.cents / 100) })}</p>}
      {review && (
        <figure className="mt-3 rounded-lg bg-sand px-3 py-2 text-sm">
          <blockquote className="line-clamp-3 italic">“{review.quote}”</blockquote>
          <figcaption className="mt-1 text-muted">
            — {review.name}
            {review.location && `, ${review.location}`}
          </figcaption>
        </figure>
      )}
    </div>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    image: product.images.flatMap((i) => (i.url ? [new URL(i.url, siteUrl()).toString()] : [])),
    material: materialLabel(lists, product.material),
    color: product.colors.map((c) => colorLabel(lists, c)).join(", ") || undefined,
    brand: { "@type": "Brand", name: t("siteName") },
    offers: offersFor(product),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="pb-8 md:container-page md:pt-8 md:pb-0">
        <nav aria-label="Breadcrumb" className="container-page hidden text-sm text-muted md:mb-6 md:block md:px-0">
          <Link href="/shop" className="hover:text-ink">
            Shop
          </Link>
          {category && (
            <>
              {" / "}
              <Link href={`/shop/${category.slug}`} className="hover:text-ink">
                {category.plural}
              </Link>
            </>
          )}
        </nav>

        <div className="md:grid md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-16">
          <ProductGallery
            images={product.images.map((img) => ({ ...img, live: directVideoUrl(img.live) }))}
            title={product.title}
            videos={(product.videos?.length ? product.videos : product.videoUrl ? [{ url: product.videoUrl }] : []).map((v) => ({ ...v, url: directVideoUrl(v.url) }))}
            initialValues={defaultVariant(product)?.values}
            vtName={productVtName(product.slug)}
          />

          <div className="container-page pt-4 md:px-0 md:pt-0">
            <div className="md:sticky md:top-28">
              <p className="eyebrow mb-1 md:mb-2">
                {[craft?.label, category?.label].filter(Boolean).join(" · ")}
                {product.origin && <span className="hidden text-zari md:inline"> · {product.origin}</span>}
              </p>
              <h1 className="text-[1.5rem] leading-tight md:text-5xl">{product.title}</h1>
              <EtsyRatingLine rating={settings.etsyRating} count={settings.etsyReviewCount} />
              {/* Price, stock, the option picker (colours…) and the buy buttons. */}
              <ProductPurchase afterPrice={story} product={product} onSiteCheckout={onSiteCheckout} express={express} giftOffer={onSiteCheckout && product ? giftOffer(checkoutInfo?.freeGift, all) : null} />
              <TrackViewContent slug={product.slug} title={product.title} price={product.price} />
              {/* A sales partner signed in on this device: their link for this piece. */}
              <PartnerShareBar title={product.title} />

              <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <LeafIcon size={18} /> {t("productPromiseQuality")}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldIcon size={18} /> {t("productPromiseSecure")}
                </li>
              </ul>

              <ArtisanCard craft={craft} origin={product.origin} craftTitle={craft ? t("productCraftPrefix", { craft: craft.label }) : undefined} />

              <div className="mt-8 divide-y divide-line border-y border-line">
                {product.description && product.description.length > 0 && (
                  <Accordion title={t("productAccDescription")} defaultOpen>
                    <RichText value={product.description} />
                  </Accordion>
                )}
                {details.length > 0 && (
                  <Accordion title={t("productAccDetails")} defaultOpen={!product.description?.length}>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.95rem]">
                      {details.map((d) => (
                        <div key={d.label} className="contents">
                          <dt className="text-muted">{d.label}</dt>
                          <dd>{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Accordion>
                )}
                {product.care && (
                  <Accordion title={t("productAccCare")}>
                    <p className="leading-relaxed">{product.care}</p>
                    <Link href="/care-guide" className="mt-2 inline-block text-sm underline underline-offset-4">
                      {t("productCareLink")}
                    </Link>
                  </Accordion>
                )}
                <Accordion title={t("productAccShipping")}>
                  <p className="leading-relaxed">
                    {t("productShippingBody", { shipsWithin: settings.shipsWithin, days: settings.returnDays, finalSale: t("finalSaleNote") })}{" "}
                    <Link href="/policies/shipping" className="underline underline-offset-4">
                      Shipping
                    </Link>{" "}
                    ·{" "}
                    <Link href="/policies/returns" className="underline underline-offset-4">
                      Returns
                    </Link>
                  </p>
                </Accordion>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="container-page mt-20 md:px-0">
            <h2 className="mb-6 text-3xl">{t("productRelatedHeading")}</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}

/** Search engines see one offer, or a price range when the options have different prices. */
function offersFor(product: Product) {
  const url = `${siteUrl()}/product/${product.slug}`;
  const common = { url, priceCurrency: "USD", itemCondition: "https://schema.org/NewCondition" };
  const availability = (inStock: boolean) => (inStock ? "https://schema.org/InStock" : "https://schema.org/SoldOut");
  if (!hasOptions(product)) return { "@type": "Offer", ...common, price: product.price.toFixed(2), availability: availability(!isSoldOut(product)) };
  const { min, max } = priceRange(product);
  return {
    "@type": "AggregateOffer",
    ...common,
    lowPrice: min.toFixed(2),
    highPrice: max.toFixed(2),
    offerCount: product.variants!.length,
    availability: availability(product.variants!.some(variantAvailable)),
  };
}

function Accordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-1" open={defaultOpen}>
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between text-[0.95rem] font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="pb-5 text-ink/85">{children}</div>
    </details>
  );
}
