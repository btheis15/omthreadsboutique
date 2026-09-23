import type { Metadata } from "next";
import Link from "next/link";
import { BorderBand, Divider, JaaliPattern, Mandala, Paisley } from "@/components/ornaments";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/catalog";
import { crafts } from "@/lib/crafts";

export const metadata: Metadata = {
  title: "The crafts of North India",
  description:
    "A guide to the textile traditions behind our shawls and stoles: Pashmina, Kani, Sozni, Jamawar, Kullu, Phulkari, Banarasi, Chikankari, Bandhani and hand block printing.",
  alternates: { canonical: "/crafts" },
};

export const revalidate = 300;

export default async function CraftsPage() {
  const products = await getProducts();
  return (
    <>
      <section className="relative isolate overflow-hidden bg-indigo-deep text-ivory">
        <JaaliPattern id="crafts-jaali" className="pointer-events-none absolute inset-0 -z-10 text-zari-light" opacity={0.1} />
        <Mandala className="animate-spin-slow pointer-events-none absolute -right-40 -bottom-48 -z-10 size-[36rem] text-zari/20" />
        <div className="container-page py-20 md:py-28">
          <p className="animate-rise font-deva text-2xl text-zari-light">शिल्प</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-5xl md:text-7xl" style={{ "--i": 1 } as React.CSSProperties}>
            The crafts of North India
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-ivory/80 md:text-lg" style={{ "--i": 2 } as React.CSSProperties}>
            From Himalayan valleys to the plains of the Ganga, every region has its own language of thread. Here are the
            traditions behind the pieces we carry.
          </p>
          <nav
            aria-label="Crafts"
            className="animate-rise no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto px-4"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {crafts.map((c) => (
              <a
                key={c.value}
                href={`#${c.value}`}
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-ivory/25 px-4 text-sm hover:border-zari-light hover:text-zari-light"
              >
                {c.label}
              </a>
            ))}
          </nav>
        </div>
        <BorderBand id="crafts-band" className="text-zari" />
      </section>

      <div className="container-page">
        {crafts.map((c, i) => {
          const pieces = products.filter((p) => p.craft === c.value).slice(0, 4);
          const flip = i % 2 === 1;
          return (
            <section key={c.value} id={c.value} className="scroll-mt-24 border-b border-line py-16 last:border-0 md:py-24">
              <div className={`grid items-center gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16 ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="relative mx-auto flex aspect-square w-full max-w-xs items-center justify-center" data-reveal>
                  <Mandala className="animate-spin-slow absolute inset-0 text-zari/35" />
                  <div className="arch relative grid h-[70%] w-[58%] place-items-center bg-sand">
                    <Paisley className="w-1/2 text-accent/80" />
                  </div>
                </div>
                <div data-reveal>
                  <p className="font-deva text-4xl text-accent md:text-5xl">{c.hindi}</p>
                  <h2 className="mt-3 text-4xl md:text-5xl">{c.label}</h2>
                  <p className="mt-2 text-xs font-semibold tracking-[0.18em] text-zari uppercase">{c.region}</p>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/85">{c.story}</p>
                  {pieces.length > 0 && (
                    <Link
                      href={`/shop?craft=${c.value}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent underline underline-offset-4"
                    >
                      Shop {c.label} pieces
                    </Link>
                  )}
                </div>
              </div>
              {pieces.length > 0 && (
                <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
                  {pieces.map((p, j) => (
                    <li key={p.id}>
                      <ProductCard product={p} index={j} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        <Divider className="my-10" />
      </div>
    </>
  );
}
