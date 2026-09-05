'use client';

// Loads the Meta Pixel, fires PageView (+ ViewContent on sales pages), and
// mirrors ViewContent to the server (/api/track) with the same eventID so the
// Conversions API copy deduplicates against the browser event. Also records
// the sales-page view count and captures ad attribution into sessionStorage.

import { useEffect } from 'react';
import { captureAttribution } from './attribution';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

function loadPixel(pixelId: string) {
  if (window.fbq) return;
  const fbq: any = function (...args: unknown[]) {
    // eslint-disable-next-line prefer-spread
    fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', pixelId);
}

export default function MetaPixel({
  pixelId,
  product,
}: {
  pixelId: string;
  product?: {
    id: string;
    slug: string;
    salesPageId: string;
    price: number;
    name: string;
  };
}) {
  useEffect(() => {
    captureAttribution();

    if (pixelId) {
      loadPixel(pixelId);
      window.fbq?.('track', 'PageView');
    }

    if (product) {
      const eventId = crypto.randomUUID();
      if (pixelId) {
        window.fbq?.(
          'track',
          'ViewContent',
          {
            content_ids: [product.slug],
            content_name: product.name,
            content_type: 'product',
            value: product.price,
            currency: 'NGN',
          },
          { eventID: eventId }
        );
      }
      // Server side: count the view + send CAPI ViewContent (same event id).
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesPageId: product.salesPageId,
          slug: product.slug,
          eventId,
          url: window.location.href,
        }),
        keepalive: true,
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
