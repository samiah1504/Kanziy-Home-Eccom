import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatNaira, parseJsonArray } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  const products = await db.product.findMany({
    include: { salesPage: { select: { id: true, slug: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Products</h1>
        <Link href="/admin/products/new" className="btn-gold">+ New Product</Link>
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Sales Page</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No products yet. Create your first product.</td></tr>
            )}
            {products.map((p) => {
              const img = parseJsonArray<string>(p.images)[0];
              return (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-warmgrey" />
                      )}
                      <div>
                        <p className="font-semibold text-navy">{p.name}</p>
                        <p className="text-xs text-gray-500">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatNaira(p.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {!p.active && <Flag text="Inactive" tone="bg-red-50 text-red-700" />}
                      {p.onHomepage && <Flag text="Homepage" tone="bg-blue-50 text-blue-700" />}
                      {p.featured && <Flag text="Featured" tone="bg-gold/15 text-gold" />}
                      {p.bestSeller && <Flag text="Best Seller" tone="bg-green-50 text-green-700" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.salesPage ? (
                      <Link href={`/admin/pages/${p.salesPage.id}`} className={`text-xs font-semibold ${p.salesPage.status === 'PUBLISHED' ? 'text-green-700' : 'text-amber-700'}`}>
                        {p.salesPage.status}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-sm font-semibold text-navy hover:text-gold">Edit</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Flag({ text, tone }: { text: string; tone: string }) {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${tone}`}>{text}</span>;
}
