import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kanziy.com';
  const pages = await db.salesPage.findMany({
    where: { status: 'PUBLISHED', product: { active: true } },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...pages.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
