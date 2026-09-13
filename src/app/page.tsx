import Link from 'next/link';
import { db } from '@/lib/db';
import { getSettings, whatsappLink } from '@/lib/settings';
import { formatNaira, parseJsonArray } from '@/lib/utils';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import MetaPixel from '@/components/tracking/MetaPixel';

// Cached and served from the edge; regenerated at most once per minute.
// Admin saves call revalidatePath('/'), so edits still appear immediately.
export const revalidate = 60;

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    db.product.findMany({
      where: {
        active: true,
        onHomepage: true,
        salesPage: { status: 'PUBLISHED' },
      },
      include: { salesPage: { select: { slug: true, deliveryPhotos: true } } },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    }),
  ]);

  const featured = products.filter((p) => p.featured);
  const heroImage = featured[0]
    ? parseJsonArray<string>(featured[0].images)[0]
    : products[0]
      ? parseJsonArray<string>(products[0].images)[0]
      : undefined;

  const deliveryPhotos = products
    .flatMap((p) => parseJsonArray<string>(p.salesPage?.deliveryPhotos))
    .slice(0, 6);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  return (
    <>
      <MetaPixel pixelId={settings.metaPixelId} />
      <SiteHeader phone={settings.phone} whatsapp={settings.whatsapp} />
      <main>
        {/* Hero */}
        <section className="relative bg-navy text-white">
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-soft">
              Premium Furniture • Homes & Offices
            </p>
            <h1 className="mx-auto max-w-3xl font-serif text-4xl font-semibold md:text-6xl">
              Spaces That Work for You.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Beautiful, functional furniture — delivered and installed nationwide.
              You pay only after inspection.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#best-sellers" className="btn-gold">Explore Products</a>
              {settings.whatsapp && (
                <a
                  href={whatsappLink(settings.whatsapp, 'Hello Kanziy, I would like to make an enquiry.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline border-white/40 text-white hover:bg-white/10"
                >
                  WhatsApp Us
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Why Kanziy */}
        <section className="border-b border-gray-100 bg-cream">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 text-center md:grid-cols-4">
            {['Free Delivery', 'Free Installation', 'Pay After Inspection', 'Nationwide Delivery'].map((b) => (
              <div key={b} className="text-sm font-semibold text-navy">
                <span className="mb-1 block text-xl text-gold" aria-hidden>◆</span>
                {b}
              </div>
            ))}
          </div>
        </section>

        {/* Best sellers */}
        <section id="best-sellers" className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl text-navy">Best Sellers</h2>
            <div className="mx-auto mt-3 h-px w-16 bg-gold" />
          </div>
          {products.length === 0 ? (
            <p className="text-center text-gray-500">
              Products are coming soon. Contact us on WhatsApp for our current catalogue.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => {
                const img = parseJsonArray<string>(p.images)[0];
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.salesPage!.slug}`}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.name}
                        className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-warmgrey text-gray-400">Kanziy</div>
                    )}
                    <div className="p-4">
                      {p.bestSeller && (
                        <span className="mb-1 inline-block rounded bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                          Best Seller
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-navy">{p.name}</h3>
                      <p className="mt-1 text-base font-bold text-navy">{formatNaira(p.price)}</p>
                      <p className="mt-1 text-[11px] text-gray-500">Free Delivery • Free Installation</p>
                      <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-gold group-hover:text-gold-bright">
                        View Product →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Categories */}
        {categories.length > 1 && (
          <section className="bg-warmgrey">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <h2 className="mb-6 text-center font-serif text-2xl text-navy">Shop by Category</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((c) => (
                  <span key={c} className="rounded-full border border-gold/40 bg-white px-5 py-2 text-sm font-medium text-navy">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent deliveries */}
        {deliveryPhotos.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 text-center">
              <h2 className="font-serif text-3xl text-navy">See Kanziy Furniture in Real Spaces</h2>
              <div className="mx-auto mt-3 h-px w-16 bg-gold" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {deliveryPhotos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="Kanziy delivery" className="aspect-square w-full rounded-md object-cover" loading="lazy" />
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center">
            <h2 className="font-serif text-3xl">Ready to Transform Your Space?</h2>
            <p className="mt-3 text-white/75">
              Order today — we deliver, install, and you pay after inspection.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#best-sellers" className="btn-gold">Shop Best Sellers</a>
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="btn-outline border-white/40 text-white hover:bg-white/10">
                  Call {settings.phone}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
