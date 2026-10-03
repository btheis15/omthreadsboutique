# Owner's guide

Everything you need to put the site online, connect the product admin, and
add products. No coding required.

- [1. Put the site online (Vercel)](#1-put-the-site-online-vercel), about 5 minutes
- [2. Connect the product admin (Mac mini)](#2-connect-the-product-admin-mac-mini), about 30 minutes, one time only
- [3. Add products, and everyday tasks](#3-add-products-and-everyday-tasks) (in the admin)
- [4. Settings you may want to change](#4-settings-you-may-want-to-change)

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

## 3. Add products, and everyday tasks

These happen in the admin, so their steps live with it:
**[omthreads-admin → docs/PRODUCTS.md](https://github.com/btheis15/omthreads-admin/blob/main/docs/PRODUCTS.md)**
(adding a product, photo tips for iPhone and Mac, sold out, sales, collections,
reviews, the Inbox and page photos).

---

## 4. Settings you may want to change

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

## Payments

Until the website checkout is switched on, shoppers pay on Etsy: every product
has a **Buy on Etsy** button, and the cart's checkout page links each item to
its Etsy listing.

The website's own checkout runs on the Om Threads admin (Mac mini), not here:
**Orders → Checkout setup** switches it **Off**, **Test** or **Live**, and lists
what's still needed. The admin re-checks every price and stock count, then takes
the payment: Stripe's page (cards, Apple Pay, Google Pay, and UPI for shoppers in
India), Exodus's (USDC/USDT stablecoins), PayPal or Venmo, Zelle, or **Bitcoin
Cash** into the shop's own wallet. No payment keys live on this site.

**Bitcoin Cash (Om Threads Pay).** The payment sheet on `/checkout/success` offers
**Connect wallet** (Cashonize, Paytaca, Zapit: one tap, with Om Threads tokens
taken off) and **Any wallet** (QR code or link). It needs one setting here,
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (see `.env.example`); without it, shoppers
pay by QR code. Everything else (the wallet, coupons, rewards, minting the Om
Threads token, what wallets show for it) is set up in the admin under
**Checkout setup → Bitcoin Cash**, and explained in
[omthreads-admin → docs/CHECKOUT.md](https://github.com/btheis15/omthreads-admin/blob/main/docs/CHECKOUT.md#bitcoin-cash-in-detail).
The site passes `/bcmr/*` (what wallets show for the token) on to the Mac mini.

- **Test** is only visible to browsers that opened the admin's tester link
  (`/api/tester?key=…`, a cookie). Everyone else still sees "Buy on Etsy".
  `/api/tester?off=1` leaves test mode.
- **Live** makes **Add to cart** the main button on product pages.
- After paying, shoppers land on `/checkout/success`, which reads the order
  back from the admin.
