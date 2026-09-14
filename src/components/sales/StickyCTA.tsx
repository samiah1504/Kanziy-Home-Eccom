'use client';

import { formatNaira } from '@/lib/utils';

// Mobile sticky bar: price + one dominant ORDER NOW button that scrolls
// smoothly to the order form. WhatsApp is deliberately absent here — it
// stays available as a secondary option elsewhere on the page, so the
// primary conversion path (order form → Lead → confirmation → Purchase)
// gets the prominent placement.
export default function StickyCTA({
  price,
  ctaText = 'Order Now',
}: {
  price: number;
  ctaText?: string;
}) {
  function scrollToForm(e: React.MouseEvent<HTMLAnchorElement>) {
    const form = document.getElementById('order-form');
    if (form) {
      e.preventDefault();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-gray-500">Pay after inspection</span>
        <span className="block text-lg font-extrabold leading-tight text-navy">{formatNaira(price)}</span>
      </div>
      <a href="#order-form" onClick={scrollToForm} className="btn-gold flex-1 py-3.5 text-base">
        {ctaText}
      </a>
    </div>
  );
}
