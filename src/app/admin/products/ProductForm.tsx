// Shared create/edit product form. JSON-backed fields are edited as simple
// line/comma-separated text and parsed server-side.

import { parseJsonArray } from '@/lib/utils';
import type { Product } from '@prisma/client';

function joinLines(json: string | null | undefined) {
  return parseJsonArray<string>(json).join('\n');
}

function joinSpecs(json: string | null | undefined) {
  return parseJsonArray<{ label: string; value: string }>(json)
    .map((s) => `${s.label}: ${s.value}`)
    .join('\n');
}

export default function ProductForm({
  product,
  action,
  submitLabel,
}: {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="admin-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Basics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Product Name *</label>
            <input className="input" name="name" required defaultValue={product?.name} placeholder="Executive Office Chair" />
          </div>
          <div>
            <label className="label">Slug (URL)</label>
            <input className="input" name="slug" defaultValue={product?.slug} placeholder="executive-chair (auto from name)" />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" name="category" defaultValue={product?.category ?? ''} placeholder="Office Chairs" />
          </div>
          <div>
            <label className="label">Price (₦) *</label>
            <input className="input" name="price" type="number" min={0} required defaultValue={product?.price} />
          </div>
        </div>
        <div>
          <label className="label">Short Selling Pitch</label>
          <input className="input" name="shortPitch" defaultValue={product?.shortPitch ?? ''} placeholder="Premium executive seating for your workspace" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" name="description" rows={4} defaultValue={product?.description ?? ''} />
        </div>
      </div>

      <div className="admin-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Media</h2>
        <div>
          <label className="label">Image URLs (one per line, first = main image)</label>
          <textarea className="input font-mono text-xs" name="images" rows={4} defaultValue={joinLines(product?.images)} placeholder="https://…/chair-front.jpg" />
        </div>
        <div>
          <label className="label">Video URL (YouTube, Vimeo or direct MP4)</label>
          <input className="input" name="videoUrl" defaultValue={product?.videoUrl ?? ''} />
        </div>
      </div>

      <div className="admin-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Key Features (one per line)</label>
            <textarea className="input" name="features" rows={4} defaultValue={joinLines(product?.features)} placeholder="Ergonomic lumbar support" />
          </div>
          <div>
            <label className="label">Specifications (Label: value, one per line)</label>
            <textarea className="input" name="specifications" rows={4} defaultValue={joinSpecs(product?.specifications)} placeholder="Weight capacity: 150kg" />
          </div>
          <div>
            <label className="label">Dimensions</label>
            <input className="input" name="dimensions" defaultValue={product?.dimensions ?? ''} placeholder="H120 × W65 × D70 cm" />
          </div>
          <div>
            <label className="label">Materials</label>
            <input className="input" name="materials" defaultValue={product?.materials ?? ''} placeholder="Genuine leather, chrome base" />
          </div>
          <div>
            <label className="label">Colours (comma separated)</label>
            <input className="input" name="colors" defaultValue={parseJsonArray<string>(product?.colors).join(', ')} placeholder="Black, Brown, White" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Delivery Information</label>
            <textarea className="input" name="deliveryInfo" rows={2} defaultValue={product?.deliveryInfo ?? ''} placeholder="Free nationwide delivery within 3–7 working days" />
          </div>
          <div>
            <label className="label">Installation Information</label>
            <textarea className="input" name="installationInfo" rows={2} defaultValue={product?.installationInfo ?? ''} placeholder="Free professional installation included" />
          </div>
        </div>
      </div>

      <div className="admin-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Visibility & SEO</h2>
        <div className="flex flex-wrap gap-6">
          {[
            { name: 'active', label: 'Active', checked: product?.active ?? true },
            { name: 'onHomepage', label: 'Show on Homepage', checked: product?.onHomepage ?? false },
            { name: 'featured', label: 'Featured', checked: product?.featured ?? false },
            { name: 'bestSeller', label: 'Best Seller badge', checked: product?.bestSeller ?? false },
          ].map((c) => (
            <label key={c.name} className="flex items-center gap-2 text-sm font-medium text-charcoal">
              <input type="checkbox" name={c.name} defaultChecked={c.checked} className="h-4 w-4 accent-gold" />
              {c.label}
            </label>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">SEO Title</label>
            <input className="input" name="seoTitle" defaultValue={product?.seoTitle ?? ''} />
          </div>
          <div>
            <label className="label">SEO Description</label>
            <input className="input" name="seoDescription" defaultValue={product?.seoDescription ?? ''} />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-gold">{submitLabel}</button>
    </form>
  );
}
