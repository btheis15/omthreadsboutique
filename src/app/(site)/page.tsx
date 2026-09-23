import Link from "next/link";
import { ArrowIcon, LeafIcon, ReturnIcon, TruckIcon } from "@/components/icons";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { getCollections, getProducts, isSoldOut } from "@/lib/catalog";
import { categories, site } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const available = products.filter((p) => !isSoldOut(p));
  const newest = [...available].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 8);
  const featured = available.filter((p) => p.featured).slice(0, 4);
  const heroProduct = featured[0] ?? newest[0];
  const storyProduct = featured[1] ?? newest[1];
  const categoryTiles = categories
    .map((c) => ({ ...c, product: available.find((p) => p.type === c.type) }))
    .filter((c) => c.product)
    .slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[78svh] min-h-[480px] overflow-hidden bg-sand md:h-[82vh]">
          {heroProduct && (
            <ProductImage image={heroProduct.images[0]} sizes="100vw" preload className="scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          <div className="container-page absolute inset-x-0 bottom-0 pb-12 text-ivory md:pb-20">
            <p className="eyebrow mb-3 text-ivory/80">New season collection</p>
            <h1 className="max-w-xl text-[2.75rem] leading-[1.02] md:text-7xl">Wrapped in something beautiful</h1>
            <p className="mt-4 max-w-md text-ivory/85 md:text-lg">{site.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="btn bg-ivory text-ink hover:bg-white">
                Shop the collection
              </Link>
              <Link href="/shop?sort=newest" className="btn border border-ivory/70 text-ivory hover:bg-ivory/10">
                New arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-line">
        <ul className="container-page grid grid-cols-3 gap-2 py-5 text-center text-xs text-muted md:text-sm">
          <li className="flex flex-col items-center gap-1.5 md:flex-row md:justify-center md:gap-2">
            <LeafIcon size={20} /> Handpicked quality
          </li>
          <li className="flex flex-col items-center gap-1.5 md:flex-row md:justify-center md:gap-2">
            <TruckIcon size={20} /> Free shipping ${site.freeShippingThreshold}+
          </li>
          <li className="flex flex-col items-center gap-1.5 md:flex-row md:justify-center md:gap-2">
            <ReturnIcon size={20} /> 30-day returns
          </li>
        </ul>
      </section>

      {/* Category tiles */}
      {categoryTiles.length > 0 && (
        <section className="container-page mt-14 md:mt-20">
          <div className="grid gap-3 sm:grid-cols-2 md:gap-6">
            {categoryTiles.map((c) => (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-sand sm:aspect-[4/5]"
              >
                <ProductImage
                  image={c.product!.images[0]}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="transition duration-700 ease-soft group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory md:p-8">
                  <h2 className="text-4xl md:text-5xl">{c.title}</h2>
                  <p className="mt-2 max-w-sm text-sm text-ivory/85">{c.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                    Shop {c.title.toLowerCase()} <ArrowIcon size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals carousel */}
      {newest.length > 0 && (
        <section className="mt-16 md:mt-24">
          <div className="container-page mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow mb-2">Just in</p>
              <h2 className="text-3xl md:text-4xl">New arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="text-sm underline underline-offset-4">
              View all
            </Link>
          </div>
          <ul className="no-scrollbar container-page flex snap-x snap-mandatory gap-3 overflow-x-auto md:gap-6">
            {newest.map((p) => (
              <li key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Brand story */}
      <section className="mt-20 bg-sand py-16 md:mt-28 md:py-24">
        <div className="container-page grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg md:order-2">
            {storyProduct && (
              <ProductImage
                image={storyProduct.images[1] ?? storyProduct.images[0]}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            )}
          </div>
          <div>
            <p className="eyebrow mb-3">Our story</p>
            <h2 className="text-4xl md:text-5xl">Made to be treasured, chosen with care</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink/80">
              Every shawl and stole is handpicked for how it feels, how it drapes and how long it will last. We look
              for natural fibers and honest craftsmanship, and colors you&apos;ll reach for again and again.
            </p>
            <Link href="/about" className="btn btn-outline mt-8">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-page mt-16 md:mt-24">
          <div className="mb-6">
            <p className="eyebrow mb-2">Handpicked</p>
            <h2 className="text-3xl md:text-4xl">Featured pieces</h2>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {featured.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="container-page mt-16 md:mt-24">
          <h2 className="mb-6 text-3xl md:text-4xl">Shop by occasion</h2>
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:px-0">
            {collections.map((c) => (
              <li key={c.slug} className="w-[40%] shrink-0 md:w-auto">
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-full bg-sand">
                    <ProductImage
                      image={c.image}
                      sizes="(min-width: 768px) 20vw, 40vw"
                      className="transition duration-700 ease-soft group-hover:scale-[1.05]"
                    />
                  </div>
                  <p className="mt-3 text-center text-[0.95rem]">{c.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Etsy trust */}
      <section className="container-page mt-20 md:mt-28">
        <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center md:py-16">
          <p className="eyebrow">Also on Etsy</p>
          <h2 className="mt-3 text-3xl md:text-4xl">Prefer to shop on Etsy?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Our full collection is on Etsy too, with the same pieces and the same care. Read reviews from our customers
            there, or check out with your Etsy account.
          </p>
          <a href={site.etsyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-7">
            Visit our Etsy shop
          </a>
        </div>
      </section>
    </>
  );
}
