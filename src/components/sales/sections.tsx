// Shared sales-page sections. Every template composes these — the templates
// differ in layout, colour rhythm and typography, never in content support.

import { whatsappLink } from '@/lib/settings';
import type { SalesPageView, Testimonial, Faq, Spec, MediaVideo } from './types';

export function TrustBadges({ items, dark = false }: { items?: string[]; dark?: boolean }) {
  const badges = items?.length
    ? items
    : ['Free Delivery', 'Free Installation', 'Pay After Inspection', 'Nationwide Delivery'];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((b) => (
        <div
          key={b}
          className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${
            dark ? 'bg-white/10 text-white' : 'bg-cream text-navy'
          }`}
        >
          <span className="text-gold" aria-hidden>✓</span>
          {b}
        </div>
      ))}
    </div>
  );
}

export function SellingPoints({ points }: { points: string[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="space-y-2">
      {points.map((p) => (
        <li key={p} className="flex items-start gap-2 text-sm text-charcoal">
          <span className="mt-0.5 text-gold" aria-hidden>◆</span>
          {p}
        </li>
      ))}
    </ul>
  );
}

export function VideoBlock({
  url,
  poster,
  title,
}: {
  url?: string;
  poster?: string;
  title: string;
}) {
  if (!url) return null;
  const isEmbed = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  return (
    <div className="overflow-hidden rounded-lg">
      {isEmbed ? (
        <iframe
          src={toEmbedUrl(url)}
          title={`${title} video`}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        // Never autoplay with sound — user presses play. preload="metadata"
        // keeps uploaded videos from slowing the page down. h-auto lets the
        // player take the video's own shape (square, landscape or portrait);
        // max-h keeps tall portrait clips from dominating the page.
        <video src={url} poster={poster} controls preload="metadata" playsInline className="h-auto max-h-[75vh] w-full bg-black" />
      )}
    </div>
  );
}

/** Renders every product video — all templates support multiple videos. */
export function VideosBlock({ videos, title }: { videos: MediaVideo[]; title: string }) {
  if (videos.length === 0) return null;
  return (
    <div className="space-y-4">
      {videos.map((v, i) => (
        <VideoBlock key={i} url={v.url} poster={v.poster} title={title} />
      ))}
    </div>
  );
}

/** Available colours with their images — shown on every template. */
export function ColorShowcase({ variants }: { variants: SalesPageView['product']['colorVariants'] }) {
  if (variants.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Available Colours</h3>
      <div className="flex flex-wrap gap-3">
        {variants.map((v) => (
          <figure key={v.name} className="w-20 text-center">
            {v.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.image} alt={`${v.name} colour`} className="mx-auto aspect-square w-full rounded-md border border-gray-200 object-cover" loading="lazy" />
            ) : (
              <span className="mx-auto flex aspect-square w-full items-center justify-center rounded-md border border-gray-200 bg-cream text-lg text-gold" aria-hidden>◆</span>
            )}
            <figcaption className="mt-1 text-xs font-medium text-charcoal">{v.name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function toEmbedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

export function HowItWorks({ dark = false }: { dark?: boolean }) {
  const steps = [
    'Place Your Order',
    'We Confirm Your Order',
    'We Deliver & Install',
    'You Inspect',
    'You Pay',
  ];
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {steps.map((s, i) => (
        <li
          key={s}
          className={`rounded-lg p-4 text-center ${dark ? 'bg-white/10' : 'bg-white border border-gray-200'}`}
        >
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
            {i + 1}
          </div>
          <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-navy'}`}>{s}</p>
        </li>
      ))}
    </ol>
  );
}

export function DeliveryPhotos({
  photos,
  videos = [],
  title = 'Delivered & Installed by Kanziy',
}: {
  photos: string[];
  videos?: MediaVideo[];
  title?: string;
}) {
  if (photos.length === 0 && videos.length === 0) return null;
  return (
    <div>
      {title && <h3 className="mb-4 text-xl font-bold text-navy">{title}</h3>}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt="Kanziy delivery"
              className="aspect-square w-full rounded-md object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}
      {videos.length > 0 && (
        <div className={`grid gap-3 md:grid-cols-2 ${photos.length > 0 ? 'mt-3' : ''}`}>
          {videos.map((v, i) => (
            <video
              key={i}
              src={v.url}
              poster={v.poster}
              controls
              preload="metadata"
              playsInline
              className="h-auto max-h-[70vh] w-full rounded-md bg-black"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((t, i) => (
        <figure key={i} className="rounded-lg border border-gray-200 bg-white p-5">
          {t.rating ? (
            <div className="mb-2 text-gold" aria-label={`${t.rating} out of 5 stars`}>
              {'★'.repeat(Math.min(t.rating, 5))}
              <span className="text-gray-300">{'★'.repeat(Math.max(5 - t.rating, 0))}</span>
            </div>
          ) : null}
          <blockquote className="text-sm text-charcoal">“{t.text}”</blockquote>
          <figcaption className="mt-3 text-sm font-semibold text-navy">
            {t.name}
            {t.location ? <span className="font-normal text-gray-500"> — {t.location}</span> : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function SpecsSection({ product }: { product: SalesPageView['product'] }) {
  const rows: Spec[] = [
    ...product.specifications,
    ...(product.dimensions ? [{ label: 'Dimensions', value: product.dimensions }] : []),
    ...(product.materials ? [{ label: 'Materials', value: product.materials }] : []),
  ];
  if (rows.length === 0 && !product.description && product.colorVariants.length === 0) return null;
  return (
    <div className="space-y-4">
      {product.description && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal">{product.description}</p>
      )}
      <ColorShowcase variants={product.colorVariants} />
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 font-medium text-navy">{r.label}</td>
                  <td className="py-2.5 text-charcoal">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <div className="space-y-2">
      {faqs.map((f, i) => (
        <details key={i} className="group rounded-md border border-gray-200 bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-navy">
            {f.q}
          </summary>
          <p className="border-t border-gray-100 px-4 py-3 text-sm text-charcoal">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function ContactButtons({
  phone,
  whatsapp,
  productName,
  variant = 'light',
}: {
  phone: string;
  whatsapp: string;
  productName: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a href="#order-form" className="btn-gold flex-1">Order Now</a>
      {phone && (
        <a href={`tel:${phone}`} className={variant === 'dark' ? 'btn-outline flex-1 border-white/40 text-white hover:bg-white/10' : 'btn-navy flex-1'}>
          Call Us
        </a>
      )}
      {whatsapp && (
        <a
          href={whatsappLink(whatsapp, `Hello Kanziy, I'm interested in the ${productName}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1"
        >
          WhatsApp Us
        </a>
      )}
    </div>
  );
}
