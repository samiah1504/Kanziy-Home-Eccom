// Template C — Editorial / Luxury: serif headlines, full-bleed imagery,
// warm neutral rhythm, refined spacing.

import Gallery from '../Gallery';
import OrderForm from '../OrderForm';
import StickyCTA from '../StickyCTA';
import {
  ContactButtons, DeliveryPhotos, FaqSection, HowItWorks,
  SellingPoints, SpecsSection, Testimonials, VideosBlock,
} from '../sections';
import { formatNaira } from '@/lib/utils';
import type { SalesPageView } from '../types';

export default function TemplateEditorial({ view }: { view: SalesPageView }) {
  const { page, product, contact } = view;
  const hero = product.images[0];
  return (
    <div className="bg-cream pb-20 md:pb-0">
      <section className="relative">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={product.name} className="h-[55vh] w-full object-cover md:h-[70vh]" loading="eager" />
        ) : (
          <div className="h-[45vh] bg-navy" />
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy/85 via-navy/30 to-transparent">
          <div className="mx-auto w-full max-w-5xl px-4 pb-10 text-white">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold-soft">Kanziy — Spaces That Work for You.</p>
            <h1 className="font-serif text-4xl font-semibold md:text-6xl">{page.headline}</h1>
            {page.subheadline && <p className="mt-3 max-w-xl text-white/85">{page.subheadline}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="text-2xl font-bold text-gold-bright">{formatNaira(product.price)}</span>
              <a href="#order-form" className="btn-gold">{page.ctaText}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <Gallery images={product.images} alt={product.name} />
          <div>
            <h2 className="font-serif text-3xl text-navy">Considered in Every Detail</h2>
            <div className="mt-4 h-px w-16 bg-gold" />
            <div className="mt-6"><SellingPoints points={view.sellingPoints} /></div>
            <div className="mt-8"><SpecsSection product={product} /></div>
          </div>
        </div>
        <div className="mt-12"><VideosBlock videos={product.videos} title={product.name} /></div>
      </section>

      {(view.deliveryPhotos.length > 0 || view.deliveryVideos.length > 0 || view.testimonials.length > 0) && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl space-y-10 px-4 py-14">
            <div className="text-center">
              <h2 className="font-serif text-3xl text-navy">Delivered & Installed by Kanziy</h2>
              <div className="mx-auto mt-4 h-px w-16 bg-gold" />
            </div>
            <DeliveryPhotos photos={view.deliveryPhotos} videos={view.deliveryVideos} title="" />
            <Testimonials items={view.testimonials} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="mb-8 text-center font-serif text-3xl text-navy">A Simple, Considered Process</h2>
        <HowItWorks />
      </section>

      {view.faqs.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <h2 className="mb-6 font-serif text-3xl text-navy">Questions</h2>
            <FaqSection faqs={view.faqs} />
          </div>
        </section>
      )}

      <section className="bg-navy">
        <div className="mx-auto max-w-2xl px-4 py-14">
          <h2 className="mb-2 text-center font-serif text-3xl text-white">Reserve Your {product.name}</h2>
          <p className="mb-8 text-center text-sm text-white/70">Pay only after delivery, installation and your inspection.</p>
          <div className="rounded-lg bg-white p-6">
            <OrderForm salesPageId={page.id} productName={product.name} price={product.price} ctaText={page.ctaText} colorVariants={product.colorVariants} />
          </div>
          <div className="mt-8">
            <ContactButtons phone={contact.phone} whatsapp={contact.whatsapp} productName={product.name} ctaText={page.ctaText} variant="dark" />
          </div>
        </div>
      </section>

      <StickyCTA price={product.price} ctaText={page.ctaText} />
    </div>
  );
}
