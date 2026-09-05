'use client';

import { whatsappLink } from '@/lib/settings';

// Mobile sticky bar: Order Now (scrolls to form) | WhatsApp.
export default function StickyCTA({
  whatsapp,
  productName,
  ctaText = 'Order Now',
}: {
  whatsapp: string;
  productName: string;
  ctaText?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-gray-200 bg-white/95 p-3 backdrop-blur md:hidden">
      <a href="#order-form" className="btn-gold flex-1 py-3">
        {ctaText}
      </a>
      {whatsapp && (
        <a
          href={whatsappLink(whatsapp, `Hello Kanziy, I'm interested in the ${productName}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-navy flex-1 py-3"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}
