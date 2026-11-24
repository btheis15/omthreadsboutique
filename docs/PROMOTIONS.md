# Promotions: what turns off, and where to change it

Nothing about Black Friday is hard-coded in the site code. All of it comes from the shop feed (admin) and
turns off by date. No deploy is needed on Dec 1.

| Promo | Where to change it | Turns off |
|---|---|---|
| Sale banner (title, text, end date) | Admin: sale banner setting | The feed drops it after its `endsOn` (Nov 30) |
| Free pouch (2+ paid items) | Admin: free gift (product, label, minimum, `endsOn`) | `src/lib/free-gift.ts` hides it after `endsOn`, end of day Chicago time |
| 20% off, then 10% off | Admin: product sale prices | The feed switches to the regular 10% price on its own |
| Free shipping bar ($75) | Admin: free shipping threshold | Not a Black Friday item; stays |

The site caches pages for about 5 minutes, so expect up to ~5 minutes of lag after midnight Chicago time.

The cart (pouch card, "N% off" tags, free-shipping bar) and the home page "hot sale" tiles follow the same data,
so they update with it. The top "announcement" line is also an admin setting: clear it if it mentions Black Friday.

## Dec 1 checklist (owner)
1. Banner is gone from the top of the site.
2. Add two pieces to the cart: no free pouch card appears.
3. Prices show the regular 10% off, with a "10% off" tag.
4. Check the admin announcement line and any hand-written page text for "Black Friday" or "pouch".
