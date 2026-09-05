'use server';

// Customer Support order workflow. Every action re-checks authentication,
// role and sales-page access server-side, and every important action is
// written to the order's activity timeline.

import { revalidatePath } from 'next/cache';
import { requireUser, accessibleSalesPageIds } from '@/lib/auth';
import { db } from '@/lib/db';
import { newEventId, sendMetaEvent } from '@/lib/meta';
import { STATUS_LABELS } from '@/lib/utils';

async function getAuthorizedOrder(orderId: string) {
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });
  if (!order) throw new Error('Order not found');
  const pageIds = await accessibleSalesPageIds(user);
  if (pageIds !== null && (!order.salesPageId || !pageIds.includes(order.salesPageId))) {
    throw new Error('You do not have access to this order');
  }
  return { user, order };
}

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

/**
 * Confirm an order. Fires the Meta Purchase event exactly once per order:
 * the event send is claimed atomically (updateMany guarded on
 * purchaseEventStatus), so double-clicks or concurrent confirms can never
 * produce a second Purchase. The event_id is generated once and reused for
 * any retry, so Meta-side deduplication also protects the edge cases.
 */
export async function confirmOrder(orderId: string) {
  const { user, order } = await getAuthorizedOrder(orderId);

  // Move to CONFIRMED (idempotent — only from a non-confirmed state).
  const claimed = await db.order.updateMany({
    where: { id: orderId, status: { not: 'CONFIRMED' } },
    data: {
      status: 'CONFIRMED',
      confirmedById: user.id,
      confirmedAt: new Date(),
    },
  });
  if (claimed.count > 0) {
    await db.orderEvent.create({
      data: {
        orderId,
        userId: user.id,
        type: 'STATUS_CHANGED',
        message: `Order confirmed by ${user.name}`,
      },
    });
  }

  await firePurchaseEvent(orderId, user.id, order.ref);
  refresh(orderId);
}

/** Retry a failed/skipped Purchase event for an already-confirmed order. */
export async function retryPurchaseEvent(orderId: string) {
  const { user, order } = await getAuthorizedOrder(orderId);
  if (order.status !== 'CONFIRMED') throw new Error('Order is not confirmed');
  await firePurchaseEvent(orderId, user.id, order.ref);
  refresh(orderId);
}

async function firePurchaseEvent(orderId: string, userId: string, ref: string) {
  // Stable event_id for the life of the order (dedup key at Meta).
  const existing = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  let eventId = existing.purchaseEventId;
  if (!eventId) {
    eventId = newEventId();
    await db.order.update({
      where: { id: orderId },
      data: { purchaseEventId: eventId },
    });
  }

  // Atomically claim the send. If another request already sent (or is
  // sending) the event, count === 0 and we do nothing — this is the
  // duplicate-Purchase protection.
  const claim = await db.order.updateMany({
    where: {
      id: orderId,
      purchaseEventStatus: { in: ['NOT_SENT', 'FAILED', 'SKIPPED'] },
    },
    data: { purchaseEventStatus: 'SENDING' },
  });
  if (claim.count === 0) return;

  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { product: true },
  });

  const result = await sendMetaEvent({
    eventName: 'Purchase',
    eventId,
    eventSourceUrl: order.landingUrl,
    value: order.totalValue,
    currency: 'NGN',
    contentIds: [order.product.slug],
    contentName: order.productName,
    userData: {
      phone: order.phone,
      ip: order.ip,
      userAgent: order.userAgent,
      fbp: order.fbp,
      fbc: order.fbc,
    },
  });

  if (result.status === 'SENT') {
    await db.order.update({
      where: { id: orderId },
      data: {
        purchaseEventStatus: 'SENT',
        purchaseEventSentAt: new Date(),
        purchaseEventError: null,
      },
    });
    await db.orderEvent.create({
      data: {
        orderId,
        userId,
        type: 'PURCHASE_EVENT_SENT',
        message: `Meta Purchase event sent for ${ref} (event_id ${eventId})`,
      },
    });
  } else {
    const error =
      result.status === 'SKIPPED' ? result.reason : result.error;
    await db.order.update({
      where: { id: orderId },
      data: {
        purchaseEventStatus: result.status === 'SKIPPED' ? 'SKIPPED' : 'FAILED',
        purchaseEventError: error,
      },
    });
    await db.orderEvent.create({
      data: {
        orderId,
        userId,
        type: 'PURCHASE_EVENT_FAILED',
        message: `Meta Purchase event ${result.status.toLowerCase()}: ${error}`,
      },
    });
  }
}

/** Set a non-purchase status: NOT_BUYING, NOT_REACHABLE or CANCELLED. */
export async function setOrderStatus(orderId: string, status: string) {
  if (!['NOT_BUYING', 'NOT_REACHABLE', 'CANCELLED'].includes(status)) {
    throw new Error('Invalid status');
  }
  const { user, order } = await getAuthorizedOrder(orderId);
  if (order.status === status) return;
  await db.order.update({ where: { id: orderId }, data: { status } });
  await db.orderEvent.create({
    data: {
      orderId,
      userId: user.id,
      type: 'STATUS_CHANGED',
      message: `Status changed to ${STATUS_LABELS[status]} by ${user.name}`,
    },
  });
  refresh(orderId);
}

export async function addOrderNote(orderId: string, formData: FormData) {
  const { user } = await getAuthorizedOrder(orderId);
  const text = String(formData.get('text') || '').trim();
  if (!text) return;
  await db.orderNote.create({
    data: { orderId, userId: user.id, text: text.slice(0, 2000) },
  });
  await db.orderEvent.create({
    data: {
      orderId,
      userId: user.id,
      type: 'NOTE_ADDED',
      message: `Internal note added by ${user.name}`,
    },
  });
  refresh(orderId);
}

export async function setFollowUp(orderId: string, formData: FormData) {
  const { user } = await getAuthorizedOrder(orderId);
  const dateStr = String(formData.get('date') || '');
  const note = String(formData.get('note') || '').trim();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return;
  await db.order.update({
    where: { id: orderId },
    data: { followUpAt: date, followUpNote: note || null },
  });
  await db.orderEvent.create({
    data: {
      orderId,
      userId: user.id,
      type: 'FOLLOW_UP_SET',
      message: `Follow-up set for ${date.toLocaleDateString('en-NG')} by ${user.name}${note ? ` — ${note}` : ''}`,
    },
  });
  refresh(orderId);
}

export async function clearFollowUp(orderId: string) {
  const { user } = await getAuthorizedOrder(orderId);
  await db.order.update({
    where: { id: orderId },
    data: { followUpAt: null, followUpNote: null },
  });
  await db.orderEvent.create({
    data: {
      orderId,
      userId: user.id,
      type: 'FOLLOW_UP_CLEARED',
      message: `Follow-up completed/cleared by ${user.name}`,
    },
  });
  refresh(orderId);
}

/** Log that the order details were copied for entry into the Operations App. */
export async function logCopiedForOps(orderId: string) {
  const { user } = await getAuthorizedOrder(orderId);
  await db.orderEvent.create({
    data: {
      orderId,
      userId: user.id,
      type: 'COPIED_FOR_OPS',
      message: `Order copied for Operations App entry by ${user.name}`,
    },
  });
  refresh(orderId);
}

/** Record that a staff member viewed the order (first view per user). */
export async function logOrderViewed(orderId: string) {
  const user = await requireUser();
  const existing = await db.orderEvent.findFirst({
    where: { orderId, userId: user.id, type: 'VIEWED' },
  });
  if (existing) return;
  await db.orderEvent.create({
    data: {
      orderId,
      userId: user.id,
      type: 'VIEWED',
      message: `Order viewed by ${user.name}`,
    },
  });
}
