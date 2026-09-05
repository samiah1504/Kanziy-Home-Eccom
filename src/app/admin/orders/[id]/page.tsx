import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser, accessibleSalesPageIds } from '@/lib/auth';
import { db } from '@/lib/db';
import { whatsappLink } from '@/lib/settings';
import { formatNaira, STATUS_LABELS, STATUS_STYLES } from '@/lib/utils';
import {
  addOrderNote, clearFollowUp, confirmOrder, retryPurchaseEvent,
  setFollowUp, setOrderStatus,
} from '../actions';
import CopyForOps from './CopyForOps';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      salesPage: { select: { slug: true } },
      confirmedBy: { select: { name: true } },
      notes: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!order) notFound();

  const pageIds = await accessibleSalesPageIds(user);
  if (pageIds !== null && (!order.salesPageId || !pageIds.includes(order.salesPageId))) {
    notFound();
  }

  // Automatic timeline: record first view by this staff member (before the
  // events query so it appears on this very render).
  const viewed = await db.orderEvent.findFirst({
    where: { orderId: order.id, userId: user.id, type: 'VIEWED' },
  });
  if (!viewed) {
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        userId: user.id,
        type: 'VIEWED',
        message: `Order viewed by ${user.name}`,
      },
    });
  }

  const events = await db.orderEvent.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'asc' },
  });

  const opsText = [
    `KANZIY ORDER — ${order.ref}`,
    `Product: ${order.productName}`,
    `Quantity: ${order.quantity}`,
    `Unit Price: ${formatNaira(order.unitPrice)}`,
    `Order Value: ${formatNaira(order.totalValue)}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    order.whatsapp ? `WhatsApp: ${order.whatsapp}` : null,
    `Address: ${order.address}${order.city ? `, ${order.city}` : ''}, ${order.state}`,
    order.customerNote ? `Customer Note: ${order.customerNote}` : null,
    order.confirmedAt ? `Confirmed: ${order.confirmedAt.toLocaleString('en-NG')}` : null,
  ].filter(Boolean).join('\n');

  const fmt = (d: Date) =>
    d.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gold">← Orders</Link>
          <h1 className="text-2xl font-bold text-navy">
            {order.ref}
            <span className={`ml-3 rounded-full border px-3 py-1 align-middle text-sm font-medium ${STATUS_STYLES[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </h1>
        </div>
        <p className="text-sm text-gray-500">Submitted {fmt(order.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: customer + order + source */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="admin-card">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Customer</h2>
              <dl className="space-y-1.5 text-sm">
                <div><dt className="inline text-gray-500">Name: </dt><dd className="inline font-semibold text-navy">{order.customerName}</dd></div>
                <div><dt className="inline text-gray-500">Phone: </dt><dd className="inline font-medium">{order.phone}</dd></div>
                {order.whatsapp && <div><dt className="inline text-gray-500">WhatsApp: </dt><dd className="inline">{order.whatsapp}</dd></div>}
                <div><dt className="inline text-gray-500">Address: </dt><dd className="inline">{order.address}{order.city ? `, ${order.city}` : ''}, {order.state}</dd></div>
                {order.customerNote && <div><dt className="inline text-gray-500">Customer note: </dt><dd className="inline">{order.customerNote}</dd></div>}
              </dl>
              <div className="mt-4 flex gap-2">
                <a href={`tel:${order.phone}`} className="btn-navy flex-1 py-2 text-xs">Call Customer</a>
                <a
                  href={whatsappLink(order.whatsapp || order.phone, `Hello ${order.customerName.split(' ')[0]}, this is Kanziy Customer Support regarding your order ${order.ref} (${order.productName}).`)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-gold flex-1 py-2 text-xs"
                >
                  WhatsApp Customer
                </a>
              </div>
            </div>

            <div className="admin-card">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Order</h2>
              <dl className="space-y-1.5 text-sm">
                <div><dt className="inline text-gray-500">Product: </dt><dd className="inline font-semibold text-navy">{order.productName}</dd></div>
                <div><dt className="inline text-gray-500">Quantity: </dt><dd className="inline">{order.quantity}</dd></div>
                <div><dt className="inline text-gray-500">Unit price: </dt><dd className="inline">{formatNaira(order.unitPrice)}</dd></div>
                <div><dt className="inline text-gray-500">Total: </dt><dd className="inline text-lg font-bold text-navy">{formatNaira(order.totalValue)}</dd></div>
                {order.confirmedBy && (
                  <div><dt className="inline text-gray-500">Confirmed by: </dt><dd className="inline">{order.confirmedBy.name} · {order.confirmedAt ? fmt(order.confirmedAt) : ''}</dd></div>
                )}
              </dl>
              <h2 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-gold">Source</h2>
              <dl className="space-y-1.5 text-sm">
                <div><dt className="inline text-gray-500">Sales page: </dt>
                  <dd className="inline">
                    {order.salesPage ? (
                      <a href={`/products/${order.salesPage.slug}`} target="_blank" className="text-navy underline hover:text-gold">/products/{order.salesPage.slug}</a>
                    ) : '—'}
                  </dd>
                </div>
                <div><dt className="inline text-gray-500">Traffic source: </dt><dd className="inline capitalize">{order.trafficSource ?? '—'}</dd></div>
                {order.utmCampaign && <div><dt className="inline text-gray-500">Campaign: </dt><dd className="inline">{order.utmCampaign}</dd></div>}
                {order.utmMedium && <div><dt className="inline text-gray-500">Medium: </dt><dd className="inline">{order.utmMedium}</dd></div>}
                {order.utmContent && <div><dt className="inline text-gray-500">Ad content: </dt><dd className="inline">{order.utmContent}</dd></div>}
              </dl>
            </div>
          </div>

          {/* Internal notes */}
          <div className="admin-card">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Internal Notes</h2>
            <form action={addOrderNote.bind(null, order.id)} className="mb-4 flex gap-2">
              <input className="input" name="text" placeholder="Add an internal note (never shown to the customer)…" required />
              <button type="submit" className="btn-navy whitespace-nowrap py-2">Add Note</button>
            </form>
            {order.notes.length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {order.notes.map((n) => (
                  <li key={n.id} className="rounded-md bg-cream p-3 text-sm">
                    <p className="text-charcoal">{n.text}</p>
                    <p className="mt-1 text-xs text-gray-500">{n.user?.name ?? 'Staff'} · {fmt(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity timeline */}
          <div className="admin-card">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Activity Timeline</h2>
            <ol className="space-y-2 border-l-2 border-gray-100 pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gold" aria-hidden />
                  <span className="text-gray-500">{fmt(e.createdAt)}</span>
                  {' — '}
                  <span className="text-charcoal">{e.message}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <div className="admin-card">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Actions</h2>
            <div className="space-y-2">
              <form action={confirmOrder.bind(null, order.id)}>
                <button
                  type="submit"
                  disabled={order.status === 'CONFIRMED'}
                  className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {order.status === 'CONFIRMED' ? '✓ Order Confirmed' : 'Confirm Order'}
                </button>
              </form>
              <form action={setOrderStatus.bind(null, order.id, 'NOT_BUYING')}>
                <button type="submit" className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  Not Buying
                </button>
              </form>
              <form action={setOrderStatus.bind(null, order.id, 'NOT_REACHABLE')}>
                <button type="submit" className="w-full rounded-md border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50">
                  Not Reachable
                </button>
              </form>
              <form action={setOrderStatus.bind(null, order.id, 'CANCELLED')}>
                <button type="submit" className="w-full rounded-md border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Cancelled
                </button>
              </form>
            </div>
          </div>

          {/* Meta Purchase event state */}
          <div className="admin-card">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Meta Purchase Event</h2>
            <p className="text-sm">
              Status:{' '}
              <span className={`font-semibold ${
                order.purchaseEventStatus === 'SENT' ? 'text-green-700'
                : order.purchaseEventStatus === 'FAILED' ? 'text-red-700'
                : 'text-gray-600'
              }`}>
                {order.purchaseEventStatus.replace('_', ' ')}
              </span>
            </p>
            {order.purchaseEventSentAt && (
              <p className="mt-1 text-xs text-gray-500">Sent {fmt(order.purchaseEventSentAt)}</p>
            )}
            {order.purchaseEventError && (
              <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{order.purchaseEventError}</p>
            )}
            {order.status === 'CONFIRMED' &&
              ['FAILED', 'SKIPPED'].includes(order.purchaseEventStatus) && (
                <form action={retryPurchaseEvent.bind(null, order.id)} className="mt-3">
                  <button type="submit" className="btn-navy w-full py-2 text-xs">Retry Purchase Event</button>
                </form>
              )}
            <p className="mt-3 text-xs text-gray-400">
              Purchase fires once per order — duplicate sends are blocked automatically.
            </p>
          </div>

          {/* Follow-up */}
          <div className="admin-card">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Follow-Up</h2>
            {order.followUpAt ? (
              <div className="space-y-2 text-sm">
                <p>
                  Due{' '}
                  <span className="font-semibold text-navy">
                    {order.followUpAt.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  {order.followUpNote ? ` — ${order.followUpNote}` : ''}
                </p>
                <form action={clearFollowUp.bind(null, order.id)}>
                  <button type="submit" className="btn-outline w-full py-2 text-xs">Mark Follow-Up Done</button>
                </form>
              </div>
            ) : (
              <form action={setFollowUp.bind(null, order.id)} className="space-y-2">
                <input className="input" type="date" name="date" required />
                <input className="input" name="note" placeholder="Reason (optional)" />
                <button type="submit" className="btn-navy w-full py-2 text-xs">Set Follow-Up</button>
              </form>
            )}
          </div>

          {/* Operations handoff */}
          <div className="admin-card">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gold">Operations App Handoff</h2>
            <pre className="mb-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-charcoal">{opsText}</pre>
            <CopyForOps orderId={order.id} text={opsText} />
          </div>
        </div>
      </div>
    </div>
  );
}
