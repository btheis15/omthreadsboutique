# Om Threads Boutique

A mobile-first storefront for shawls and stoles that complements the
[Etsy shop](https://omthreadsboutique.etsy.com).

- **Shop owner?** Start with **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)**: putting the site online, connecting the admin, adding products.
- **The product admin** is a separate project, **omthreads-admin**, that runs on the Mac mini.
- **The full plan and roadmap** are in **[PLAN.md](PLAN.md)**.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Vercel. Product data comes from the
**omthreads-admin** catalog feed on the Mac mini (`SHOP_API_URL`), or alternatively Sanity
(embedded Studio at `/studio`).

With neither configured the site runs on a built-in sample catalog
(`src/data/sample.ts`), so every deploy renders a complete store. With the Mac mini
admin, `next build` reads the catalog from it, so the mini must be reachable when deploying;
after that, pages are cached and keep working if it goes offline.

## Local development

```bash
npm install
cp .env.example .env.local   # optional: point SHOP_API_URL at a local omthreads-admin
npm run dev                  # http://localhost:3000
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

## Project layout

```
src/app/(site)/        storefront routes (home, shop, product, content pages, checkout)
src/app/studio/        embedded Sanity Studio (product admin)
src/app/api/           checkout (payment stub), contact/subscribe, revalidate (admin + Sanity)
src/components/        UI (header, cart drawer, filters, gallery, cards…)
src/lib/catalog.ts     all data access: Mac mini admin, Sanity, or sample fallback
src/lib/payments.ts    payment-provider switch (Etsy today, Stripe later)
src/lib/site.ts        shop settings, categories, colors, materials
src/sanity/            Sanity schemas + client
src/data/sample.ts     sample catalog + default page copy
```
