import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart, StickyBuyBar } from "@/components/AddToCart";
import { LeafIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { Price } from "@/components/Price";
import { ProductGrid, productVtName } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { RichText } from "@/components/RichText";
import { getProduct, getProducts, getSettings, isSoldOut, relatedProducts } from "@/lib/catalog";
import { craftByValue } from "@/lib/crafts";
import { paymentProvider } from "@/lib/payments";
import { categories, colorLabel, materialLabel, site, siteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const image = product.images[0]?.url;
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      // Sanity crops to the social-card size on request; admin photos are used as-is.
      images: image ? [{ url: image.includes("cdn.sanity.io") ? `${image}?w=1200&h=630&fit=crop` : image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, all, settings] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!product) notFound();

  const payments = paymentProvider();
  const category = categories.find((c) => c.type === product.type);
  const related = relatedProducts(all, product);
  const craft = craftByValue(product.craft);

  const details = [
    craft && { label: "Craft", value: craft.label },
    product.origin && { label: "Made in", value: product.origin },
    product.material && { label: "Material", value: materialLabel(product.material) },
    product.dimensions && { label: "Size", value: product.dimensions },
    product.colors.length && { label: "Color", value: product.colors.map(colorLabel).join(", ") },
  ].filter(Boolean) as { label: string; value: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    image: product.images.flatMap((i) => (i.url ? [new URL(i.url, siteUrl()).toString()] : [])),
    material: materialLabel(product.material),
    color: product.colors.map(colorLabel).join(", ") || undefined,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/product/${product.slug}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: isSoldOut(product) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
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
                {category.title}
              </Link>
            </>
          )}
        </nav>

        <div className="md:grid md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-16">
          <ProductGallery
            images={product.images}
            title={product.title}
            videoUrl={product.videoUrl}
            vtName={productVtName(product.slug)}
          />

          <div className="container-page pt-6 md:px-0 md:pt-0">
            <div className="md:sticky md:top-28">
              <p className="eyebrow mb-2">
                {[craft?.label, category?.singular].filter(Boolean).join(" · ")}
                {product.origin && <span className="text-zari"> · {product.origin}</span>}
              </p>
              <h1 className="text-[2rem] md:text-5xl">{product.title}</h1>
              <Price
                price={product.price}
                compareAt={product.compareAtPrice}
                className="mt-3 text-xl font-medium"
              />
              {product.stock !== undefined && product.stock > 0 && product.stock <= 3 && (
                <p className="mt-2 text-sm text-accent">Only {product.stock} left</p>
              )}
              <p className="mt-5 leading-relaxed text-ink/85">{product.shortDescription}</p>

              <div id="buy-buttons" className="mt-6">
                <AddToCart product={product} onSiteCheckout={payments.onSiteCheckout} />
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <LeafIcon size={18} /> Handpicked quality
                </li>
                <li className="flex items-center gap-2">
                  <TruckIcon size={18} /> Ships in {settings.shipsWithin}
                </li>
                <li className="flex items-center gap-2">
                  <ReturnIcon size={18} /> {settings.returnDays}-day returns
                </li>
                <li className="flex items-center gap-2">
                  <ShieldIcon size={18} /> Secure checkout
                </li>
              </ul>

              {craft && (
                <Link
                  href={`/crafts#${craft.value}`}
                  className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-sand p-5 transition hover:border-zari"
                >
                  <span className="font-deva text-3xl text-accent">{craft.hindi}</span>
                  <span>
                    <span className="block font-medium">The craft: {craft.label}</span>
                    <span className="block text-sm text-muted">{craft.summary}</span>
                  </span>
                </Link>
              )}

              <div className="mt-8 divide-y divide-line border-y border-line">
                {product.description && product.description.length > 0 && (
                  <Accordion title="Description" defaultOpen>
                    <RichText value={product.description} />
                  </Accordion>
                )}
                {details.length > 0 && (
                  <Accordion title="Details" defaultOpen={!product.description?.length}>
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
                  <Accordion title="Care">
                    <p className="leading-relaxed">{product.care}</p>
                    <Link href="/care-guide" className="mt-2 inline-block text-sm underline underline-offset-4">
                      Read the full care guide
                    </Link>
                  </Accordion>
                )}
                <Accordion title="Shipping & returns">
                  <p className="leading-relaxed">
                    Packed with care and shipped within {settings.shipsWithin}. Unworn items can be returned within{" "}
                    {settings.returnDays} days.{" "}
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
            <h2 className="mb-6 text-3xl">You may also love</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
      <StickyBuyBar product={product} onSiteCheckout={payments.onSiteCheckout} watchId="buy-buttons" />
    </>
  );
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
