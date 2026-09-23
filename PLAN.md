# Om Threads Boutique: Website Plan

A standalone storefront that sits alongside the Etsy shop
([omthreadsboutique.etsy.com](https://omthreadsboutique.etsy.com)) and sells
shawls and stoles.

This document covers the plan for the whole site. No code is written yet. Each
section ends with the decision it needs, and the open questions for the owner
are at the bottom.

---

## 1. Goals

| # | Goal | What "done" looks like |
|---|------|------------------------|
| 1 | **Customers on phones** | Every page is designed at 375px wide first. A customer can go from the home page to checkout with one thumb. |
| 2 | **Professional look and feel** | Large photos, a calm and consistent design, fast page loads, no clutter. It should look like a boutique brand, not a template. |
| 3 | **Easy uploads for the owner** | A new product goes live in under 5 minutes from a phone: add photos, a title, a price and a few taps. No code and no developer. |
| 4 | **Works with Etsy** | The site and the Etsy shop support each other. Etsy reviews and trust carry over, and customers can still buy on Etsy if they prefer. |
| 5 | **Payments added later** | Checkout is designed and built from the start, but real payment processing is switched on in a later phase. Until then, a "Buy on Etsy" button covers sales. |

---

## 2. Recommended tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js (App Router) + TypeScript** | Fast pages that rank well in search and render on the server. Industry standard, so it's easy to hire help later. |
| Styling | **Tailwind CSS** + a small set of custom components | Mobile-first by default, consistent spacing and type, small CSS. |
| Content and products (the "admin") | **Sanity Studio** (headless CMS) | A polished editing app that works on phones: drag-and-drop photos, automatic image cropping and resizing, draft and publish, scheduled publishing. The free tier covers a shop this size. |
| Images | Sanity image CDN (served via `next/image`) | Upload one large photo and every size and format (WebP/AVIF) is made automatically, so photos stay sharp and fast on phones. |
| Hosting | **Vercel** | Deploys automatically from GitHub, has a global CDN and free HTTPS, and preview links for every change. The free or Pro tier is enough. |
| Payments (Phase 3) | **Stripe Checkout** (hosted), optional PayPal | Covers cards, Apple Pay, Google Pay, Link, Klarna and Afterpay. Stripe hosts the card form, so card data never touches our site (see §8). |
| Email | Resend or Postmark (transactional); Mailchimp or Klaviyo (newsletter) | Order confirmations and a "new arrivals" list. |
| Analytics | Vercel Analytics or Plausible (privacy-friendly), Google Search Console | Shows traffic and what sells without a cookie banner (Plausible). |

**Alternative considered: Shopify.** Shopify is the fastest route if you want
payments, tax and shipping labels handled by a platform on day one. It costs
about $39/month plus fees, and design and data are tied to Shopify. The custom
stack above costs about $0–20/month before payment fees and gives you full
control of the brand. Because of that, and because payments are deferred, the
custom stack is the recommendation. The product data model below would move to
Shopify later if you change your mind.

---

## 3. Sitemap

```
/                         Home
/shop                     All products (filter and sort)
/shop/shawls              Collection: Shawls
/shop/stoles              Collection: Stoles
/collections/[slug]       Other collections the owner creates (e.g. "Wedding", "Pashmina", "Gifts under $50")
/product/[slug]           Product detail
/cart                     Cart (also opens as a slide-out drawer)
/checkout                 Checkout (Phase 3; until then goes to "Buy on Etsy")
/about                    Our story
/care-guide               How to care for, wear and drape shawls
/faq                      Shipping, returns, sizing, materials
/contact                  Contact form + Etsy / Instagram links
/policies/shipping        \
/policies/returns          |  Legal and policy pages (edited in the admin)
/policies/privacy          |
/policies/terms           /
/search                   Search results
```

---

## 4. Page-by-page design (mobile-first)

### Global
- **Header** (sticky, slim): menu icon, logo in the center, search and cart
  icons (with item count). On desktop the menu expands into a full top bar.
- **Announcement bar** (editable): e.g. "Free shipping over $75", "Also on Etsy ★ 4.9".
- **Footer**: newsletter signup, links, social links, a "Shop us on Etsy" badge,
  payment icons (once payments are live).
- **Bottom-anchored buttons** on product pages on phones ("Add to cart" always
  within thumb reach).

### Home
1. Full-width hero photo or short video with a single call to action ("Shop the collection").
2. Collection tiles (Shawls / Stoles / featured collection).
3. "New arrivals" carousel (fills automatically from the newest products).
4. Brand story strip (a photo and 2–3 lines about the craft and materials).
5. Social proof: Etsy review count and stars, 3 featured testimonials.
6. "Shop the look" or Instagram grid (optional).
7. Newsletter signup.

### Shop / collection pages
- 2-column product grid on phones, 3–4 columns on desktop.
- Each card: main photo (swaps to a second photo on hover or long-press),
  name, price, a "Sold out" / "New" / "Sale" badge.
- **Filter drawer** (slides up from the bottom on phones): type, color,
  material, price range, occasion. **Sort**: newest, price, best sellers.
- Filters are saved in the URL, so a filtered view can be shared.

### Product page
- Swipeable photo gallery with pinch-to-zoom, plus an optional "worn on model"
  photo and a short video.
- Name, price, star rating (from Etsy reviews), short description.
- **Variant pickers** as color swatches and size chips (only if the product has variants).
- Primary button: **Add to cart** (Phase 3) or **Buy on Etsy** (Phases 1–2).
- Expandable sections: Details (material, size, weight), Care, Shipping and returns.
- "Pairs well with" / "You may also like" row.
- Trust row: handmade, ships from [location], easy returns, secure checkout.

### Cart and checkout (built in Phase 2, switched on in Phase 3)
- Slide-out cart drawer with quantity controls and a running subtotal.
- Optional gift note and gift wrap add-on.
- Checkout hands off to Stripe's hosted page, which gives Apple Pay and Google
  Pay in one tap, followed by an order confirmation page and email.

### About / Care guide / FAQ
- Written and edited in the admin with rich text and images.
- The care guide doubles as search-friendly content ("how to wear a shawl",
  "how to wash a pashmina").

---

## 5. Brand and visual direction

- **Mood:** calm, warm, handcrafted, premium. "Om" suggests mindfulness, so
  the design uses plenty of white space and never feels busy.
- **Palette (proposal, to be matched to the existing logo and photos):**
  warm ivory background, deep ink or charcoal text, one accent drawn from the
  products (e.g. saffron, terracotta or deep teal), and a soft neutral for
  cards and dividers. A dark mode is optional.
- **Type:** an elegant serif for headings (e.g. *Cormorant Garamond* or
  *Fraunces*) and a clean sans-serif for body text and UI (e.g. *Inter*).
- **Photography rules** (these matter most for looking professional):
  consistent background, natural light, a 4:5 portrait crop, at least
  one "draped / worn" shot and one close-up of the texture per product.
  The admin enforces the crop automatically.
- **Accessibility:** WCAG 2.2 AA contrast, tap targets of at least 44px, alt
  text required on every product photo in the admin, full keyboard navigation.

---

## 6. Product data model

This model is what the owner fills in when uploading. Fields marked * are
required; everything else is optional, so a quick upload stays quick.

**Product**
| Field | Type | Notes |
|-------|------|-------|
| Title* | text | e.g. "Hand-embroidered Pashmina Shawl – Midnight Blue" |
| Slug | auto | Made from the title; used in the URL |
| Photos* | image list | Drag to reorder; first photo = main image; alt text* |
| Video | file | Optional short clip |
| Price* | money | Store currency (USD by default) |
| Compare-at price | money | Shows a "Sale" badge when set |
| Type* | Shawl / Stole / Scarf / Wrap … | Drives the main collections |
| Collections | references | Many-to-many (e.g. Wedding, Gifts) |
| Colors | tags | Drives the color filter and swatches |
| Material | select + text | Pashmina, cashmere, silk, wool, viscose, cotton … |
| Dimensions | text/number | e.g. 200 × 70 cm |
| Weight | number | Used for shipping later |
| Short description* | text | 1–2 sentences for cards and search results |
| Full description | rich text | |
| Care instructions | rich text or pick from a preset | Presets save typing |
| Variants | list | Color and size combinations, each with its own price, stock and SKU (optional) |
| Stock quantity | number | Blank = made to order; 0 = sold out |
| Etsy listing URL | url | Drives the "Buy on Etsy" button |
| SEO title / description | text | Filled in from the title and description if left blank |
| Status | Draft / Published / Scheduled | |
| Featured / New arrival | toggles | Controls what appears on the home page |

**Other content types:** Collection, Page (About, Care, FAQ, Policies),
Home page settings (hero, featured collections), Site settings (announcement
bar, social links, shipping thresholds), Testimonial.

**Orders** (Phase 3) live in Stripe, with an order record saved on our side
for fulfillment. They are not edited in the CMS.

---

## 7. Owner upload workflow

This is the flow the owner uses day to day, mostly from a phone:

1. Open the admin (e.g. `omthreadsboutique.com/studio`, saved to the phone's home screen).
2. Tap **+ New product**.
3. **Add photos** straight from the camera roll. They are uploaded and resized
   automatically, and the owner drags to pick the main photo.
4. Fill in title, price, type, short description. Pick colors and material
   from lists instead of typing.
5. Optional: paste the Etsy listing link and set stock.
6. Tap **Publish** (or **Schedule** for a drop date). The product is live on
   the site within seconds, because pages refresh on demand when content changes.

Conveniences we'll build in:
- **Duplicate product**: for a new colorway of an existing shawl, copy it and change the photos and color.
- **Preview** before publishing, shown exactly as customers will see it on a phone.
- **Bulk import from Etsy** (Phase 2): a one-time script (and later an
  optional sync) that uses the Etsy Open API v3 to pull existing listings,
  photos and prices, so the catalog doesn't have to be typed in again.
- **Low-stock and sold-out** badges appear automatically based on stock.

---

## 8. Payments (designed now, switched on later)

Payments are designed now so the rest of the site doesn't need rework when they arrive.

- **Phase 1–2:** every product has a **Buy on Etsy** button, so there are no
  compliance obligations yet. The cart can still be built and tested in "demo mode".
- **Phase 3:** switch on **Stripe Checkout**:
  - Cards, Apple Pay, Google Pay, Link; optional Klarna or Afterpay (pay later)
    and PayPal (through Stripe or a separate PayPal button).
  - **PCI compliance:** Stripe hosts the payment form, so the site qualifies
    for the simplest level (SAQ A). Card numbers never touch our servers.
  - **Sales tax:** Stripe Tax calculates and collects tax automatically by
    customer location. Etsy handles marketplace tax for Etsy sales, but for
    your own site it's your responsibility, so this step is important.
  - **Shipping rates:** flat rate or free over a threshold at first; live
    carrier rates and label printing (e.g. Shippo or EasyPost) later.
  - **Webhooks:** Stripe notifies the site on payment, which then lowers
    stock, emails the customer and emails the owner.
- The code keeps payments behind a small **payment-provider interface**, so
  switching to or adding PayPal, Square or Shopify Buy Button later only
  replaces one module.
- **Stock kept in step with Etsy:** if an item sells on the site, its Etsy
  stock must drop too, and the other way round. Phase 3 includes an Etsy API
  sync for stock, or a simple rule of "one-of-a-kind items listed in one
  place only" until then.

---

## 9. SEO, performance and trust

- Server-rendered pages, `Product` and `Offer` structured data (for Google
  Shopping rich results), an automatic `sitemap.xml`, Open Graph images for
  social sharing.
- Targets: Lighthouse at least 90 on mobile, Largest Contentful Paint under
  2.5s on 4G, images lazy-loaded and correctly sized.
- Trust signals: Etsy rating badge, real reviews, clear shipping and returns
  policy, secure checkout badges, a real contact method.
- A Google Merchant Center feed (Phase 4) so products appear in free Google Shopping listings.

---

## 10. Legal and policy basics

- Privacy policy (covers analytics and newsletter; GDPR and CCPA wording if
  selling internationally).
- Terms of sale, shipping policy, returns and exchanges policy.
- Cookie banner only if non-essential cookies are used (Plausible avoids this).
- Business details in the footer or on the contact page as required by
  your region.

---

## 11. Roadmap

| Phase | Scope | Result |
|-------|-------|--------|
| **0. Foundations** | Confirm brand assets, domain, photos; set up the repo, Next.js, Tailwind, Sanity, Vercel | A preview link with the design system |
| **1. Showcase site (MVP)** | Home, shop, collections, product pages, about, FAQ, care, contact, policies; admin for products and pages; "Buy on Etsy" buttons; SEO basics; analytics | **Launch.** A professional site that sends sales to Etsy |
| **2. Shop experience** | Search, filters, cart drawer (demo mode), newsletter, Etsy bulk import, reviews and testimonials, wishlist (optional) | A full shopping experience, ready for payments |
| **3. Payments** | Stripe Checkout, Stripe Tax, shipping rules, order emails, stock updates, Etsy stock sync, order dashboard | **Direct sales live** |
| **4. Growth** | Google Shopping feed, discount codes, gift cards, abandoned-cart emails, Instagram shop, blog or lookbook | Marketing and repeat customers |

---

## 12. Proposed repository structure

```
/app                 Next.js routes (pages listed in §3)
/components          UI building blocks (ProductCard, Gallery, FilterDrawer, CartDrawer …)
/lib                 data fetching, formatting, payment-provider interface
/sanity              CMS schemas (product, collection, page, settings) + Studio config
/scripts             one-off tools (Etsy import)
/public              static assets (logo, icons)
PLAN.md              this document
```

---

## 13. Open questions for the owner

1. **Domain:** do you already own one (e.g. `omthreadsboutique.com`)?
2. **Brand assets:** logo files, brand colors and any existing photography,
   or should we propose a light brand refresh?
3. **Catalog size:** roughly how many listings, and are most items
   one-of-a-kind or kept in stock in several colors?
4. **Where you ship from and to:** domestic only or international? This
   affects currency, tax and shipping design.
5. **Materials and story:** key facts for the About page (origin, artisans,
   materials, what "Om" means to you).
6. **Etsy relationship:** should the site mirror the whole Etsy catalog,
   or have some site-only pieces or collections?
7. **Payment preferences:** do you already have Stripe or PayPal accounts?
8. **Budget for services:** are you comfortable with about $0–20/month
   (plus payment fees) for hosting and the CMS?

> Note: the Etsy shop page couldn't be loaded from the build environment, so
> the categories and details above are based on your description (shawls and
> stoles). Once we have the listings (or an Etsy API key for the import
> script), collections, filters and copy will be tuned to the real catalog.
