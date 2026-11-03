# XanderIraq

Storefront for [xanderiraq.com](https://xanderiraq.com): digital Minecraft schematics, photos, and packs.

Cloudflare Workers Builds deploys the `xandeiraq` Worker from [`wrangler.jsonc`](wrangler.jsonc) on every push to `main`. The Worker serves the static files in `public/`. Do not push unfinished work to `main`.

Preview locally:

```bash
python3 -m http.server -d public 8080
```

## Add a product

Edit [`public/products.js`](public/products.js) only. Copy a product object and set:

| Field | What to put |
| --- | --- |
| `id` | Short slug, used in the URL `#item-your-id` and `#thanks-your-id` |
| `name`, `desc`, `price` | Shop copy. `price` is a one-time USD amount |
| `cat` | `Schematics`, `Photos`, `Packs`, or `Bundles` |
| `versions` | Minecraft versions, e.g. `["1.20", "1.21"]`, or `["any"]` |
| `sizeClass` | `small`, `medium`, or `large` (shop filter) |
| `size` | `{ x, y, z, blocks }` for schematics, or `null` |
| `spec` | Short chips on the card |
| `included` | Bullet list on the product page |
| `images` | `[{ src, alt, width, height }]`. Put the file in `public/images/`. `src` is `images/your-file.jpg` |
| `video` | A YouTube id, or `""` |
| `stripePaymentLink` | Public `https://buy.stripe.com/...` URL, or `""` |
| `files` | `{ name, href }`. `href` is `downloads/your-file.litematic`, or `""` until you upload it |
| `colors` | Three hex colors for the block artwork used until screenshots exist |

`sample: true` hides a product from the shop and runs it through the free-sample email gate. The current sample is `sample-watchtower`, and its stand-in file is `public/downloads/sample-pack.txt`.

Reviews live in the `reviews` array in the same file. Entries with `placeholder: true` are dummy copy. The site labels them "Placeholder" and shows "Placeholder ratings — not real customer reviews yet." Replace them with real notes, or delete them. Do not present placeholders as customer quotes.

Instagram is [instagram.com/epicwatch6](https://www.instagram.com/epicwatch6/). Set `youtube` to the channel URL and `showcaseVideo` to a YouTube id when you have them.

`analyticsToken` is the Cloudflare Web Analytics site token. Leave it `""` and the beacon is not loaded. It is a public token, not a secret. No cookie banner is required for that beacon, and nothing is sent while the token is empty.

`web3formsKey` is the existing public Web3Forms access key used by the contact form, the newsletter, and the sample signup.

## Stripe objects to create

Currency for every price is **USD**. Each row is a one-time product, not a subscription. The free sample is not a Stripe product.

Create, in the Stripe Dashboard:

1. A **Product** named exactly as below.
2. A one-time **Price** on that product for the amount below, currency `usd`.
3. A **Payment Link** for that Price.
4. Paste the Payment Link URL into that product's `stripePaymentLink` in `public/products.js`.

After payment, set the Payment Link's confirmation to redirect to the thank-you hash for that product:

`https://xanderiraq.com/#thanks-PRODUCT_ID`

Example: `https://xanderiraq.com/#thanks-spawn-castle`

| Product id | Stripe Product name | Price (USD) | Thank-you URL |
| --- | --- | --- | --- |
| `spawn-castle` | Obsidian Spawn Castle | 12.00 | `https://xanderiraq.com/#thanks-spawn-castle` |
| `stash-hall` | Hidden Stash Hall | 8.00 | `https://xanderiraq.com/#thanks-stash-hall` |
| `mapart` | Map Art Starter Pack | 6.00 | `https://xanderiraq.com/#thanks-mapart` |
| `ruins-photo` | Overworld Ruins Set | 5.00 | `https://xanderiraq.com/#thanks-ruins-photo` |
| `nether-photo` | Nether Highway Set | 4.00 | `https://xanderiraq.com/#thanks-nether-photo` |
| `thumb-kit` | YouTube Thumbnail Kit | 7.00 | `https://xanderiraq.com/#thanks-thumb-kit` |
| `tex-pack` | Muted Stone Texture Pack | 3.00 | `https://xanderiraq.com/#thanks-tex-pack` |
| `schematic-trio` | Schematic 3-for-2 | 20.00 | `https://xanderiraq.com/#thanks-schematic-trio` |
| `starter-kit` | Builder Starter Kit | 16.00 | `https://xanderiraq.com/#thanks-starter-kit` |

Deal math, so the Stripe Price matches the site:

- Schematic 3-for-2 includes castle $12, stash hall $8, and map art $6 ($26). The deal price is $20, which drops the cheapest item.
- Builder Starter Kit includes castle $12, ruins photos $5, and the texture pack $3 ($20), sold at $16.

No Stripe secret key belongs in this repo. Do not add `sk_live_`, `sk_test_`, or restricted keys. Payment Links are public URLs.

Checkout:

- The cart asks for an email, then opens that product's Payment Link with `prefilled_email` and `client_reference_id` set to the product id.
- One Payment Link charges one product. A bundle is one product, so the deal is a single charge.
- If the cart holds every item inside a bundle, the cart offers to switch those lines to the bundle.
- Several separate products still check out one link at a time. The other lines stay in the cart.
- A blank or non-https link is not configured. The cart names those products and does not navigate away.
- The thank-you page lists `files`. A filled `href` is a download button. An empty `href` tells the buyer the file is not uploaded yet.

Files under `public/downloads/` are publicly reachable by URL. The thank-you page and the sample form are convenient gates, not access control. Stripe does not hide the file.

## Pages

Hash routes on the one `index.html`: Home, Shop, Schematics, Photos, Packs, Guide, FAQ, Contact, plus `#bundles`, `#sample`, `#item-…`, and `#thanks-…`.

Shop filters: text search, category, price, Minecraft version, and size.

## SEO and analytics

- `public/favicon.svg`
- `public/og.png` — Open Graph and Twitter preview
- `public/robots.txt`
- `public/sitemap.xml` — the shop is a hash app, so the sitemap lists the canonical homepage
- Product screenshots use `loading="lazy"` except the main gallery image
- Cloudflare Web Analytics loads only when `analyticsToken` is set
