# Owner's guide

Everything you need to put the site online, connect the product admin, and
add products. No coding required.

- [1. Put the site online (Vercel)](#1-put-the-site-online-vercel), about 5 minutes
- [2. Connect the product admin (Mac mini)](#2-connect-the-product-admin-mac-mini), about 30 minutes, one time only
- [3. Add a product](#3-add-a-product), about 3–5 minutes each
- [4. Everyday tasks](#4-everyday-tasks)
- [5. Settings you may want to change](#5-settings-you-may-want-to-change)

---

## 1. Put the site online (Vercel)

1. Sign in at [vercel.com](https://vercel.com) and click **Add New… → Project**.
2. Choose the GitHub repository **omthreadsboutique** and click **Import**.
3. Leave every setting as it is (Vercel detects Next.js) and click **Deploy**.
4. After about a minute you get a free address like
   `omthreadsboutique.vercel.app`. That's your live site.

Until the admin is connected (step 2), the site shows **sample products**, so
you can see the full design right away.

> **Custom domain later:** in Vercel go to **Project → Settings → Domains**
> and add it. Nothing in the code needs to change.

---

## 2. Connect the product admin (Mac mini)

The admin is where you upload photos and manage products. It's a separate
project, **omthreads-admin**, that runs on the Mac mini. Its README has the
full one-time setup (about 30 minutes). In short:

1. Install it on the Mac mini and start it (README steps 1–8). The mini then
   serves the catalog at its own DuckDNS address
   (`https://<name>.duckdns.org`).
2. In Vercel, open **Project → Settings → Environment Variables** and add, for
   Production and Preview:

   | Name | Value |
   |------|-------|
   | `SHOP_API_URL` | the Mac mini's DuckDNS address |
   | `SHOP_API_TOKEN` | `SHOP_API_TOKEN` from the mini's `.env` |
   | `REVALIDATE_SECRET` | `REVALIDATE_SECRET` from the mini's `.env` |
   | `RESEND_API_KEY` + `NOTIFY_EMAIL` | *(optional)* free account at resend.com, so you get an email for each new message, even if the Mac mini is offline |

3. In Vercel, go to **Deployments**, click **⋯** next to the latest one, then
   **Redeploy**. The "Preview mode" banner disappears and the site shows your
   own products.

Open the admin from your MacBook or iPhone over Tailscale, at the Mac mini's
Tailscale address on port 8444 (listed in the omthreads-admin README). Changes appear on the
website within a few seconds. If the Mac mini is ever off, the website keeps
showing the shop as it was.

> **Tip:** on your iPhone, open the admin in Safari, then choose
> **Share → Add to Home Screen** so it works like an app.

Once you add your first real product, the sample products disappear
automatically. (The site can also still use Sanity instead. Set
`NEXT_PUBLIC_SANITY_PROJECT_ID` rather than `SHOP_API_URL`.)

---

## 3. Add a product

1. Open the admin, go to **Products** and tap **+ New product**.
2. **Photos**: tap **+ Add photos** to pick from your camera roll, or drag
   several in at once. Drag (or use ← → and **★ Main**) to reorder; the first
   one is the main photo. Add a short description under each photo (e.g. "Navy
   shawl draped over shoulders").
3. **Basics**: **Title** (the web address fills itself in), **Price**, **Type**
   (Shawl / Stole / Scarf / Wrap), **Short description**, **Colours**.
4. **Details** (optional but recommended): material, craft, where it was made,
   size, full description, care instructions.
5. **Collections & home page**, **Stock & Etsy**: paste the **Etsy listing
   link** so the "Buy on Etsy" button goes to the right listing, and set
   **Quantity in stock** (leave it empty for made-to-order; 0 = sold out).
6. Set **Visibility** to **Live on the website** and tap **Save**. (Save as
   **Draft** to finish later. Drafts never appear on the site.)

**Shortcut for a new colour of an existing piece:** open the product, tap
**Duplicate**, then change the title, photos, colour and Etsy link, and save.

### Photo tips (the biggest factor in looking professional)

- Portrait photos (4:5, e.g. 1600 × 2000 px or larger) in soft natural light.
- Keep the same background for every product (a plain wall or linen works well).
- For each product take 1) the full piece, 2) a draped or worn shot, 3) a
  close-up of the texture or embroidery, and 4) the fringe or border.
- Upload the original files. The admin resizes and compresses them
  automatically, and removes the photo's location data.
- Crop before uploading (see below). The admin shows photos exactly as uploaded.

### Photos with your iPhone and Mac

- **Shoot:** use your iPhone's main (1×) camera near a window in soft daylight,
  not direct sun. Drape each piece on a plain wall, a wooden hanger, or a
  person. Take the full piece, a draped shot, a texture close-up and the border
  or fringe. Tap to focus on the embroidery.
- **Edit in Photos (iPhone or Mac):** go to **Edit → Crop → aspect 4:5**.
  Nudge *Warmth* to keep ivory looking ivory, and don't over-saturate, since
  customers expect true colours. For more control, Pixelmator Pro on the Mac
  can batch-edit a whole set of photos.
- **Upload:** open the admin in Safari on your iPhone and upload straight from
  the camera roll (HEIC is fine). On the Mac, drag the photos into the admin.
- **Video:** a 5–15 second clip of the shawl being draped, filmed on the
  iPhone and trimmed in Photos or iMovie. Add it under **Short video** on the
  product, or as the **Hero video** in Settings.

---

## 4. Everyday tasks

| I want to… | Do this |
|------------|---------|
| Mark something sold out | Set **Quantity in stock** to `0` (keeps the page, shows "Sold out") |
| Hide a product for now | Set **Visibility** to **Draft** |
| Remove a product entirely | Open it → **Delete** |
| Put something on sale | Set **Original price** higher than **Price**. A "Sale" badge appears |
| Show a product on the home page | Tick **Feature on the home page** |
| Create a collection (e.g. "Wedding") | **Collections → + New collection**, then tick it on products under **Collections & home page** |
| Change the announcement bar, contact email, WhatsApp, Instagram, hero photo or video, free-shipping amount, return days | **Settings** |
| Show your Etsy star rating | **Settings → Etsy star rating / Number of Etsy reviews** (copy them from Etsy) |
| Add a customer review to the home page | **Reviews → + Add review** (only real reviews, with permission). The section appears once you add one |
| Read contact messages and newsletter sign-ups | **Inbox** (reply by email, or download sign-ups as CSV) |
| Tag a product's craft and origin | Product → **Details → Craft / Made in**. It links to the Crafts guide and the craft filter |
| Edit About / FAQ / Care guide / policies | **Pages**, then pick the page |

---

## 5. Settings you may want to change

Most shop settings are in the admin under **Settings** (see above).
The rest live in [`src/lib/site.ts`](src/lib/site.ts) (a developer, or Claude,
can change them in a minute):

- Shop name, tagline and description
- Colors and materials offered in the admin and filters (after changing them,
  refresh the admin's copy: `npm run import-storefront -- ../omthreadsboutique`
  in omthreads-admin, then update it on the Mac mini)
- The crafts list and their stories: [`src/lib/crafts.ts`](src/lib/crafts.ts)

Brand colors and fonts are in [`src/app/globals.css`](src/app/globals.css)
(the `@theme` block at the top).

---

## Payments (Phase 3)

Today, shoppers pay on Etsy: every product has a **Buy on Etsy** button, and
the cart's checkout page links each item to its Etsy listing. Switching on
payments directly on the site is a separate step (see `PLAN.md` §8). It
means adding Stripe, setting `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe`, and
publishing proper Terms and Privacy pages first.
