'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { slugify } from '@/lib/utils';

function lines(value: FormDataEntryValue | null): string {
  const arr = String(value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

function specLines(value: FormDataEntryValue | null): string {
  // "Label: value" per line
  const arr = String(value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { label: line, value: '' };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });
  return JSON.stringify(arr);
}

// Parse a JSON hidden field from the media/colour editors, keeping only
// well-formed entries so malformed input can never break page rendering.
function mediaList(value: FormDataEntryValue | null): { url: string; poster?: string }[] {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v.url === 'string' && v.url.trim())
      .slice(0, 50)
      .map((v) => ({
        url: String(v.url).trim().slice(0, 1000),
        ...(typeof v.poster === 'string' && v.poster.trim()
          ? { poster: v.poster.trim().slice(0, 1000) }
          : {}),
      }));
  } catch {
    return [];
  }
}

function urlList(value: FormDataEntryValue | null): string[] {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => typeof v === 'string' && v.trim())
      .slice(0, 50)
      .map((v) => String(v).trim().slice(0, 1000));
  } catch {
    return [];
  }
}

function variantList(value: FormDataEntryValue | null): { name: string; image?: string }[] {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v.name === 'string' && v.name.trim())
      .slice(0, 30)
      .map((v) => ({
        name: String(v.name).trim().slice(0, 100),
        ...(typeof v.image === 'string' && v.image.trim()
          ? { image: v.image.trim().slice(0, 1000) }
          : {}),
      }));
  } catch {
    return [];
  }
}

function productData(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const slug = slugify(String(formData.get('slug') || '') || name);
  const variants = variantList(formData.get('colorVariantsJson'));
  return {
    name,
    slug,
    category: String(formData.get('category') || '').trim() || null,
    price: Math.max(0, parseInt(String(formData.get('price')), 10) || 0),
    shortPitch: String(formData.get('shortPitch') || '').trim() || null,
    description: String(formData.get('description') || '').trim() || null,
    features: lines(formData.get('features')),
    specifications: specLines(formData.get('specifications')),
    dimensions: String(formData.get('dimensions') || '').trim() || null,
    materials: String(formData.get('materials') || '').trim() || null,
    colorVariants: JSON.stringify(variants),
    // Keep the legacy names-only list in sync for anything still reading it.
    colors: JSON.stringify(variants.map((v) => v.name)),
    deliveryInfo: String(formData.get('deliveryInfo') || '').trim() || null,
    installationInfo: String(formData.get('installationInfo') || '').trim() || null,
    images: JSON.stringify(urlList(formData.get('imagesJson'))),
    videos: JSON.stringify(mediaList(formData.get('videosJson'))),
    // The editor folds the legacy single URL into the videos list, so clear
    // it to avoid the same video rendering twice.
    videoUrl: null,
    featured: formData.get('featured') === 'on',
    onHomepage: formData.get('onHomepage') === 'on',
    bestSeller: formData.get('bestSeller') === 'on',
    active: formData.get('active') === 'on',
    seoTitle: String(formData.get('seoTitle') || '').trim() || null,
    seoDescription: String(formData.get('seoDescription') || '').trim() || null,
  };
}

export async function createProduct(formData: FormData) {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  const data = productData(formData);
  if (!data.name || !data.slug) throw new Error('Name is required');

  const product = await db.product.create({ data });
  // Every product gets a draft sales page immediately — same slug, default
  // template — so publishing is a single step once content is ready.
  await db.salesPage.create({
    data: {
      productId: product.id,
      slug: data.slug,
      template: 'clean',
      status: 'DRAFT',
    },
  });
  revalidatePath('/');
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  const data = productData(formData);
  if (!data.name || !data.slug) throw new Error('Name is required');
  const product = await db.product.update({
    where: { id },
    data,
    include: { salesPage: { select: { slug: true } } },
  });
  revalidatePath('/');
  revalidatePath(`/admin/products/${id}`);
  if (product.salesPage) revalidatePath(`/products/${product.salesPage.slug}`);
  redirect('/admin/products');
}
