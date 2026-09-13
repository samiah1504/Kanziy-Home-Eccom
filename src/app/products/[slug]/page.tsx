import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { parseJsonArray } from '@/lib/utils';
import type { Faq, SalesPageView, Spec, Testimonial } from '@/components/sales/types';
import MetaPixel from '@/components/tracking/MetaPixel';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import TemplateClean from '@/components/sales/templates/TemplateClean';
import TemplateBold from '@/components/sales/templates/TemplateBold';
import TemplateEditorial from '@/components/sales/templates/TemplateEditorial';
import TemplateDirect from '@/components/sales/templates/TemplateDirect';

// Sales pages are ad destinations — cache them at the edge and regenerate at
// most once per minute. Admin saves revalidate the path, so content edits and
// template switches still go live immediately. The per-view tracking and the
// order form are client-side/API calls, so they are unaffected by caching.
export const revalidate = 60;

// cache() dedupes the query between generateMetadata and the page render.
const loadPage = cache(async (slug: string) => {
  const page = await db.salesPage.findUnique({
    where: { slug },
    include: { product: true },
  });
  if (!page || page.status !== 'PUBLISHED' || !page.product.active) return null;
  return page;
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await loadPage(params.slug);
  if (!page) return { title: 'Product not found' };
  const p = page.product;
  const images = parseJsonArray<string>(p.images);
  return {
    title: p.seoTitle || p.name,
    description:
      p.seoDescription ||
      p.shortPitch ||
      `${p.name} — free delivery, free installation, pay after inspection.`,
    alternates: { canonical: `/products/${page.slug}` },
    openGraph: {
      title: p.seoTitle || p.name,
      description: p.seoDescription || p.shortPitch || undefined,
      images: images.length ? [images[0]] : undefined,
      type: 'website',
    },
  };
}

export default async function SalesPage({
  params,
}: {
  params: { slug: string };
}) {
  const [page, settings] = await Promise.all([
    loadPage(params.slug),
    getSettings(),
  ]);
  if (!page) notFound();
  const p = page.product;

  const view: SalesPageView = {
    page: {
      id: page.id,
      slug: page.slug,
      template: page.template,
      headline: page.headline || p.name,
      subheadline: page.subheadline || p.shortPitch || undefined,
      ctaText: page.ctaText || 'Order Now',
    },
    product: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      shortPitch: p.shortPitch || undefined,
      description: p.description || undefined,
      features: parseJsonArray<string>(p.features),
      specifications: parseJsonArray<Spec>(p.specifications),
      dimensions: p.dimensions || undefined,
      materials: p.materials || undefined,
      colors: parseJsonArray<string>(p.colors),
      deliveryInfo: p.deliveryInfo || undefined,
      installationInfo: p.installationInfo || undefined,
      images: parseJsonArray<string>(p.images),
      videoUrl: p.videoUrl || undefined,
    },
    sellingPoints: (() => {
      const points = parseJsonArray<string>(page.sellingPoints);
      return points.length ? points : parseJsonArray<string>(p.features);
    })(),
    testimonials: parseJsonArray<Testimonial>(page.testimonials),
    deliveryPhotos: parseJsonArray<string>(page.deliveryPhotos),
    faqs: parseJsonArray<Faq>(page.faqs),
    contact: { phone: settings.phone, whatsapp: settings.whatsapp },
  };

  const Template =
    {
      clean: TemplateClean,
      bold: TemplateBold,
      editorial: TemplateEditorial,
      direct: TemplateDirect,
    }[page.template] ?? TemplateClean;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: view.product.images,
    description: p.seoDescription || p.shortPitch || p.description || undefined,
    brand: { '@type': 'Brand', name: 'Kanziy' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: p.price,
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${page.slug}`,
    },
  };

  return (
    <>
      <MetaPixel
        pixelId={settings.metaPixelId}
        product={{
          id: p.id,
          slug: p.slug,
          salesPageId: page.id,
          price: p.price,
          name: p.name,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader phone={settings.phone} whatsapp={settings.whatsapp} />
      <main>
        <Template view={view} />
      </main>
      <SiteFooter />
    </>
  );
}
