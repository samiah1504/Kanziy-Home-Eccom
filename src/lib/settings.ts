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

export function whatsappLink(number: string, text?: string) {
  const clean = number.replace(/[^0-9]/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${clean}${q}`;
}
