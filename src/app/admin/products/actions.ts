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

function csv(value: FormDataEntryValue | null): string {
  const arr = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

function productData(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const slug = slugify(String(formData.get('slug') || '') || name);
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
    colors: csv(formData.get('colors')),
    deliveryInfo: String(formData.get('deliveryInfo') || '').trim() || null,
    installationInfo: String(formData.get('installationInfo') || '').trim() || null,
    images: lines(formData.get('images')),
    videoUrl: String(formData.get('videoUrl') || '').trim() || null,
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
  await db.product.update({ where: { id }, data });
  revalidatePath('/');
  revalidatePath(`/admin/products/${id}`);
  redirect('/admin/products');
}
