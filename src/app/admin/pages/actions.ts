'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { slugify, TEMPLATES } from '@/lib/utils';

function lines(value: FormDataEntryValue | null): string {
  return JSON.stringify(
    String(value || '').split('\n').map((s) => s.trim()).filter(Boolean)
  );
}

function urlList(value: FormDataEntryValue | null): string {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) return '[]';
    return JSON.stringify(
      parsed
        .filter((v) => typeof v === 'string' && v.trim())
        .slice(0, 50)
        .map((v) => String(v).trim().slice(0, 1000))
    );
  } catch {
    return '[]';
  }
}

function mediaList(value: FormDataEntryValue | null): string {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) return '[]';
    return JSON.stringify(
      parsed
        .filter((v) => v && typeof v.url === 'string' && v.url.trim())
        .slice(0, 50)
        .map((v) => ({
          url: String(v.url).trim().slice(0, 1000),
          ...(typeof v.poster === 'string' && v.poster.trim()
            ? { poster: v.poster.trim().slice(0, 1000) }
            : {}),
        }))
    );
  } catch {
    return '[]';
  }
}

// "Name | Location | Rating | Text" per line (location/rating optional).
function testimonialLines(value: FormDataEntryValue | null): string {
  const items = String(value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 4) {
        return {
          name: parts[0],
          location: parts[1] || undefined,
          rating: Math.min(Math.max(parseInt(parts[2], 10) || 5, 1), 5),
          text: parts.slice(3).join(' | '),
        };
      }
      if (parts.length === 3) {
        return { name: parts[0], location: parts[1] || undefined, text: parts[2], rating: 5 };
      }
      if (parts.length === 2) {
        return { name: parts[0], text: parts[1], rating: 5 };
      }
      return { name: 'Kanziy Customer', text: parts[0], rating: 5 };
    });
  return JSON.stringify(items);
}

// "Question | Answer" per line.
function faqLines(value: FormDataEntryValue | null): string {
  const items = String(value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('|');
      if (idx === -1) return { q: line, a: '' };
      return { q: line.slice(0, idx).trim(), a: line.slice(idx + 1).trim() };
    })
    .filter((f) => f.q && f.a);
  return JSON.stringify(items);
}

export async function updateSalesPage(id: string, formData: FormData) {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');

  const template = String(formData.get('template') || 'clean');
  if (!TEMPLATES.some((t) => t.id === template)) throw new Error('Invalid template');

  const status = String(formData.get('status') || 'DRAFT');
  if (!['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(status)) throw new Error('Invalid status');

  const slug = slugify(String(formData.get('slug') || ''));
  if (!slug) throw new Error('Slug is required');

  await db.salesPage.update({
    where: { id },
    data: {
      slug,
      template,
      status,
      headline: String(formData.get('headline') || '').trim() || null,
      subheadline: String(formData.get('subheadline') || '').trim() || null,
      ctaText: String(formData.get('ctaText') || '').trim() || null,
      sellingPoints: lines(formData.get('sellingPoints')),
      testimonials: testimonialLines(formData.get('testimonials')),
      deliveryPhotos: urlList(formData.get('deliveryPhotosJson')),
      deliveryVideos: mediaList(formData.get('deliveryVideosJson')),
      faqs: faqLines(formData.get('faqs')),
    },
  });

  revalidatePath('/');
  revalidatePath(`/products/${slug}`);
  redirect('/admin/pages');
}
