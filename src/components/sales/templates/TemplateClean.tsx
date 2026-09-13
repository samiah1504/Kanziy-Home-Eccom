// Template A — Clean / Premium: white, airy, two-column hero, quiet luxury.

import Gallery from '../Gallery';
import OrderForm from '../OrderForm';
import StickyCTA from '../StickyCTA';
import {
  ContactButtons, DeliveryPhotos, FaqSection, HowItWorks,
  SellingPoints, SpecsSection, Testimonials, TrustBadges, VideosBlock,
} from '../sections';
import { formatNaira } from '@/lib/utils';
import type { SalesPageView } from '../types';

export default function TemplateClean({ view }: { view: SalesPageView }) {
  const { page, product, contact } = view;
  return (
    <div className="pb-20 md:pb-0">
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-14">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <Gallery images={product.images} alt={product.name} />
          <div>
            <h1 className="text-3xl font-extrabold text-navy md:text-4xl">{page.headline}</h1>
            {page.subheadline && <p className="mt-2 text-gray-600">{page.subheadline}</p>}
            <p className="mt-4 text-3xl font-bold text-navy">{formatNaira(product.price)}</p>
            <p className="mt-1 text-sm text-gold">Free Delivery • Free Installation • Pay After Inspection</p>
            <div className="mt-6">
              <SellingPoints points={view.sellingPoints} />
            </div>
            <div className="mt-8">
              <ContactButtons phone={contact.phone} whatsapp={contact.whatsapp} productName={product.name} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <TrustBadges />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-navy">Product Details</h2>
        <SpecsSection product={product} />
        <div className="mt-8"><VideosBlock videos={product.videos} title={product.name} /></div>
      </section>

      {(view.deliveryPhotos.length > 0 || view.deliveryVideos.length > 0 || view.testimonials.length > 0) && (
        <section className="bg-warmgrey">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
            <DeliveryPhotos photos={view.deliveryPhotos} videos={view.deliveryVideos} />
            <Testimonials items={view.testimonials} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-navy">How It Works</h2>
        <HowItWorks />
      </section>

      {view.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-12">
          <h2 className="mb-6 text-2xl font-bold text-navy">Frequently Asked Questions</h2>
          <FaqSection faqs={view.faqs} />
        </section>
      )}

      <section className="bg-navy">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h2 className="mb-2 text-center text-2xl font-bold text-white">Order Your {product.name}</h2>
          <p className="mb-8 text-center text-sm text-white/70">
            Fill in your details — our team will call to confirm before delivery.
          </p>
          <div className="rounded-lg bg-white p-6">
            <OrderForm salesPageId={page.id} productName={product.name} price={product.price} ctaText={page.ctaText} colorVariants={product.colorVariants} />
          </div>
        </div>
      </section>

      <StickyCTA whatsapp={contact.whatsapp} productName={product.name} ctaText={page.ctaText} />
    </div>
  );
}
