import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { TEMPLATES } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, string> = {
  PUBLISHED: 'bg-green-50 text-green-700 border-green-200',
  DRAFT: 'bg-amber-50 text-amber-800 border-amber-200',
  UNPUBLISHED: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default async function SalesPagesPage() {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  const pages = await db.salesPage.findMany({
    include: {
      product: { select: { name: true, price: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Sales Pages</h1>
        <p className="text-sm text-gray-500">
          Pages are created automatically with each product — edit, choose a template, then publish.
        </p>
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">URL</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No sales pages yet — create a product first.</td></tr>
            )}
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-cream/60">
                <td className="px-4 py-3 font-semibold text-navy">{p.product.name}</td>
                <td className="px-4 py-3">
                  <a href={`/products/${p.slug}`} target="_blank" className="text-gray-600 underline hover:text-gold">
                    /products/{p.slug}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {TEMPLATES.find((t) => t.id === p.template)?.name.split('—')[1]?.trim() ?? p.template}
                </td>
                <td className="px-4 py-3">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3">{p._count.orders}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/pages/${p.id}`} className="text-sm font-semibold text-navy hover:text-gold">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
