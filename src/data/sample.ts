/**
 * Built-in sample catalog.
 *
 * The site uses this until a Sanity project is connected (see ADMIN_GUIDE.md),
 * so a fresh Vercel deploy looks complete. Once Sanity is connected, real
 * products from the admin replace everything here.
 */
import type { Collection, ContentPage, Product, ProductImage, SwatchPattern, Testimonial } from "@/lib/types";

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
    slug: "om-namah-shivaya-prayer-shawl",
    title: "Om Namah Shivaya Prayer Shawl",
    type: "shawl",
    price: 38,
    shortDescription: "A saffron prayer shawl printed with ॐ and the Om Namah Shivaya mantra, for puja, meditation and yoga.",
    description: [
      "A lightweight saffron shawl printed with the sacred ॐ and the Om Namah Shivaya mantra. Drape it over the shoulders during puja, meditation or yoga, or give it as a meaningful gift.",
    ],
    colors: ["mustard", "red"],
    material: "cotton",
    craft: "block-print",
    origin: "Varanasi, Uttar Pradesh",
    dimensions: "40 × 80 in (102 × 203 cm)",
    palette: ["#d9861c", "#8e2a18"],
    patterns: ["block", "plain", "stripe"],
    featured: true,
    isNew: true,
    collections: ["gifts", "for-him", "under-60"],
    daysAgo: 1,
  },
  {
    slug: "punjabi-oswal-lohi-wool-shawl",
    title: "Punjabi Oswal Lohi Wool Shawl",
    type: "shawl",
    price: 45,
    shortDescription:
      "A generous Punjabi lohi in soft wool-touch fabric. Warm and elegant for men and women through the winter months.",
    description: [
      "The lohi is Punjab's classic winter shawl: large enough to wrap around the shoulders, and simple enough to wear every day. This one is by Oswal, a well-known Punjabi mill, in a soft wool-touch fabric.",
      "It's unisex and versatile, good for everyday wear, meditation, prayer or a cosy winter morning. Each lohi carries the tradition of Punjab, blending everyday comfort with cultural roots.",
    ],
    colors: ["beige", "grey"],
    material: "wool-blend",
    origin: "Ludhiana, Punjab",
    dimensions: "50 × 95 in (127 × 241 cm)",
    palette: ["#b9a58a", "#5b4a3a"],
    patterns: ["stripe", "plain", "jaali"],
    featured: true,
    collections: ["winter-warmth", "for-him", "gifts"],
    etsyUrl: "https://www.etsy.com/listing/1832655059/punjabi-wool-shawl-indian-lohi-warm",
    daysAgo: 2,
  },
  {
    slug: "maroon-zari-wedding-shawl",
    title: "Maroon Zari Wedding Shawl",
    type: "shawl",
    price: 79,
    shortDescription: "Deep maroon with a shimmering zari border, for weddings, sangeet and festive evenings.",
    colors: ["burgundy"],
    material: "silk-blend",
    craft: "banarasi",
    origin: "Varanasi, Uttar Pradesh",
    dimensions: "40 × 80 in (102 × 203 cm)",
    palette: ["#5e1622", "#d6ab5e"],
    patterns: ["paisley", "plain", "jaali"],
    isNew: true,
    collections: ["wedding", "evening-occasion"],
    daysAgo: 5,
  },
  {
    slug: "midnight-sozni-embroidered-pashmina-shawl",
    title: "Midnight Sozni Pashmina Shawl",
    type: "shawl",
    price: 89,
    shortDescription: "Deep indigo pashmina with hand sozni embroidery of paisleys along both borders.",
    description: [
      "A generous shawl in featherlight pashmina, with borders hand-embroidered in the sozni tradition of Kashmir. Fine silk thread traces butas (paisleys) and chinar leaves along both ends.",
      "Each piece is handpicked and checked before it ships. Small variations in the needlework are the mark of the artisan's hand.",
    ],
    colors: ["navy"],
    material: "pashmina",
    craft: "sozni",
    origin: "Srinagar, Kashmir",
    dimensions: "200 × 70 cm (79 × 28 in)",
    palette: ["#1f2a4d", "#c9a86a"],
    patterns: ["paisley", "plain", "jaali"],
    featured: true,
    collections: ["evening-occasion", "gifts"],
    daysAgo: 9,
  },
  {
    slug: "ivory-kashmiri-cashmere-stole",
    title: "Ivory Kashmiri Cashmere Stole",
    type: "stole",
    price: 64,
    shortDescription: "A soft ivory stole with a fine herringbone weave and hand-twisted fringe.",
    description: [
      "Soft, warm and easy to wear, this ivory stole has a fine herringbone weave and a hand-twisted fringe. It goes with almost anything, from a winter coat to a wedding outfit.",
    ],
    colors: ["ivory"],
    material: "cashmere",
    craft: "pashmina",
    origin: "Srinagar, Kashmir",
    dimensions: "180 × 60 cm (71 × 24 in)",
    palette: ["#f1e9da", "#c8b48f"],
    patterns: ["plain", "jaali", "paisley"],
    featured: true,
    isNew: true,
    collections: ["wedding", "gifts"],
    daysAgo: 1,
  },
  {
    slug: "saffron-banarasi-silk-stole",
    title: "Saffron Banarasi Silk Stole",
    type: "stole",
    price: 48,
    compareAtPrice: 58,
    shortDescription: "Glowing saffron silk with zari butis, woven in Varanasi.",
    colors: ["mustard"],
    material: "silk-blend",
    craft: "banarasi",
    origin: "Varanasi, Uttar Pradesh",
    dimensions: "180 × 55 cm (71 × 22 in)",
    palette: ["#d18f1c", "#7a3d0c"],
    patterns: ["block", "plain", "stripe"],
    isNew: true,
    collections: ["under-60", "evening-occasion"],
    daysAgo: 2,
  },
  {
    slug: "forest-kullu-wool-shawl",
    title: "Forest Kullu Wool Shawl",
    type: "shawl",
    price: 76,
    shortDescription: "Warm Himalayan wool with a traditional geometric Kullu border.",
    colors: ["green", "ivory"],
    material: "wool",
    craft: "kullu",
    origin: "Kullu Valley, Himachal Pradesh",
    dimensions: "200 × 75 cm (79 × 30 in)",
    palette: ["#35593a", "#efe5cf"],
    patterns: ["jaali", "stripe", "plain"],
    featured: true,
    collections: ["winter-warmth"],
    daysAgo: 10,
  },
  {
    slug: "blush-chikankari-scarf",
    title: "Blush Chikankari Scarf",
    type: "scarf",
    price: 32,
    shortDescription: "Breathable blush modal with delicate chikankari shadow-work from Lucknow.",
    colors: ["pink"],
    material: "modal",
    craft: "chikankari",
    origin: "Lucknow, Uttar Pradesh",
    dimensions: "180 × 70 cm (71 × 28 in)",
    palette: ["#e3a5b0", "#fbeef0"],
    patterns: ["paisley", "plain", "jaali"],
    collections: ["under-60", "gifts"],
    daysAgo: 14,
  },
  {
    slug: "burgundy-jamawar-pashmina-shawl",
    title: "Burgundy Jamawar Pashmina Shawl",
    type: "shawl",
    price: 94,
    shortDescription: "Rich maroon pashmina covered in woven jamawar paisleys of gold and rose.",
    colors: ["burgundy"],
    material: "pashmina",
    craft: "jamawar",
    origin: "Srinagar, Kashmir",
    dimensions: "200 × 70 cm (79 × 28 in)",
    palette: ["#6b1a26", "#d6a85b"],
    patterns: ["paisley", "jaali", "plain"],
    featured: true,
    collections: ["evening-occasion", "winter-warmth", "wedding"],
    daysAgo: 20,
  },
  {
    slug: "charcoal-pashmina-travel-wrap",
    title: "Charcoal Pashmina Travel Wrap",
    type: "wrap",
    price: 118,
    shortDescription: "An oversized charcoal pashmina, generous enough to use as a travel blanket.",
    colors: ["grey", "black"],
    material: "pashmina",
    craft: "pashmina",
    origin: "Srinagar, Kashmir",
    dimensions: "230 × 100 cm (91 × 39 in)",
    palette: ["#39393b", "#8d8d90"],
    patterns: ["plain", "jaali", "stripe"],
    collections: ["winter-warmth"],
    stock: 2,
    daysAgo: 25,
  },
  {
    slug: "peacock-bandhani-silk-stole",
    title: "Peacock Bandhani Silk Stole",
    type: "stole",
    price: 58,
    shortDescription: "Hand-tied bandhani dots scattered like stars across peacock-teal silk.",
    colors: ["teal"],
    material: "silk",
    craft: "bandhani",
    origin: "Jaipur, Rajasthan",
    dimensions: "180 × 50 cm (71 × 20 in)",
    palette: ["#1c5a57", "#f2d9a0"],
    patterns: ["bandhani", "plain", "stripe"],
    isNew: true,
    collections: ["under-60", "evening-occasion"],
    daysAgo: 4,
  },
  {
    slug: "rust-himalayan-wool-scarf",
    title: "Rust Himalayan Wool Scarf",
    type: "scarf",
    price: 42,
    shortDescription: "A warm rust scarf in soft mountain wool with a classic herringbone weave.",
    colors: ["rust"],
    material: "wool",
    origin: "Himachal Pradesh",
    dimensions: "180 × 35 cm (71 × 14 in)",
    palette: ["#9c4623", "#e0b48f"],
    patterns: ["stripe", "plain", "jaali"],
    collections: ["under-60", "winter-warmth"],
    daysAgo: 30,
  },
  {
    slug: "lavender-kani-shawl",
    title: "Lavender Kani Shawl",
    type: "shawl",
    price: 108,
    shortDescription: "Soft lavender with a kani-woven border of plum, ivory and gold.",
    colors: ["purple"],
    material: "wool",
    craft: "kani",
    origin: "Kanihama, Kashmir",
    dimensions: "200 × 70 cm (79 × 28 in)",
    palette: ["#86709f", "#f1e6f2"],
    patterns: ["paisley", "plain", "jaali"],
    collections: ["wedding"],
    stock: 0,
    daysAgo: 40,
  },
  {
    slug: "marigold-block-print-cotton-stole",
    title: "Marigold Block-Print Cotton Stole",
    type: "stole",
    price: 28,
    shortDescription: "Breathable cotton, hand block-printed with butas in Bagru. Made for summer and travel.",
    colors: ["mustard", "red"],
    material: "cotton",
    craft: "block-print",
    origin: "Bagru, Rajasthan",
    dimensions: "180 × 70 cm (71 × 28 in)",
    palette: ["#e2a21b", "#8e2a18"],
    patterns: ["block", "plain", "stripe"],
    collections: ["under-60", "gifts"],
    daysAgo: 8,
  },
  {
    slug: "black-tilla-evening-stole",
    title: "Black Tilla Evening Stole",
    type: "stole",
    price: 66,
    shortDescription: "Fine black wool with a border of gleaming tilla (gold thread) embroidery.",
    colors: ["black"],
    material: "wool",
    craft: "tilla",
    origin: "Srinagar, Kashmir",
    dimensions: "180 × 60 cm (71 × 24 in)",
    palette: ["#1e1a18", "#c9a45c"],
    patterns: ["paisley", "plain", "jaali"],
    collections: ["evening-occasion", "wedding"],
    daysAgo: 12,
  },
  {
    slug: "rani-pink-phulkari-stole",
    title: "Rani Pink Phulkari Stole",
    type: "stole",
    price: 72,
    shortDescription: "Radiant silk-floss phulkari blooms on rani pink, embroidered by hand in Punjab.",
    colors: ["pink", "mustard"],
    material: "cotton",
    craft: "phulkari",
    origin: "Patiala, Punjab",
    dimensions: "220 × 100 cm (87 × 39 in)",
    palette: ["#a8295e", "#f0b53a"],
    patterns: ["jaali", "plain", "block"],
    isNew: true,
    collections: ["wedding", "gifts"],
    daysAgo: 6,
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
    title: "Wedding Shawls & Wraps",
    description: "Elegant pieces for brides, grooms, family and guests, from mehndi to reception.",
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
  { slug: "for-him", title: "For Him", description: "Lohis and shawls for men: warm, classic and easy to wear." },
  { slug: "under-60", title: "Under $60", description: "Beautiful pieces at an easy price." },
].map((c) => {
  const first = sampleProducts.find((p) => p.collections.includes(c.slug));
  return { ...c, image: first?.images[0] };
});

export const samplePages: ContentPage[] = [
  {
    slug: "about",
    title: "Our story",
    intro:
      "Every piece we carry is sourced from northern India, from the snowy valleys of Kashmir to the busy workshops of Varanasi, Lucknow and Rajasthan.",
    body: [
      {
        paragraphs: [
          "Om Threads Boutique began with a love for the textiles of North India, and for the artisans who keep centuries-old crafts alive. Pashmina hand-spun in Srinagar. Kani shawls woven bobbin by bobbin. Phulkari stitched in Punjab, Banarasi silk, and Lucknow's chikankari. Each tradition has its own language of pattern and colour.",
          "We choose every shawl and stole by hand, for how it feels, how it drapes and how long it will last. Then we bring it from its home in India to ours in Lake Villa, Illinois, and ship it on to you.",
        ],
      },
      {
        heading: "Why “Om”",
        paragraphs: [
          "ॐ (Om) is the sound at the heart of stillness. We hope each piece brings a little of that calm: something soft to wrap yourself in, or a gift that tells someone they are cherished.",
        ],
      },
      {
        heading: "What we promise",
        paragraphs: [
          "Every item is inspected before it ships. Our photos show true colours in natural light. Handmade textiles carry small irregularities; they are the signature of the maker, not flaws. And if something isn't right, we'll make it right.",
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
          "Every order ships from Lake Villa, Illinois, and is packed within 1–2 business days. Most US orders arrive within 3–7 business days; tracking is emailed as soon as it ships.",
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
        heading: "What is a lohi?",
        paragraphs: [
          "A lohi is the traditional Punjabi winter shawl: large, warm and worn by men and women alike. It's ideal for cold mornings, prayer and meditation, or layering over a coat.",
        ],
      },
      {
        heading: "Do you have shawls for weddings?",
        paragraphs: [
          "Yes. Our Wedding Shawls & Wraps collection has pieces for brides, grooms, family and guests. Message us if you need several matching pieces for a wedding party.",
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
          "All orders ship from Lake Villa, Illinois, within 1–2 business days. You'll receive tracking details by email as soon as your order ships. Most US orders arrive within 3–7 business days.",
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

/**
 * Layout placeholders only, shown in preview mode. They are not real
 * reviews. Add your actual Etsy reviews in the admin under "Customer reviews".
 */
export const samplePlaceholderReviews: Testimonial[] = [
  {
    id: "placeholder-1",
    quote: "Your customer's review will appear here, for example how soft the shawl feels and how quickly it arrived.",
    name: "Sample review",
    location: "Add real reviews in the admin",
  },
  {
    id: "placeholder-2",
    quote: "A second review goes here. Short quotes of one or two sentences look best in this space.",
    name: "Sample review",
    product: "Punjabi Oswal Lohi Wool Shawl",
  },
  {
    id: "placeholder-3",
    quote: "A third review goes here. Wedding and gift stories work especially well.",
    name: "Sample review",
    product: "Maroon Zari Wedding Shawl",
  },
];
