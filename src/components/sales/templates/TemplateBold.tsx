// Template B — Bold / Conversion-focused: navy hero, price + CTA up front,
// social proof immediately after the offer.

import Gallery from '../Gallery';
import OrderForm from '../OrderForm';
import StickyCTA from '../StickyCTA';
import {
  ContactButtons, DeliveryPhotos, FaqSection, HowItWorks,
  SellingPoints, SpecsSection, Testimonials, TrustBadges, VideoBlock,
} from '../sections';
import { formatNaira } from '@/lib/utils';
import type { SalesPageView } from '../types';

export default function TemplateBold({ view }: { view: SalesPageView }) {
  const { page, product, contact } = view;
  return (
    <div className="pb-20 md:pb-0">
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">Kanziy Furniture</p>
              <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{page.headline}</h1>
              {page.subheadline && <p className="mt-3 text-white/80">{page.subheadline}</p>}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-gold-bright">{formatNaira(product.price)}</span>
                <span className="text-sm text-white/70">Pay after inspection</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="#order-form" className="btn-gold flex-1 py-4 text-base">{page.ctaText}</a>
                <ContactWhatsApp contact={contact} productName={product.name} />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Gallery images={product.images} alt={product.name} />
            </div>
          </div>
          <div className="mt-8"><TrustBadges dark /></div>
        </div>
      </section>

      {(view.deliveryPhotos.length > 0 || view.testimonials.length > 0) && (
        <section className="mx-auto max-w-6xl space-y-10 px-4 py-12">
          <h2 className="text-center text-2xl font-extrabold text-navy">See Kanziy Furniture in Real Spaces</h2>
          <DeliveryPhotos photos={view.deliveryPhotos} title="" />
          <Testimonials items={view.testimonials} />
        </section>
      )}

      <section className="bg-cream">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-extrabold text-navy">Why Customers Choose This {product.name}</h2>
          <SellingPoints points={view.sellingPoints} />
          <div className="mt-8"><SpecsSection product={product} /></div>
          {product.videoUrl && (
            <div className="mt-8"><VideoBlock url={product.videoUrl} title={product.name} /></div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-navy">Order in 5 Simple Steps</h2>
        <HowItWorks />
      </section>

      <section className="bg-navy">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-white">Get Your {product.name} Now</h2>
          <p className="mb-8 text-center text-sm text-white/70">No payment until it is delivered, installed and inspected.</p>
          <div className="rounded-lg bg-white p-6">
            <OrderForm salesPageId={page.id} productName={product.name} price={product.price} ctaText={page.ctaText} />
          </div>
        </div>
      </section>

      {view.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-extrabold text-navy">Questions? Answered.</h2>
          <FaqSection faqs={view.faqs} />
          <div className="mt-8">
            <ContactButtons phone={contact.phone} whatsapp={contact.whatsapp} productName={product.name} />
          </div>
        </section>
      )}

      <StickyCTA whatsapp={contact.whatsapp} productName={product.name} ctaText={page.ctaText} />
    </div>
  );
}

function ContactWhatsApp({
  contact,
  productName,
}: {
  contact: { whatsapp: string };
  productName: string;
}) {
  if (!contact.whatsapp) return null;
  const clean = contact.whatsapp.replace(/[^0-9]/g, '');
  return (
    <a
      href={`https://wa.me/${clean}?text=${encodeURIComponent(`Hello Kanziy, I'm interested in the ${productName}.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-outline flex-1 border-white/40 py-4 text-base text-white hover:bg-white/10"
    >
      WhatsApp Us
    </a>
  );
}
