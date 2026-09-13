'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAttribution } from '@/components/tracking/attribution';
import { formatNaira } from '@/lib/utils';
import type { ColorVariant } from './types';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function OrderForm({
  salesPageId,
  productName,
  price,
  ctaText = 'Place My Order',
  colorVariants = [],
}: {
  salesPageId: string;
  productName: string;
  price: number;
  ctaText?: string;
  colorVariants?: ColorVariant[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (colorVariants.length > 0 && !selectedColor) {
      setError('Please select your preferred colour above.');
      return;
    }
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesPageId,
          customerName: form.get('customerName'),
          phone: form.get('phone'),
          whatsapp: form.get('whatsapp'),
          address: form.get('address'),
          state: form.get('state'),
          city: form.get('city'),
          quantity: form.get('quantity'),
          customerNote: form.get('customerNote'),
          selectedColor,
          attribution: getAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      router.push(`/orders/received/${data.ref}`);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <form id="order-form" onSubmit={handleSubmit} className="space-y-4">
      {colorVariants.length > 0 && (
        <fieldset>
          <legend className="label">Choose Your Colour *</legend>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((v) => {
              const active = selectedColor === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedColor(v.name)}
                  className={`flex items-center gap-2 rounded-md border-2 px-2 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'border-gold bg-gold/10 text-navy'
                      : 'border-gray-200 bg-white text-charcoal hover:border-gold/50'
                  }`}
                >
                  {v.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image} alt="" className="h-9 w-9 rounded object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded bg-cream text-gold" aria-hidden>◆</span>
                  )}
                  {v.name}
                  {active && <span className="text-gold" aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div>
        <label className="label" htmlFor="customerName">Full Name *</label>
        <input className="input" id="customerName" name="customerName" required autoComplete="name" placeholder="Your full name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">Phone Number *</label>
          <input className="input" id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="0801 234 5678" />
        </div>
        <div>
          <label className="label" htmlFor="whatsapp">WhatsApp Number</label>
          <input className="input" id="whatsapp" name="whatsapp" type="tel" placeholder="If different from phone" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address">Delivery Address *</label>
        <input className="input" id="address" name="address" required autoComplete="street-address" placeholder="Street address for delivery" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="state">State *</label>
          <select className="input" id="state" name="state" required defaultValue="">
            <option value="" disabled>Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input className="input" id="city" name="city" placeholder="City / area" />
        </div>
        <div>
          <label className="label" htmlFor="quantity">Quantity</label>
          <input
            className="input"
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="customerNote">Additional Information</label>
        <textarea className="input" id="customerNote" name="customerNote" rows={2} placeholder="Colour preference, delivery timing, questions…" />
      </div>

      <div className="flex items-center justify-between rounded-md bg-cream px-4 py-3 text-sm">
        <span className="font-medium text-navy">
          {productName}
          {selectedColor ? ` — ${selectedColor}` : ''} × {quantity}
        </span>
        <span className="text-lg font-bold text-navy">{formatNaira(price * quantity)}</span>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={submitting} className="btn-gold w-full py-4 text-base disabled:opacity-60">
        {submitting ? 'Submitting…' : ctaText}
      </button>
      <p className="text-center text-xs text-gray-500">
        No payment now — you pay after delivery, installation and inspection.
      </p>
    </form>
  );
}
