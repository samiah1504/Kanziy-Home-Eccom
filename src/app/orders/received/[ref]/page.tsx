import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSettings, whatsappLink } from '@/lib/settings';
import { formatNaira } from '@/lib/utils';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Received',
  robots: { index: false },
};

export default async function OrderReceivedPage({
  params,
}: {
  params: { ref: string };
}) {
  const order = await db.order.findUnique({ where: { ref: params.ref } });
  if (!order) notFound();
  const settings = await getSettings();

  // Pre-filled WhatsApp message with the actual order details, so Customer
  // Support immediately knows which order the customer is asking about.
  // whatsappLink() URL-encodes the whole message.
  const whatsappMessage = [
    'Hello Kanziy, I just placed an order and would like to confirm it.',
    '',
    `Order Reference: ${order.ref}`,
    `Product: ${order.productName}`,
    order.selectedColor ? `Colour: ${order.selectedColor}` : null,
    `Quantity: ${order.quantity}`,
    `Price: ${formatNaira(order.totalValue)}`,
    '',
    'Please assist me with confirming my order. Thank you.',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return (
    <>
      <SiteHeader phone={settings.phone} whatsapp={settings.whatsapp} />
      <main className="bg-cream">
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
              ✓
            </div>
            <h1 className="text-center text-2xl font-extrabold text-navy">ORDER RECEIVED</h1>
            <p className="mt-2 text-center text-sm text-gray-600">Thank you for your order, {order.customerName.split(' ')[0]}.</p>

            <div className="mt-6 rounded-md bg-cream p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Your Order</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Product</dt>
                  <dd className="font-semibold text-navy">{order.productName}</dd>
                </div>
                {order.selectedColor && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Colour</dt>
                    <dd className="font-semibold text-navy">{order.selectedColor}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Quantity</dt>
                  <dd className="font-semibold text-navy">{order.quantity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Price</dt>
                  <dd className="font-semibold text-navy">{formatNaira(order.totalValue)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <dt className="text-gray-600">Order Reference</dt>
                  <dd className="font-bold text-navy">{order.ref}</dd>
                </div>
              </dl>
            </div>

            <p className="mt-6 text-center text-sm leading-relaxed text-charcoal">
              We&apos;ve received your order and one of our Customer Support
              representatives will contact you shortly on{' '}
              <span className="font-semibold">{order.phone}</span> to confirm your order.
            </p>
            <p className="mt-3 text-center text-sm font-medium text-navy">
              You will be able to inspect your furniture before making payment.
            </p>

            <div className="mt-8 space-y-3">
              {settings.whatsapp && (
                <a
                  href={whatsappLink(settings.whatsapp, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-navy w-full"
                >
                  Chat With Us on WhatsApp
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="btn-outline w-full">
                  Call {settings.phone}
                </a>
              )}
              <Link href="/" className="block text-center text-sm font-medium text-gold hover:text-gold-bright">
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
