import Link from 'next/link';
import { requireUser, accessibleSalesPageIds } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatNaira, ORDER_STATUSES, STATUS_LABELS, STATUS_STYLES } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string; source?: string };
}) {
  const user = await requireUser();
  const pageIds = await accessibleSalesPageIds(user);

  const where: any = {};
  if (pageIds !== null) where.salesPageId = { in: pageIds };
  if (searchParams.status && ORDER_STATUSES.includes(searchParams.status as any)) {
    where.status = searchParams.status;
  }
  if (searchParams.page) where.salesPageId = searchParams.page;
  if (searchParams.source) where.trafficSource = searchParams.source;
  const q = searchParams.q?.trim();
  if (q) {
    where.OR = [
      { ref: { contains: q } },
      { customerName: { contains: q } },
      { phone: { contains: q } },
      { productName: { contains: q } },
    ];
  }

  const [orders, salesPages] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { salesPage: { select: { slug: true } } },
    }),
    db.salesPage.findMany({
      where: pageIds !== null ? { id: { in: pageIds } } : {},
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Orders</h1>
        <p className="text-sm text-gray-500">{orders.length} shown</p>
      </div>

      <form className="admin-card grid gap-3 md:grid-cols-4" method="get">
        <input
          className="input"
          name="q"
          placeholder="Search ref, name, phone, product…"
          defaultValue={searchParams.q ?? ''}
        />
        <select className="input" name="status" defaultValue={searchParams.status ?? ''}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select className="input" name="page" defaultValue={searchParams.page ?? ''}>
          <option value="">All sales pages</option>
          {salesPages.map((p) => (
            <option key={p.id} value={p.id}>{p.product.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn-navy flex-1 py-2.5">Filter</button>
          <Link href="/admin/orders" className="btn-outline py-2.5">Reset</Link>
        </div>
      </form>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-cream/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy hover:text-gold">{o.ref}</Link>
                </td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">{o.phone}</td>
                <td className="px-4 py-3">{o.productName} × {o.quantity}</td>
                <td className="px-4 py-3 font-medium">{formatNaira(o.totalValue)}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{o.trafficSource ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {o.createdAt.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
