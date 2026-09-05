import Link from 'next/link';
import { requireUser, accessibleSalesPageIds } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatNaira, STATUS_LABELS, STATUS_STYLES } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await requireUser();
  const pageIds = await accessibleSalesPageIds(user);
  const scope = pageIds === null ? {} : { salesPageId: { in: pageIds } };

  const [byStatus, followUpsDue, confirmedAgg, topPages, recentOrders] =
    await Promise.all([
      db.order.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
      db.order.findMany({
        where: { ...scope, followUpAt: { lte: new Date() }, status: { in: ['NEW', 'NOT_REACHABLE'] } },
        orderBy: { followUpAt: 'asc' },
        take: 10,
        include: { salesPage: { select: { slug: true } } },
      }),
      db.order.aggregate({
        where: { ...scope, status: 'CONFIRMED' },
        _sum: { totalValue: true },
      }),
      db.order.groupBy({
        by: ['salesPageId'],
        where: { ...scope, status: 'CONFIRMED' },
        _count: { _all: true },
        _sum: { totalValue: true },
        orderBy: { _count: { salesPageId: 'desc' } },
        take: 5,
      }),
      db.order.findMany({
        where: scope,
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const pageNames = new Map(
    (
      await db.salesPage.findMany({
        where: { id: { in: topPages.map((t) => t.salesPageId).filter(Boolean) as string[] } },
        include: { product: { select: { name: true } } },
      })
    ).map((p) => [p.id, p.product.name])
  );

  const stats = [
    { label: 'New Orders', value: counts.NEW ?? 0, style: 'text-blue-700' },
    { label: 'Confirmed', value: counts.CONFIRMED ?? 0, style: 'text-green-700' },
    { label: 'Not Buying', value: counts.NOT_BUYING ?? 0, style: 'text-gray-600' },
    { label: 'Not Reachable', value: counts.NOT_REACHABLE ?? 0, style: 'text-amber-700' },
    { label: 'Cancelled', value: counts.CANCELLED ?? 0, style: 'text-red-700' },
    { label: 'Follow-ups Due', value: followUpsDue.length, style: 'text-gold' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="admin-card text-center">
            <p className={`text-3xl font-extrabold ${s.style}`}>{s.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-card flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Confirmed Sales Value</p>
          <p className="text-3xl font-extrabold text-navy">
            {formatNaira(confirmedAgg._sum.totalValue ?? 0)}
          </p>
        </div>
        <Link href="/admin/orders" className="btn-navy">View Orders</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card">
          <h2 className="mb-4 font-bold text-navy">Follow-ups Due</h2>
          {followUpsDue.length === 0 ? (
            <p className="text-sm text-gray-500">No follow-ups due. 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {followUpsDue.map((o) => (
                <li key={o.id} className="py-2.5">
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between text-sm hover:text-gold">
                    <span>
                      <span className="font-semibold text-navy">{o.customerName}</span>
                      {' · '}{o.productName}
                      {o.followUpNote ? <span className="text-gray-500"> — {o.followUpNote}</span> : null}
                    </span>
                    <span className="text-xs text-amber-700">
                      {o.followUpAt?.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-card">
          <h2 className="mb-4 font-bold text-navy">Top Performing Pages (Confirmed)</h2>
          {topPages.length === 0 ? (
            <p className="text-sm text-gray-500">No confirmed orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {topPages.map((t) => (
                <li key={t.salesPageId ?? 'none'} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-navy">
                    {t.salesPageId ? pageNames.get(t.salesPageId) ?? 'Unknown page' : 'Direct'}
                  </span>
                  <span className="text-gray-600">
                    {t._count._all} confirmed · {formatNaira(t._sum.totalValue ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h2 className="mb-4 font-bold text-navy">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Ref</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy hover:text-gold">{o.ref}</Link>
                    </td>
                    <td className="py-2.5 pr-4">{o.customerName}</td>
                    <td className="py-2.5 pr-4">{o.productName} × {o.quantity}</td>
                    <td className="py-2.5 pr-4">{formatNaira(o.totalValue)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {o.createdAt.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
