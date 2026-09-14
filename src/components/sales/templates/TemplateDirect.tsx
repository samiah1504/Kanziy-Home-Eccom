// Template D — Mobile-first / Direct-response: single column, short punchy
// sections, order form high on the page, minimal scrolling to convert.

import Gallery from '../Gallery';
import OrderForm from '../OrderForm';
import StickyCTA from '../StickyCTA';
import {
  ContactButtons, DeliveryPhotos, FaqSection, HowItWorks,
  SellingPoints, SpecsSection, Testimonials, TrustBadges, VideosBlock,
  WhatsAppSecondary,
} from '../sections';
import { formatNaira } from '@/lib/utils';
import type { SalesPageView } from '../types';

export default function TemplateDirect({ view }: { view: SalesPageView }) {
  const { page, product, contact } = view;
  return (
    <div className="pb-20 md:pb-0">
      <section className="mx-auto max-w-xl px-4 py-6">
        {/* Hero hierarchy: gallery → name → pitch → price → ORDER NOW → secondary WhatsApp */}
        <Gallery images={product.images} alt={product.name} />
        <p className="mb-1 mt-4 text-center text-xs font-semibold uppercase tracking-widest text-gold">Kanziy Furniture</p>
        <h1 className="text-center text-2xl font-extrabold text-navy md:text-3xl">{page.headline}</h1>
        {page.subheadline && <p className="mt-2 text-center text-sm text-gray-600">{page.subheadline}</p>}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-navy px-4 py-3 text-white">
          <span className="text-2xl font-extrabold text-gold-bright">{formatNaira(product.price)}</span>
          <span className="text-xs">Pay After Inspection</span>
        </div>
        <a href="#order-form" className="btn-gold mt-4 w-full py-4 text-base">{page.ctaText}</a>
        <div className="mt-3"><WhatsAppSecondary whatsapp={contact.whatsapp} productName={product.name} /></div>
        <div className="mt-5"><TrustBadges /></div>
        <div className="mt-5"><SellingPoints points={view.sellingPoints} /></div>
      </section>

      <section className="mx-auto max-w-xl px-4 py-6" id="order-form-anchor">
        <div className="rounded-lg border-2 border-gold bg-white p-5">
          <h2 className="mb-1 text-center text-xl font-extrabold text-navy">Order Now — Pay on Delivery</h2>
          <p className="mb-5 text-center text-xs text-gray-500">Our team calls to confirm every order before delivery.</p>
          <OrderForm salesPageId={page.id} productName={product.name} price={product.price} ctaText={page.ctaText} colorVariants={product.colorVariants} />
        </div>
      </section>

      {(view.deliveryPhotos.length > 0 || view.deliveryVideos.length > 0 || view.testimonials.length > 0) && (
        <section className="bg-cream">
          <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
            <DeliveryPhotos photos={view.deliveryPhotos} videos={view.deliveryVideos} />
            <Testimonials items={view.testimonials} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-8"><VideosBlock videos={product.videos} title={product.name} /></div>
        <h2 className="mb-4 text-xl font-extrabold text-navy">Details & Specifications</h2>
        <SpecsSection product={product} />
      </section>

      <section className="bg-warmgrey">
        <div className="mx-auto max-w-xl px-4 py-8">
          <h2 className="mb-4 text-center text-xl font-extrabold text-navy">How It Works</h2>
          <HowItWorks />
        </div>
      </section>

      {view.faqs.length > 0 && (
        <section className="mx-auto max-w-xl px-4 py-8">
          <h2 className="mb-4 text-xl font-extrabold text-navy">FAQ</h2>
          <FaqSection faqs={view.faqs} />
        </section>
      )}

      <section className="mx-auto max-w-xl px-4 pb-10">
        <ContactButtons phone={contact.phone} whatsapp={contact.whatsapp} productName={product.name} ctaText={page.ctaText} />
      </section>

      <StickyCTA price={product.price} ctaText={page.ctaText} />
    </div>
  );
}
