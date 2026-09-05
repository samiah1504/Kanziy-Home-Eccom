import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseJsonArray, TEMPLATES } from '@/lib/utils';
import type { Faq, Testimonial } from '@/components/sales/types';
import { updateSalesPage } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditSalesPagePage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  const page = await db.salesPage.findUnique({
    where: { id: params.id },
    include: { product: { select: { id: true, name: true } } },
  });
  if (!page) notFound();

  const testimonials = parseJsonArray<Testimonial>(page.testimonials)
    .map((t) => [t.name, t.location ?? '', t.rating ?? 5, t.text].join(' | '))
    .join('\n');
  const faqs = parseJsonArray<Faq>(page.faqs)
    .map((f) => `${f.q} | ${f.a}`)
    .join('\n');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/pages" className="text-sm text-gray-500 hover:text-gold">← Sales Pages</Link>
          <h1 className="text-2xl font-bold text-navy">Sales Page — {page.product.name}</h1>
        </div>
        <div className="flex gap-2">
          <a href={`/products/${page.slug}`} target="_blank" className="btn-outline py-2 text-xs">
            {page.status === 'PUBLISHED' ? 'View Live' : 'Preview (publish first)'}
          </a>
          <Link href={`/admin/products/${page.product.id}`} className="btn-navy py-2 text-xs">Edit Product</Link>
        </div>
      </div>

      <form action={updateSalesPage.bind(null, page.id)} className="space-y-5">
        <div className="admin-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Page Setup</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">URL Slug *</label>
              <input className="input" name="slug" required defaultValue={page.slug} />
              <p className="mt-1 text-xs text-gray-400">kanziy.com/products/…</p>
            </div>
            <div>
              <label className="label">Template</label>
              <select className="input" name="template" defaultValue={page.template}>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Switching template keeps the URL and all content.</p>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" name="status" defaultValue={page.status}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="UNPUBLISHED">Unpublished</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Conversion Copy</h2>
          <div>
            <label className="label">Headline (defaults to product name)</label>
            <input className="input" name="headline" defaultValue={page.headline ?? ''} placeholder="Premium Executive Seating for Your Workspace" />
          </div>
          <div>
            <label className="label">Subheadline</label>
            <input className="input" name="subheadline" defaultValue={page.subheadline ?? ''} />
          </div>
          <div>
            <label className="label">CTA Button Text</label>
            <input className="input" name="ctaText" defaultValue={page.ctaText ?? ''} placeholder="Order Now" />
          </div>
          <div>
            <label className="label">Selling Points (one per line — defaults to product features)</label>
            <textarea className="input" name="sellingPoints" rows={4} defaultValue={parseJsonArray<string>(page.sellingPoints).join('\n')} />
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Social Proof</h2>
          <div>
            <label className="label">Previous Delivery Photo URLs (one per line)</label>
            <textarea className="input font-mono text-xs" name="deliveryPhotos" rows={4} defaultValue={parseJsonArray<string>(page.deliveryPhotos).join('\n')} />
          </div>
          <div>
            <label className="label">Testimonials (Name | Location | Rating 1–5 | Text — one per line)</label>
            <textarea className="input" name="testimonials" rows={4} defaultValue={testimonials} placeholder="Mrs Adebayo | Lagos | 5 | Excellent chair, delivered and installed the same week." />
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gold">FAQ</h2>
          <div>
            <label className="label">FAQs (Question | Answer — one per line)</label>
            <textarea className="input" name="faqs" rows={5} defaultValue={faqs} placeholder="Is delivery free? | Yes, delivery is completely free nationwide." />
          </div>
        </div>

        <button type="submit" className="btn-gold">Save Sales Page</button>
      </form>
    </div>
  );
}
