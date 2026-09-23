/**
 * Built-in sample catalog.
 *
 * The site uses this until a Sanity project is connected (see ADMIN_GUIDE.md),
 * so a fresh Vercel deploy looks complete. Once Sanity is connected, real
 * products from the admin replace everything here.
 */
import type { Collection, ContentPage, Product, ProductImage, SwatchPattern } from "@/lib/types";

function swatches(
  title: string,
  base: string,
  accent: string,
  patterns: SwatchPattern[] = ["weave", "plain", "stripe"],
): ProductImage[] {
  return patterns.map((pattern, i) => ({
    alt: `${title}, ${["full view", "texture close-up", "draped detail"][i] ?? "detail"}`,
    swatch: { base, accent, pattern },
  }));
}

type Seed = Omit<Product, "id" | "images" | "featured" | "isNew" | "collections" | "publishedAt"> &
  Partial<Pick<Product, "featured" | "isNew" | "collections">> & {
    palette: [string, string];
    patterns?: SwatchPattern[];
    daysAgo: number;
  };

const seeds: Seed[] = [
  {
    slug: "midnight-embroidered-pashmina-shawl",
    title: "Midnight Embroidered Pashmina Shawl",
    type: "shawl",
    price: 89,
    shortDescription: "Deep navy pashmina with hand-finished paisley embroidery along both borders.",
    description: [
      "A generous shawl in featherlight pashmina, finished with tonal paisley embroidery along both borders. Warm enough for a winter evening, and fine enough to fold into a handbag.",
      "Each piece is handpicked and checked before it ships, so small variations in the embroidery are part of its character.",
    ],
    colors: ["navy"],
    material: "pashmina",
    dimensions: "200 × 70 cm (79 × 28 in)",
    palette: ["#1f2e4d", "#c9a86a"],
    patterns: ["paisley", "plain", "weave"],
    featured: true,
    collections: ["evening-occasion", "gifts"],
    daysAgo: 3,
  },
  {
    slug: "ivory-cashmere-blend-stole",
    title: "Ivory Cashmere-Blend Stole",
    type: "stole",
    price: 64,
    shortDescription: "A soft ivory stole with a fine herringbone weave and hand-twisted fringe.",
    description: [
      "Soft, warm and easy to wear, this ivory stole has a fine herringbone weave and hand-twisted fringe. It goes with almost everything, from a winter coat to a wedding outfit.",
    ],
    colors: ["ivory"],
    material: "cashmere",
    dimensions: "180 × 60 cm (71 × 24 in)",
    palette: ["#f1e9da", "#cdbd9f"],
    featured: true,
    isNew: true,
    collections: ["wedding", "gifts"],
    daysAgo: 1,
  },
  {
    slug: "saffron-silk-blend-stole",
    title: "Saffron Silk-Blend Stole",
    type: "stole",
    price: 48,
    compareAtPrice: 58,
    shortDescription: "Glowing saffron silk blend with a subtle sheen. Lightweight for warmer days.",
    colors: ["mustard"],
    material: "silk-blend",
    dimensions: "180 × 55 cm (71 × 22 in)",
    palette: ["#c99a2e", "#8a5a17"],
    patterns: ["stripe", "plain", "weave"],
    isNew: true,
    collections: ["under-60"],
    daysAgo: 2,
  },
  {
    slug: "forest-wool-jacquard-shawl",
    title: "Forest Wool Jacquard Shawl",
    type: "shawl",
    price: 76,
    shortDescription: "A reversible jacquard shawl in forest green and cream, made in wool for cold days.",
    colors: ["green", "ivory"],
    material: "wool",
    dimensions: "200 × 75 cm (79 × 30 in)",
    palette: ["#3f6b3a", "#efe5cf"],
    patterns: ["weave", "paisley", "plain"],
    featured: true,
    collections: ["winter-warmth"],
    daysAgo: 10,
  },
  {
    slug: "blush-modal-everyday-scarf",
    title: "Blush Modal Everyday Scarf",
    type: "scarf",
    price: 32,
    shortDescription: "A breathable blush-pink modal scarf that softens with every wash.",
    colors: ["pink"],
    material: "modal",
    dimensions: "180 × 70 cm (71 × 28 in)",
    palette: ["#e3a5b0", "#f7dfe3"],
    patterns: ["plain", "weave", "stripe"],
    collections: ["under-60", "gifts"],
    daysAgo: 14,
  },
  {
    slug: "burgundy-paisley-pashmina-shawl",
    title: "Burgundy Paisley Pashmina Shawl",
    type: "shawl",
    price: 94,
    shortDescription: "Rich burgundy pashmina with an all-over woven paisley in gold and rose.",
    colors: ["burgundy"],
    material: "pashmina",
    dimensions: "200 × 70 cm (79 × 28 in)",
    palette: ["#6d1f2c", "#d4a55c"],
    patterns: ["paisley", "weave", "plain"],
    featured: true,
    collections: ["evening-occasion", "winter-warmth"],
    daysAgo: 20,
  },
  {
    slug: "charcoal-cashmere-wrap",
    title: "Charcoal Cashmere Wrap",
    type: "wrap",
    price: 118,
    shortDescription: "An oversized charcoal cashmere wrap, generous enough to use as a travel blanket.",
    colors: ["grey", "black"],
    material: "cashmere",
    dimensions: "230 × 100 cm (91 × 39 in)",
    palette: ["#3b3b3d", "#8d8d90"],
    patterns: ["plain", "weave", "stripe"],
    collections: ["winter-warmth"],
    stock: 2,
    daysAgo: 25,
  },
  {
    slug: "teal-ombre-silk-stole",
    title: "Teal Ombré Silk Stole",
    type: "stole",
    price: 58,
    shortDescription: "Hand-dyed silk fading from deep teal to seafoam, light and fluid.",
    colors: ["teal"],
    material: "silk",
    dimensions: "180 × 50 cm (71 × 20 in)",
    palette: ["#1f6f6b", "#9fd1c7"],
    patterns: ["stripe", "plain", "weave"],
    isNew: true,
    collections: ["under-60", "evening-occasion"],
    daysAgo: 4,
  },
  {
    slug: "rust-herringbone-wool-scarf",
    title: "Rust Herringbone Wool Scarf",
    type: "scarf",
    price: 42,
    shortDescription: "A warm rust scarf with a classic herringbone weave and short fringe.",
    colors: ["rust"],
    material: "wool",
    dimensions: "180 × 35 cm (71 × 14 in)",
    palette: ["#a4502a", "#e0b48f"],
    collections: ["under-60", "winter-warmth"],
    daysAgo: 30,
  },
  {
    slug: "lavender-kani-weave-shawl",
    title: "Lavender Kani-Weave Shawl",
    type: "shawl",
    price: 108,
    shortDescription: "Soft lavender with an intricate kani-style woven border in plum and ivory.",
    colors: ["purple"],
    material: "wool",
    dimensions: "200 × 70 cm (79 × 28 in)",
    palette: ["#8f78a8", "#efe5f2"],
    patterns: ["paisley", "plain", "weave"],
    collections: ["wedding"],
    stock: 0,
    daysAgo: 40,
  },
  {
    slug: "sunset-stripe-cotton-stole",
    title: "Sunset Stripe Cotton Stole",
    type: "stole",
    price: 28,
    shortDescription: "Breathable cotton with warm sunset stripes, perfect for summer and travel.",
    colors: ["multi", "red"],
    material: "cotton",
    dimensions: "180 × 70 cm (71 × 28 in)",
    palette: ["#b3261e", "#e9a13b"],
    patterns: ["stripe", "weave", "plain"],
    collections: ["under-60", "gifts"],
    daysAgo: 8,
  },
  {
    slug: "black-sequin-evening-stole",
    title: "Black Evening Stole with Beaded Edge",
    type: "stole",
    price: 66,
    shortDescription: "A sheer black stole with a delicate beaded edge, for weddings and evenings out.",
    colors: ["black"],
    material: "viscose",
    dimensions: "180 × 60 cm (71 × 24 in)",
    palette: ["#1f1f1f", "#b9a37a"],
    patterns: ["weave", "plain", "paisley"],
    collections: ["evening-occasion", "wedding"],
    daysAgo: 12,
  },
];

const now = Date.now();

export const sampleProducts: Product[] = seeds.map(({ palette, patterns, daysAgo, ...s }, i) => ({
  id: `sample-${i + 1}`,
  featured: false,
  isNew: false,
  collections: [],
  ...s,
  images: swatches(s.title, palette[0], palette[1], patterns),
  care:
    s.care ??
    (s.material === "cotton" || s.material === "modal"
      ? "Hand wash cold with a mild detergent. Dry flat in the shade and press on low heat."
      : "Dry clean or hand wash gently in cold water with a wool or silk shampoo. Do not wring. Dry flat, away from direct sun."),
  etsyUrl: s.etsyUrl ?? "https://omthreadsboutique.etsy.com",
  publishedAt: new Date(now - daysAgo * 86_400_000).toISOString(),
}));

export const sampleCollections: Collection[] = [
  {
    slug: "wedding",
    title: "Wedding & Bridal",
    description: "Light, elegant pieces for brides, bridesmaids and guests.",
  },
  {
    slug: "evening-occasion",
    title: "Evening & Occasion",
    description: "Pieces with sheen, embroidery and drape, for when it matters.",
  },
  {
    slug: "winter-warmth",
    title: "Winter Warmth",
    description: "Wool, cashmere and pashmina for cold days.",
  },
  { slug: "gifts", title: "Thoughtful Gifts", description: "Easy-to-love pieces, ready to gift." },
  { slug: "under-60", title: "Under $60", description: "Beautiful pieces at an easy price." },
].map((c) => {
  const first = sampleProducts.find((p) => p.collections.includes(c.slug));
  return { ...c, image: first?.images[0] };
});

export const samplePages: ContentPage[] = [
  {
    slug: "about",
    title: "Our story",
    intro: "Om Threads Boutique began with a simple love for beautiful textiles and the hands that make them.",
    body: [
      {
        paragraphs: [
          "Every shawl and stole in our collection is handpicked for how it feels, how it drapes and how long it will last. We look for natural fibers, honest craftsmanship and colors you'll reach for again and again.",
          "“Om” is a reminder to slow down. We hope each piece brings a little of that calm: something soft to wrap yourself in, or a gift that shows someone you care.",
        ],
      },
      {
        heading: "What we promise",
        paragraphs: [
          "Every item is inspected before it ships. Photos show true colors, taken in natural light. And if something isn't right, we'll make it right.",
        ],
      },
    ],
  },
  {
    slug: "care-guide",
    title: "Care & styling guide",
    intro: "A little care keeps natural fibers soft and beautiful for years.",
    body: [
      {
        heading: "Pashmina, cashmere & wool",
        paragraphs: [
          "Dry clean, or hand wash in cold water with a gentle wool shampoo. Press out water with a towel instead of wringing, and dry flat in the shade.",
          "Store folded (never hung) with a cedar block or lavender sachet to keep moths away.",
        ],
      },
      {
        heading: "Silk & silk blends",
        paragraphs: [
          "Hand wash cold with a silk-safe detergent, or dry clean. Iron on the lowest setting from the reverse side.",
        ],
      },
      {
        heading: "Cotton, modal & viscose",
        paragraphs: ["Hand wash cold and dry flat. Press on low to medium heat."],
      },
      {
        heading: "Five ways to wear a shawl",
        paragraphs: [
          "Classic drape: over both shoulders, ends hanging in front.",
          "One-shoulder toss: one end thrown back over the opposite shoulder.",
          "Belted: drape, then cinch at the waist with a slim belt over a coat or dress.",
          "Loop: fold in half, place around the neck and pull the ends through the loop.",
          "Travel wrap: unfold fully and use as a light blanket on planes and trains.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    body: [
      {
        heading: "How long does shipping take?",
        paragraphs: [
          "Orders are packed within 1–2 business days. Delivery times depend on your location and are shown at checkout.",
        ],
      },
      {
        heading: "Can I return or exchange an item?",
        paragraphs: [
          "Yes. Unworn items in original condition can be returned within 30 days. See our Returns policy for details.",
        ],
      },
      {
        heading: "What's the difference between a shawl and a stole?",
        paragraphs: [
          "Shawls are larger and wider, made to wrap around you. Stoles are narrower and lighter, made to drape over the shoulders or wear as a scarf.",
        ],
      },
      {
        heading: "Can I buy on Etsy instead?",
        paragraphs: [
          "Of course. Every product page has a “Buy on Etsy” button, and our full shop is at omthreadsboutique.etsy.com.",
        ],
      },
      {
        heading: "Do you offer gift wrapping?",
        paragraphs: ["Yes. Leave a note at checkout and we'll wrap it with a handwritten card."],
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping policy",
    body: [
      {
        paragraphs: [
          "Orders are processed within 1–2 business days. You'll receive tracking details by email as soon as your order ships.",
          "Update this page in the admin with your carriers, delivery times, international shipping and any free-shipping threshold.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & exchanges",
    body: [
      {
        paragraphs: [
          "We want you to love your piece. Unworn, unwashed items with tags can be returned within 30 days of delivery for a refund or exchange.",
          "Update this page in the admin with your exact return window, who pays return shipping and how to start a return.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    body: [
      {
        paragraphs: [
          "We only collect the information needed to fulfil your order and, if you choose, send you our newsletter. We never sell your data.",
          "Replace this placeholder with a complete privacy policy before accepting payments on this site.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of sale",
    body: [
      {
        paragraphs: [
          "Replace this placeholder with your terms of sale (pricing, payment, shipping, returns and liability) before accepting payments on this site.",
        ],
      },
    ],
  },
];
