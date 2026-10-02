import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getProduct, getProducts, isSoldOut } from "@/lib/catalog";
import { categories, formatPrice, site, siteUrl } from "@/lib/site";
import type { Product } from "@/lib/types";
import { priceRange } from "@/lib/variants";

/**
 * The card a product link unfolds into when it's texted, posted or shared
 * (iMessage, WhatsApp, Facebook, Pinterest…): the piece's photo beside its
 * name and price, in the shop's colours and type.
 */

export const alt = site.name;
export const size = { width: 1200, height: 630 };
// JPEG keeps the card small enough for WhatsApp and Messenger, which skip big previews.
export const contentType = "image/jpeg";
export const revalidate = 300;

const INK = "#233142";
const MUTED = "#66717f";
const IVORY = "#fdfaf2";
const SAND = "#f4efe3";
const LINE = "#e6dfcf";
const RANI = "#a52b57";
const ZARI = "#b8873a";
const INDIGO = "#2d4b68";

const PHOTO_WIDTH = 540;
const shopApiUrl = (process.env.SHOP_API_URL ?? "").replace(/\/$/, "");

type Props = { params: Promise<{ slug: string }> };

// Drawn ahead of time like the product pages, and redrawn as they are.
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: Props) {
  const product = await getProduct((await params).slug);
  const [kalnia, mukta, muktaBold, logo, photo] = await Promise.all([
    // Spelled out in full so the deploy knows to bundle these files.
    readFile(join(process.cwd(), "src/assets/fonts/Kalnia-Medium.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Mukta-Medium.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Mukta-Bold.ttf")),
    readFile(join(process.cwd(), "src/assets/logo.png")),
    photoFor(product),
  ]);
  const fonts = [
    { name: "Kalnia", data: kalnia, weight: 500 as const, style: "normal" as const },
    { name: "Mukta", data: mukta, weight: 500 as const, style: "normal" as const },
    { name: "Mukta", data: muktaBold, weight: 700 as const, style: "normal" as const },
  ];
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const domain = new URL(siteUrl()).host;

  if (!product) return asJpeg(new ImageResponse(<Brand logoSrc={logoSrc} domain={domain} />, { ...size, fonts }));

  const range = priceRange(product);
  const price = range.min === range.max ? formatPrice(range.min) : `From ${formatPrice(range.min)}`;
  // As on the shop's product cards: the lowest price, struck beside the original when marked down.
  const wasPrice = product.compareAtPrice && product.compareAtPrice > range.min ? formatPrice(product.compareAtPrice) : undefined;
  const kind = categories.find((c) => c.type === product.type)?.singular;
  const title = clip(product.title, 80);

  return asJpeg(new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: IVORY, fontFamily: "Mukta" }}>
        <div style={{ display: "flex", width: PHOTO_WIDTH, height: "100%", background: SAND, position: "relative" }}>
          {photo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img src={photo} width={PHOTO_WIDTH} height={size.height} />
          ) : (
            <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={logoSrc} width={300} height={300} />
            </div>
          )}
          <div style={{ position: "absolute", right: 0, top: 0, width: 5, height: "100%", background: ZARI }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 60px 48px 60px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={logoSrc} width={64} height={64} />
            <div style={{ marginLeft: 16, fontSize: 21, fontWeight: 700, letterSpacing: 5, color: ZARI }}>
              OM THREADS BOUTIQUE
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingTop: 14 }}>
            {kind && (
              <div style={{ fontSize: 22, letterSpacing: 4, color: MUTED, marginBottom: 10 }}>{kind.toUpperCase()}</div>
            )}
            <div
              style={{
                fontFamily: "Kalnia",
                fontSize: title.length <= 24 ? 62 : title.length <= 44 ? 52 : 44,
                lineHeight: 1.12,
                color: INK,
              }}
            >
              {title}
            </div>
            <div style={{ width: 72, height: 3, background: ZARI, marginTop: 26, marginBottom: 22 }} />
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <div style={{ fontSize: 46, fontWeight: 700, color: isSoldOut(product) ? MUTED : RANI }}>{price}</div>
              {wasPrice && (
                <div style={{ fontSize: 30, color: MUTED, marginLeft: 16, textDecoration: "line-through" }}>{wasPrice}</div>
              )}
              {isSoldOut(product) && (
                <div
                  style={{
                    marginLeft: 18,
                    fontSize: 22,
                    color: MUTED,
                    border: `2px solid ${LINE}`,
                    borderRadius: 999,
                    padding: "2px 16px",
                  }}
                >
                  Sold out
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 22, color: MUTED }}>{domain}</div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: IVORY,
                background: INDIGO,
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              View the piece →
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  ));
}

/** For a link to a piece that's gone: the shop's own card. */
function Brand({ logoSrc, domain }: { logoSrc: string; domain: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: IVORY,
        fontFamily: "Mukta",
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img src={logoSrc} width={300} height={300} />
      <div style={{ marginTop: 24, fontSize: 30, fontWeight: 700, letterSpacing: 7, color: ZARI }}>OM THREADS BOUTIQUE</div>
      <div style={{ marginTop: 8, fontSize: 24, color: MUTED }}>{domain}</div>
    </div>
  );
}

/** The piece's first photo as a data URL, or nothing if it can't be had (the card then shows the logo). */
async function photoFor(product?: Product): Promise<string | undefined> {
  const url = product?.images.find((i) => i.url)?.url;
  if (!url) return undefined;
  const ours = url.match(/^\/media\/([^/]+)\/(\d+)\.webp$/);
  // Photos from the admin come in set widths (828 is always one of them when the photo is wider).
  const src = ours
    ? shopApiUrl && `${shopApiUrl}/media/${ours[1]}/${Math.min(Number(ours[2]), 828)}.webp`
    : url.includes("cdn.sanity.io")
      ? `${url}?w=828&fm=jpg`
      : undefined;
  if (!src) return undefined;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return undefined;
    // The card can't draw WebP, so the photo is cropped to its panel and handed over as a JPEG.
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(PHOTO_WIDTH, size.height, { fit: "cover" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function asJpeg(card: ImageResponse) {
  const jpeg = await sharp(Buffer.from(await card.arrayBuffer()))
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": contentType } });
}

function clip(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1).replace(/[\s,;:–-]+\S*$/, "")}…`;
}
