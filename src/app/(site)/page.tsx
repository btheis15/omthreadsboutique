import Link from "next/link";
import { Hero } from "@/components/Hero";
import { ArrowIcon, LeafIcon, ReturnIcon, TruckIcon } from "@/components/icons";
import { Marquee } from "@/components/Marquee";
import { BorderBand, Divider, JaaliPattern, Mandala, Paisley } from "@/components/ornaments";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { getCollections, getProducts, getSettings, getTestimonials, isSoldOut } from "@/lib/catalog";
import { crafts } from "@/lib/crafts";
import { categories, site } from "@/lib/site";

export const revalidate = 300;

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function HomePage() {
  const [products, collections, settings, testimonials] = await Promise.all([
    getProducts(),
    getCollections(),
    getSettings(),
    getTestimonials(),
  ]);
  const available = products.filter((p) => !isSoldOut(p));
  const newest = [...available].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 8);
  const featured = available.filter((p) => p.featured).slice(0, 4);
  const heroProduct = featured[0] ?? newest[0];
  const storyProduct = featured[1] ?? newest[1];
  const categoryTiles = categories
    .map((c) => ({ ...c, product: available.find((p) => p.type === c.type) }))
    .filter((c) => c.product)
    .slice(0, 2);

  // Feature the crafts actually in the catalog first, then fill to six.
  const carried = new Set(products.map((p) => p.craft).filter(Boolean));
  const craftCards = [...crafts.filter((c) => carried.has(c.value)), ...crafts.filter((c) => !carried.has(c.value))].slice(
    0,
    6,
  );

  return (
    <>
      <Hero
        title={settings.heroTitle || "Heirlooms from the looms of North India"}
        subtitle={settings.heroSubtitle || site.description}
        image={settings.heroImage ?? heroProduct?.images[0]}
        videoUrl={settings.heroVideoUrl}
        poster={settings.heroImage?.url}
      />

      <Marquee />

      {/* Promises */}
      <section className="border-b border-line">
        <ul className="container-page grid grid-cols-3 gap-2 py-5 text-center text-xs text-muted md:text-sm">
          <li className="flex flex-col items-center gap-1.5 md:flex-row md:justify-center md:gap-2" data-reveal style={delay(0)}>
            <LeafIcon size={20} className="text-zari" /> Handpicked in India
          </li>
          {settings.freeShippingThreshold > 0 && (
            <li className="flex flex-col items-center gap-1.5 md:flex-row md:justify-center md:gap-2" data-reveal style={delay(1)}>
              <TruckIcon size={20} className="text-zari" /> Free shipping ${settings.freeShippingThreshold}+
            </li>
          )}
          <li className="flex flex-col items-center gap-1.5 md:flex-row md:justify-center md:gap-2" data-reveal style={delay(2)}>
            <ReturnIcon size={20} className="text-zari" /> {settings.returnDays}-day returns
          </li>
        </ul>
      </section>

      {/* Category arches */}
      {categoryTiles.length > 0 && (
        <section className="container-page mt-16 md:mt-24">
          <div className="grid gap-12 sm:grid-cols-2 md:gap-10">
            {categoryTiles.map((c, i) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} className="group block text-center" data-reveal style={delay(i)}>
                <div className="relative mx-auto max-w-md">
                  {/* gold outline arch behind the photo */}
                  <div className="arch absolute -inset-2 bg-zari/60" aria-hidden="true" />
                  <div className="arch absolute -inset-[7px] bg-ivory" aria-hidden="true" />
                  <div className="arch relative aspect-[4/5] overflow-hidden bg-sand" data-reveal="curtain">
                    <ProductImage
                      image={c.product!.images[0]}
                      sizes="(min-width: 640px) 45vw, 90vw"
                      className="transition duration-[1400ms] ease-soft group-hover:scale-[1.06]"
                    />
                  </div>
                </div>
                <h2 className="mt-6 text-4xl md:text-5xl">{c.title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-muted">{c.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent">
                  Shop {c.title.toLowerCase()}
                  <ArrowIcon size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Divider className="mt-20 md:mt-28" />

      {/* New arrivals carousel */}
      {newest.length > 0 && (
        <section className="mt-10 md:mt-14">
          <div className="container-page mb-7 flex items-end justify-between">
            <div data-reveal>
              <p className="font-deva text-lg text-accent">नए आगमन</p>
              <h2 className="text-3xl md:text-5xl">New arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="text-sm underline underline-offset-4" data-reveal>
              View all
            </Link>
          </div>
          <ul className="no-scrollbar container-page flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:gap-6">
            {newest.map((p, i) => (
              <li key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
                <ProductCard product={p} morph index={i} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* From the looms: crafts */}
      <section className="relative isolate mt-20 overflow-hidden bg-indigo text-ivory md:mt-28">
        <BorderBand id="looms-band-top" className="text-zari" />
        <JaaliPattern id="looms-jaali" className="pointer-events-none absolute inset-0 -z-10 text-zari-light" opacity={0.1} />
        <Paisley className="animate-float pointer-events-none absolute top-16 -left-10 -z-10 w-40 text-zari/25 md:left-6 md:w-56" />
        <div className="container-page py-16 md:py-24">
          <div className="max-w-2xl" data-reveal>
            <p className="font-deva text-xl text-zari-light">करघे से</p>
            <h2 className="mt-2 text-4xl md:text-6xl">From the looms of North India</h2>
            <p className="mt-4 text-ivory/80 md:text-lg">
              Each piece carries a living tradition, handed down through generations of weavers, embroiderers and dyers
              from Kashmir to Rajasthan.
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {craftCards.map((c, i) => (
              <li key={c.value} data-reveal style={delay(i % 3)}>
                <Link
                  href={`/crafts#${c.value}`}
                  className="group flex h-full flex-col rounded-2xl border border-ivory/15 bg-indigo-deep/40 p-6 backdrop-blur-sm transition duration-500 hover:-translate-y-1 hover:border-zari/60 hover:bg-indigo-deep/70"
                >
                  <span className="font-deva text-3xl text-zari-light">{c.hindi}</span>
                  <span className="mt-3 font-display text-2xl">{c.label}</span>
                  <span className="mt-1 text-xs font-semibold tracking-[0.16em] text-ivory/60 uppercase">{c.region}</span>
                  <span className="mt-3 text-[0.95rem] text-ivory/80">{c.summary}</span>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm text-zari-light">
                    Read the story <ArrowIcon size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center" data-reveal>
            <Link href="/crafts" className="btn border border-zari/70 text-ivory hover:bg-zari hover:text-indigo-deep">
              Explore all the crafts
            </Link>
          </div>
        </div>
        <BorderBand id="looms-band-bottom" className="text-zari" />
      </section>

      {/* Brand story */}
      <section className="container-page mt-20 md:mt-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="relative isolate mx-auto w-full max-w-md md:order-2">
            <Mandala className="animate-spin-slow pointer-events-none absolute -inset-16 -z-10 text-zari/25" />
            <div className="arch relative aspect-[4/5] overflow-hidden bg-sand" data-reveal="curtain">
              {storyProduct && (
                <div className="parallax absolute inset-0">
                  <ProductImage
                    image={storyProduct.images[1] ?? storyProduct.images[0]}
                    sizes="(min-width: 768px) 40vw, 90vw"
                  />
                </div>
              )}
            </div>
          </div>
          <div data-reveal>
            <p className="font-deva text-xl text-accent">हमारी कहानी</p>
            <h2 className="mt-2 text-4xl md:text-6xl">Chosen by hand, made to be treasured</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink/80">
              Every shawl and stole is sourced from northern India and handpicked for how it feels, how it drapes and
              how long it will last. Natural fibres, honest craftsmanship, and colours you&apos;ll reach for again and
              again.
            </p>
            <Link href="/about" className="btn btn-outline mt-8">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-page mt-20 md:mt-28">
          <div className="mb-7 text-center" data-reveal>
            <p className="font-deva text-lg text-accent">विशेष</p>
            <h2 className="text-3xl md:text-5xl">Featured pieces</h2>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {featured.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} index={i} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Real customer reviews (only shown once added in the admin) */}
      {testimonials.length > 0 && (
        <section className="mt-20 bg-sand py-16 md:mt-28 md:py-24">
          <div className="container-page">
            <div className="mb-10 text-center" data-reveal>
              <p className="font-deva text-lg text-accent">आपके शब्द</p>
              <h2 className="text-3xl md:text-5xl">Kind words from our customers</h2>
              {settings.etsyRating && (
                <p className="mt-3 text-muted">
                  <span className="text-marigold">★</span> {settings.etsyRating.toFixed(1)} on Etsy
                  {settings.etsyReviewCount ? ` · ${settings.etsyReviewCount} reviews` : ""}
                </p>
              )}
            </div>
            <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
              {testimonials.map((t, i) => (
                <li
                  key={t.id}
                  className="w-[85%] shrink-0 snap-center rounded-2xl border border-line bg-ivory p-7 md:w-auto"
                  data-reveal
                  style={delay(i % 3)}
                >
                  <p className="font-display text-5xl leading-none text-zari" aria-hidden="true">
                    “
                  </p>
                  <blockquote className="mt-1 leading-relaxed">{t.quote}</blockquote>
                  <p className="mt-5 text-sm font-medium">
                    {t.name}
                    {t.location && <span className="font-normal text-muted"> · {t.location}</span>}
                  </p>
                  {t.product && <p className="text-xs text-muted">{t.product}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Collections as small arches */}
      {collections.length > 0 && (
        <section className="container-page mt-20 md:mt-28">
          <h2 className="mb-8 text-center text-3xl md:text-5xl" data-reveal>
            Shop by occasion
          </h2>
          <ul className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:px-0">
            {collections.map((c, i) => (
              <li key={c.slug} className="w-[38%] shrink-0 md:w-auto" data-reveal style={delay(i)}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="arch relative aspect-[3/4] overflow-hidden bg-sand">
                    <ProductImage
                      image={c.image}
                      sizes="(min-width: 768px) 20vw, 40vw"
                      className="transition duration-[1200ms] ease-soft group-hover:scale-[1.08]"
                    />
                  </div>
                  <p className="mt-3 text-center text-[0.95rem] transition-colors group-hover:text-accent">{c.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Etsy */}
      <section className="container-page mt-20 md:mt-28">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white text-center" data-reveal>
          <BorderBand id="etsy-band" className="text-zari" />
          <div className="px-6 py-12 md:py-16">
            <p className="eyebrow">Also on Etsy</p>
            <h2 className="mt-3 text-3xl md:text-5xl">Prefer to shop on Etsy?</h2>
            {settings.etsyRating && (
              <p className="mt-3 text-lg">
                <span className="tracking-widest text-marigold">★★★★★</span> {settings.etsyRating.toFixed(1)}
                {settings.etsyReviewCount ? ` from ${settings.etsyReviewCount} reviews` : ""}
              </p>
            )}
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Our full collection is on Etsy too, with the same pieces and the same care. Read customer reviews there, or
              check out with your Etsy account.
            </p>
            <a href={site.etsyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-7">
              Visit our Etsy shop
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
