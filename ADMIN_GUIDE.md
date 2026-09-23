# Owner's guide

Everything you need to put the site online, connect the product admin, and
add products. No coding required.

- [1. Put the site online (Vercel)](#1-put-the-site-online-vercel), about 5 minutes
- [2. Connect the product admin (Sanity)](#2-connect-the-product-admin-sanity), about 10 minutes, one time only
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

## 2. Connect the product admin (Sanity)

The admin is where you upload photos and manage products. It lives at
`your-site.vercel.app/studio` and works on your phone.

1. Create a free account at [sanity.io](https://www.sanity.io) and go to
   [sanity.io/manage](https://www.sanity.io/manage).
2. Click **Create new project**, name it *Om Threads Boutique*, and choose
   the dataset name **production**.
3. Copy the **Project ID** (a short code like `ab12cd34`).
4. Still in sanity.io/manage, open **API → CORS origins → Add CORS origin**:
   - Origin: `https://omthreadsboutique.vercel.app` (your Vercel address)
   - Tick **Allow credentials** and save.
   - Optional: add `http://localhost:3000` the same way for local development.
5. In Vercel, open **Project → Settings → Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | your Project ID |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `SANITY_REVALIDATE_SECRET` | any long random password (e.g. from a password manager) |

6. In Vercel, go to **Deployments**, click **⋯** next to the latest one, then **Redeploy**.
7. Open `your-site.vercel.app/studio` and log in with your Sanity account.

### Make new products appear instantly (webhook)

Without this step, changes appear within about 5 minutes. With it, they appear
within seconds.

1. In sanity.io/manage open **API → Webhooks → Create webhook**.
2. Fill in:
   - **URL:** `https://omthreadsboutique.vercel.app/api/revalidate`
   - **Trigger on:** Create, Update, Delete
   - **Filter:** `_type in ["product", "collection", "page"]`
   - **Secret:** the same value you used for `SANITY_REVALIDATE_SECRET`
3. Save.

> **Tip:** on your phone, open `/studio` in Safari or Chrome, then choose
> **Share → Add to Home Screen** so the admin works like an app.

Once you add your first real product, the sample products disappear
automatically.

---

## 3. Add a product

1. Open **/studio** and go to **Products**, then tap the **✎ / +** (create) button.
2. **Basics** tab:
   - **Title**, e.g. *Hand-embroidered Pashmina Shawl – Midnight Blue*
   - **Web address**: tap **Generate**
   - **Photos**: tap to upload from your camera roll, or drag in several at once.
     Drag to reorder; the first one is the main photo. Add a short description
     for each photo (e.g. "Navy shawl draped over shoulders").
   - **Price**, **Type** (Shawl / Stole / Scarf / Wrap), **Short description**, **Colors**
3. **Details** tab (optional but recommended): material, size, full description,
   care instructions (pick a preset), collections, "Feature on home page".
4. **Stock & Etsy** tab: paste the **Etsy listing link** so the
   "Buy on Etsy" button goes to the right listing. Set **Quantity in stock**
   (leave it empty for made-to-order; 0 = sold out).
5. Tap **Publish**.

**Shortcut for a new color of an existing piece:** open the product, tap
**⋯ → Duplicate**, change the title, photos, color and Etsy link, and publish.

### Photo tips (the biggest factor in looking professional)

- Portrait photos (4:5, e.g. 1600 × 2000 px or larger) in soft natural light.
- Keep the same background for every product (a plain wall or linen works well).
- For each product take 1) the full piece, 2) a draped or worn shot, 3) a
  close-up of the texture or embroidery, and 4) the fringe or border.
- Upload the original files. The site resizes and compresses them automatically.
- If a photo is cropped badly, click the photo, then the crop icon, and drag
  the **hotspot** onto the most important area.

---

## 4. Everyday tasks

| I want to… | Do this |
|------------|---------|
| Mark something sold out | Set **Quantity in stock** to `0` (keeps the page, shows "Sold out") |
| Remove a product entirely | Open it → **⋯ → Unpublish** (or Delete) |
| Put something on sale | Set **Original price** higher than **Price**. A "Sale" badge appears |
| Show a product on the home page | Tick **Feature on home page** |
| Create a collection (e.g. "Wedding") | **Collections → +**, then add it to products under **Details → Collections** |
| Edit About / FAQ / policies | **Pages → +**, and set the page's web address to `about`, `faq`, `care-guide`, `shipping`, `returns`, `privacy` or `terms` |

---

## 5. Settings you may want to change

These live in [`src/lib/site.ts`](src/lib/site.ts) (a developer, or Claude,
can change them in a minute):

- Shop name, tagline and description
- Announcement bar text
- Free-shipping threshold
- Email address and Instagram link (shown on the Contact page)
- Colors and materials offered in the admin and filters

Brand colors and fonts are in [`src/app/globals.css`](src/app/globals.css)
(the `@theme` block at the top).

---

## Payments (Phase 3)

Today, shoppers pay on Etsy: every product has a **Buy on Etsy** button, and
the cart's checkout page links each item to its Etsy listing. Switching on
payments directly on the site is a separate step (see `PLAN.md` §8). It
means adding Stripe, setting `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe`, and
publishing proper Terms and Privacy pages first.
