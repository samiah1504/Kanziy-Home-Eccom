# Kanziy Sales Commerce Platform (V1)

A mobile-first, advertising-focused furniture commerce platform for
**Kanziy — Spaces That Work for You.**

V1 is a high-converting sales machine for individual furniture products:
dedicated product sales pages used as Meta/Google ad destinations, a
Pay-on-Delivery order form, a Customer Support confirmation workflow, Meta
Pixel + Conversions API tracking with duplicate-Purchase protection, and a
role-based admin — built on an architecture that can grow into the full
Kanziy e-commerce website without a rebuild.

## Stack

- **Next.js 14 (App Router) + React + TypeScript** — frontend and server
- **Tailwind CSS** — Kanziy brand system (Deep Blue `#011D48`, Gold `#B08D57`)
- **Prisma + Postgres** — data layer, configured for Supabase/Postgres
  (deploy-ready for Vercel). No provider-specific features are used, so the
  schema also runs on SQLite for offline local development (see below).
- Deployable to **Vercel** (or any Node host)

## Quick start

```bash
npm install
cp .env.example .env        # set DATABASE_URL (Postgres) and AUTH_SECRET
npx prisma db push          # create the tables
npm run db:seed             # demo products, pages and staff accounts
npm run dev                 # http://localhost:3000
```

For `DATABASE_URL`, a free Supabase project works for development too —
create one at supabase.com and copy the pooled connection string from
Settings → Database. If you'd rather develop fully offline, change the
datasource provider in `prisma/schema.prisma` from `postgresql` to `sqlite`
and set `DATABASE_URL="file:./dev.db"` (don't commit that change).

Seeded logins (**change these before going live**):

| Account | Role | Password |
|---|---|---|
| `admin@kanziy.com` | Super Admin | `admin12345` |
| `content@kanziy.com` | Technical / Content Admin | `content12345` |
| `support@kanziy.com` | Customer Support | `support12345` |

Staff portal: `/login` → `/admin`.

## What's in V1

**Public site**
- Showroom homepage (`/`) — hero, Why Kanziy, Best Sellers (admin-managed via
  product flags), categories, recent deliveries, CTA
- Dedicated sales pages at permanent SEO-friendly URLs (`/products/[slug]`)
- 4 reusable templates (Clean/Premium, Bold/Conversion, Editorial/Luxury,
  Mobile-first/Direct-response) — identical content support, different
  design; a page can switch templates without changing its URL or content
- Every template: product, price, gallery, video, selling points, specs,
  previous-delivery photos, testimonials, trust badges, How It Works
  (order → confirm → deliver & install → inspect → pay), per-product FAQs,
  order form, click-to-call, click-to-WhatsApp, sticky mobile CTA
- Order confirmation page with reference number (`/orders/received/[ref]`)
- SEO: per-product titles/descriptions, Open Graph, Product JSON-LD,
  canonical URLs, sitemap.xml, robots.txt

**Orders & Customer Support**
- Statuses: New → Confirmed / Not Buying / Not Reachable / Cancelled
- One-click contact (call / WhatsApp with prefilled message)
- Internal notes (never customer-visible), follow-up scheduling with a
  due list on the dashboard, automatic activity timeline on every order
- Copy-for-Operations-App handoff block (logged on the timeline)
- Search (ref, name, phone, product) and filtering (status, page, source)

**Tracking**
- Attribution captured per order: UTM set, `fbclid`, `gclid`, `_fbp`,
  `_fbc`, landing URL, referrer, user agent, IP, derived traffic source
- Meta Pixel (browser) + Conversions API (server) with shared event IDs
  for deduplication: `PageView` + `ViewContent` on page load, `Lead` on
  order submit
- **`Purchase` fires only when Customer Support confirms an order** —
  never on view, submit, not-reachable, not-buying or cancel
- Duplicate-Purchase protection: the send is claimed atomically in the DB,
  the event ID is generated once and reused, failures are recorded with a
  visible retry button (no silent duplicates, no silent losses)

**Admin**
- Role-based access enforced server-side (middleware + per-action checks):
  Super Admin, Customer Support (order processing only), Technical/Content
  Admin (products, pages, media, publishing)
- Staff are granted access per sales page — not per order
- Products CRUD with visibility flags (Active, Homepage, Featured, Best
  Seller); each product automatically gets a draft sales page
- Sales-page editor: slug, template, draft/published/unpublished, headline,
  selling points, testimonials, delivery photos, FAQs, CTA text
- Analytics: per-page views, orders, lead conversion, confirmation rate,
  status breakdown, confirmed value; staff performance
- Settings: phone, WhatsApp, Meta Pixel ID, CAPI token, test event code

## Configuration

| Env var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres/Supabase connection string (pooled URL for serverless) |
| `AUTH_SECRET` | Session-cookie signing key (`openssl rand -hex 32`) |
| `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` | Meta tracking (Admin → Settings overrides these) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO/sitemap |

Until a Pixel ID + CAPI token are configured, server events are recorded as
**SKIPPED** on each order (with a retry button) instead of being silently
dropped.

## Production notes (Vercel + Supabase)

1. Create a Supabase project, set `DATABASE_URL` to its pooled connection
   string, and run `npx prisma db push && npm run db:seed` against it once.
   Then import the repo on Vercel with `DATABASE_URL`, `AUTH_SECRET` and
   `NEXT_PUBLIC_SITE_URL` set as environment variables.
2. Set a strong `AUTH_SECRET`; replace all seeded passwords.
3. Configure phone/WhatsApp and Meta tracking in Admin → Settings.
4. Replace `/public/demo/*.svg` placeholder imagery with real Kanziy
   product/delivery photography (Products → Image URLs; host on Supabase
   Storage or any CDN).

## V1 scope boundaries

Fulfilment, inventory, delivery tracking, payments, customer accounts and
cart/checkout are intentionally **not** built — confirmed orders are handed
off to the existing Operations App. The product/sales-page/order/attribution
schema is designed so categories, search, cart, checkout and online payment
can be added later on the same database and URLs.
