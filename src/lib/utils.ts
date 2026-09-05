export function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

export function parseJsonArray<T = string>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Order reference like KZ-84213. Uniqueness is enforced by the DB. */
export function generateOrderRef() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `KZ-${n}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Derive a coarse traffic source from attribution parameters. */
export function deriveTrafficSource(a: {
  utmSource?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  referrer?: string | null;
}): string {
  const src = (a.utmSource || '').toLowerCase();
  if (src.includes('instagram') || src === 'ig') return 'instagram';
  if (src.includes('facebook') || src.includes('meta') || src === 'fb') return 'meta';
  if (src.includes('google')) return 'google';
  if (src) return src;
  if (a.fbclid) return 'meta';
  if (a.gclid) return 'google';
  const ref = (a.referrer || '').toLowerCase();
  if (ref.includes('instagram')) return 'instagram';
  if (ref.includes('facebook')) return 'meta';
  if (ref.includes('google')) return 'organic';
  if (ref) return 'referral';
  return 'direct';
}

export const ORDER_STATUSES = [
  'NEW',
  'CONFIRMED',
  'NOT_BUYING',
  'NOT_REACHABLE',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New Order',
  CONFIRMED: 'Confirmed',
  NOT_BUYING: 'Not Buying',
  NOT_REACHABLE: 'Not Reachable',
  CANCELLED: 'Cancelled',
};

export const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-green-50 text-green-800 border-green-200',
  NOT_BUYING: 'bg-gray-100 text-gray-700 border-gray-200',
  NOT_REACHABLE: 'bg-amber-50 text-amber-800 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export const TEMPLATES = [
  { id: 'clean', name: 'Template A — Clean / Premium' },
  { id: 'bold', name: 'Template B — Bold / Conversion-focused' },
  { id: 'editorial', name: 'Template C — Editorial / Luxury' },
  { id: 'direct', name: 'Template D — Mobile-first / Direct-response' },
] as const;
