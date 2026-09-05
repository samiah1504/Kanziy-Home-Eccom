import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatNaira } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function pct(part: number, whole: number) {
  if (!whole) return '—';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default async function AnalyticsPage() {
  await requireRole('SUPER_ADMIN');

  const [pages, orders, statusEvents] = await Promise.all([
    db.salesPage.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { views: 'desc' },
    }),
    db.order.findMany({
      select: {
        id: true,
        salesPageId: true,
        status: true,
        totalValue: true,
        confirmedById: true,
      },
    }),
    db.orderEvent.findMany({
      where: { type: { in: ['STATUS_CHANGED', 'FOLLOW_UP_CLEARED'] }, userId: { not: null } },
      select: { userId: true, orderId: true, type: true },
    }),
  ]);

  const byPage = new Map<string, typeof orders>();
  for (const o of orders) {
    if (!o.salesPageId) continue;
    const list = byPage.get(o.salesPageId) ?? [];
    list.push(o);
    byPage.set(o.salesPageId, list);
  }

  // Staff performance
  const users = await db.user.findMany({ select: { id: true, name: true, role: true } });
  const staffRows = users
    .map((u) => {
      const events = statusEvents.filter((e) => e.userId === u.id);
      const handled = new Set(events.filter((e) => e.type === 'STATUS_CHANGED').map((e) => e.orderId)).size;
      const confirmed = orders.filter((o) => o.confirmedById === u.id).length;
      const followUpsDone = events.filter((e) => e.type === 'FOLLOW_UP_CLEARED').length;
      return { user: u, handled, confirmed, followUpsDone };
    })
    .filter((r) => r.handled > 0 || r.confirmed > 0 || r.followUpsDone > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Analytics</h1>

      <div className="admin-card overflow-x-auto p-0">
        <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-gold">Sales-Page Performance</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Page</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Lead Conv.</th>
              <th className="px-4 py-3">Confirmed</th>
              <th className="px-4 py-3">Conf. Rate</th>
              <th className="px-4 py-3">Not Buying</th>
              <th className="px-4 py-3">Not Reachable</th>
              <th className="px-4 py-3">Cancelled</th>
              <th className="px-4 py-3">Confirmed Value</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const list = byPage.get(p.id) ?? [];
              const count = (s: string) => list.filter((o) => o.status === s).length;
              const confirmed = count('CONFIRMED');
              const value = list
                .filter((o) => o.status === 'CONFIRMED')
                .reduce((sum, o) => sum + o.totalValue, 0);
              return (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-semibold text-navy">{p.product.name}</td>
                  <td className="px-4 py-3">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3">{list.length}</td>
                  <td className="px-4 py-3">{pct(list.length, p.views)}</td>
                  <td className="px-4 py-3 text-green-700">{confirmed}</td>
                  <td className="px-4 py-3">{pct(confirmed, list.length)}</td>
                  <td className="px-4 py-3">{count('NOT_BUYING')}</td>
                  <td className="px-4 py-3">{count('NOT_REACHABLE')}</td>
                  <td className="px-4 py-3">{count('CANCELLED')}</td>
                  <td className="px-4 py-3 font-medium">{formatNaira(value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-gold">Staff Performance</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Staff Member</th>
              <th className="px-4 py-3">Orders Handled</th>
              <th className="px-4 py-3">Confirmed</th>
              <th className="px-4 py-3">Confirmation Rate</th>
              <th className="px-4 py-3">Follow-ups Completed</th>
            </tr>
          </thead>
          <tbody>
            {staffRows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No staff activity yet.</td></tr>
            )}
            {staffRows.map((r) => (
              <tr key={r.user.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-semibold text-navy">{r.user.name}</td>
                <td className="px-4 py-3">{r.handled}</td>
                <td className="px-4 py-3 text-green-700">{r.confirmed}</td>
                <td className="px-4 py-3">{pct(r.confirmed, r.handled)}</td>
                <td className="px-4 py-3">{r.followUpsDone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
