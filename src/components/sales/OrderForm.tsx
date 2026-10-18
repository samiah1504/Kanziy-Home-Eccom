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

const MAX_QUANTITY = 100;

// Quantities are kept as raw strings so customers can clear the box and type
// their own number; this returns the whole number, or null when empty/invalid.
function parseQuantity(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = parseInt(value, 10);
  return n >= 1 ? n : null;
}

function QuantityStepper({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const n = parseQuantity(value) ?? 0;
  return (
    <div className="flex items-stretch">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(String(Math.max(1, n - 1)))}
        className="w-10 shrink-0 rounded-l-md border border-r-0 border-gray-300 bg-cream text-lg font-bold text-navy"
      >
        −
      </button>
      <input
        className="input rounded-none text-center"
        id={id}
        aria-label={label}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        required
        placeholder="Qty"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(String(Math.min(MAX_QUANTITY, n + 1)))}
        className="w-10 shrink-0 rounded-r-md border border-l-0 border-gray-300 bg-cream text-lg font-bold text-navy"
      >
        +
      </button>
    </div>
  );
}

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
  const [quantity, setQuantity] = useState('1');
  // Colours the customer ticked, in the order they ticked them, each with its
  // own quantity. Tapping a ticked colour again removes it.
  const [colorSelections, setColorSelections] = useState<{ name: string; quantity: string }[]>([]);

  const hasColors = colorVariants.length > 0;
  const totalQuantity = hasColors
    ? colorSelections.reduce((sum, c) => sum + (parseQuantity(c.quantity) ?? 0), 0)
    : parseQuantity(quantity) ?? 0;
  const colorSummary =
    colorSelections.length === 1
      ? colorSelections[0].name
      : colorSelections.map((c) => `${c.name} (${parseQuantity(c.quantity) ?? 0})`).join(', ');

  function toggleColor(name: string) {
    setError(null);
    setColorSelections((prev) =>
      prev.some((c) => c.name === name)
        ? prev.filter((c) => c.name !== name)
        : [...prev, { name, quantity: '1' }]
    );
  }

  function setColorQuantity(name: string, value: string) {
    setError(null);
    setColorSelections((prev) => prev.map((c) => (c.name === name ? { ...c, quantity: value } : c)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (hasColors) {
      if (colorSelections.length === 0) {
        setError('Please select at least one colour above.');
        return;
      }
      const missing = colorSelections.find((c) => parseQuantity(c.quantity) === null);
      if (missing) {
        setError(`Please enter the quantity you want for ${missing.name}.`);
        return;
      }
    } else if (parseQuantity(quantity) === null) {
      setError('Please enter the quantity you want.');
      return;
    }
    if (totalQuantity > MAX_QUANTITY) {
      setError(`The maximum is ${MAX_QUANTITY} items per order. Please call or WhatsApp us for larger orders.`);
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
          quantity: totalQuantity,
          customerNote: form.get('customerNote'),
          colorSelections: hasColors
            ? colorSelections.map((c) => ({ name: c.name, quantity: parseQuantity(c.quantity) }))
            : undefined,
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
      {hasColors && (
        <fieldset>
          <legend className="label">Choose Your Colour(s) *</legend>
          <p className="-mt-1 mb-2 text-xs text-gray-500">Tap to select one or more colours. Tap again to remove.</p>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((v) => {
              const active = colorSelections.some((c) => c.name === v.name);
              return (
                <button
                  key={v.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleColor(v.name)}
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
          {colorSelections.length > 0 && (
            <div className="mt-3 space-y-2 rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity per colour *</p>
              {colorSelections.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{c.name}</span>
                  <div className="w-36">
                    <QuantityStepper
                      id={`quantity-${c.name}`}
                      label={`Quantity for ${c.name}`}
                      value={c.quantity}
                      onChange={(value) => setColorQuantity(c.name, value)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => toggleColor(c.name)}
                    className="shrink-0 px-1 text-lg leading-none text-gray-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
      <div className={`grid gap-4 ${hasColors ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
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
        {!hasColors && (
          <div>
            <label className="label" htmlFor="quantity">Quantity *</label>
            <QuantityStepper
              id="quantity"
              label="Quantity"
              value={quantity}
              onChange={(value) => {
                setError(null);
                setQuantity(value);
              }}
            />
          </div>
        )}
      </div>
      <div>
        <label className="label" htmlFor="customerNote">Additional Information</label>
        <textarea className="input" id="customerNote" name="customerNote" rows={2} placeholder="Colour preference, delivery timing, questions…" />
      </div>

      <div className="flex items-center justify-between rounded-md bg-cream px-4 py-3 text-sm">
        <span className="font-medium text-navy">
          {productName}
          {colorSummary ? ` — ${colorSummary}` : ''} × {totalQuantity}
        </span>
        <span className="text-lg font-bold text-navy">{formatNaira(price * totalQuantity)}</span>
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
