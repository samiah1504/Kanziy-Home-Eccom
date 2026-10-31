import { db } from './db';

export type SiteSettings = {
  phone: string;
  whatsapp: string; // international format without "+", e.g. 2348012345678
  metaPixelId: string;
  metaCapiToken: string;
  metaTestEventCode: string;
  siteName: string;
  tagline: string;
};

const DEFAULTS: SiteSettings = {
  phone: '',
  whatsapp: '',
  metaPixelId: '',
  metaCapiToken: '',
  metaTestEventCode: '',
  siteName: 'Kanziy',
  tagline: 'Spaces That Work for You.',
};

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    ...DEFAULTS,
    ...map,
    // env fallbacks for tracking config (admin settings take precedence)
    metaPixelId: map.metaPixelId || process.env.META_PIXEL_ID || '',
    metaCapiToken: map.metaCapiToken || process.env.META_CAPI_ACCESS_TOKEN || '',
    metaTestEventCode:
      map.metaTestEventCode || process.env.META_TEST_EVENT_CODE || '',
  } as SiteSettings;
}

export async function saveSettings(values: Partial<SiteSettings>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}

/**
 * WhatsApp links need the number in international format without "+".
 * Customers usually type Nigerian numbers locally (0801 234 5678), so those
 * are converted to 234…; numbers already in another format are left as-is.
 */
export function toWhatsAppNumber(number: string) {
  const digits = number.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('0')) return `234${digits.slice(1)}`; // 0801…
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`; // 801… (leading 0 dropped)
  if (digits.length === 14 && digits.startsWith('2340')) return `234${digits.slice(4)}`; // +234 0801…
  return digits;
}

export function whatsappLink(number: string, text?: string) {
  const clean = toWhatsAppNumber(number);
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${clean}${q}`;
}
