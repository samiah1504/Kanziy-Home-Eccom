import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newEventId, sendMetaEvent } from '@/lib/meta';
import { deriveTrafficSource, generateOrderRef } from '@/lib/utils';

export const runtime = 'nodejs';

// Public order submission. Creates the order (a lead), records the activity
// timeline, and fires the Meta Lead event. Purchase is NOT fired here — it
// only fires when Customer Support confirms the order.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const {
    salesPageId,
    customerName,
    phone,
    whatsapp,
    address,
    state,
    city,
    quantity,
    customerNote,
    selectedColor,
    attribution = {},
  } = body ?? {};

  if (
    typeof salesPageId !== 'string' ||
    typeof customerName !== 'string' ||
    !customerName.trim() ||
    typeof phone !== 'string' ||
    !phone.trim() ||
    typeof address !== 'string' ||
    !address.trim() ||
    typeof state !== 'string' ||
    !state.trim()
  ) {
    return NextResponse.json(
      { ok: false, error: 'Please fill in all required fields.' },
      { status: 400 }
    );
  }

  const page = await db.salesPage.findUnique({
    where: { id: salesPageId },
    include: { product: true },
  });
  if (!page || page.status !== 'PUBLISHED' || !page.product.active) {
    return NextResponse.json(
      { ok: false, error: 'This product is not available right now.' },
      { status: 404 }
    );
  }

  const qty = Math.min(Math.max(parseInt(String(quantity), 10) || 1, 1), 100);
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  const str = (v: unknown) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, 500) : undefined;

  const attr = {
    utmSource: str(attribution.utmSource),
    utmMedium: str(attribution.utmMedium),
    utmCampaign: str(attribution.utmCampaign),
    utmContent: str(attribution.utmContent),
    utmTerm: str(attribution.utmTerm),
    fbclid: str(attribution.fbclid),
    gclid: str(attribution.gclid),
    fbp: str(attribution.fbp),
    fbc: str(attribution.fbc),
    landingUrl: str(attribution.landingUrl),
    referrer: str(attribution.referrer),
  };

  const leadEventId = newEventId();

  // Retry ref generation on the (rare) unique collision.
  let order = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await db.order.create({
        data: {
          ref: generateOrderRef(),
          productId: page.productId,
          salesPageId: page.id,
          productName: page.product.name,
          unitPrice: page.product.price,
          quantity: qty,
          totalValue: page.product.price * qty,
          customerName: customerName.trim().slice(0, 200),
          phone: phone.trim().slice(0, 50),
          whatsapp: str(whatsapp),
          address: address.trim().slice(0, 500),
          state: state.trim().slice(0, 100),
          city: str(city),
          customerNote: str(customerNote),
          selectedColor:
            typeof selectedColor === 'string' && selectedColor.trim()
              ? selectedColor.trim().slice(0, 100)
              : undefined,
          trafficSource: deriveTrafficSource({ ...attr }),
          ...attr,
          userAgent,
          ip,
          leadEventId,
        },
      });
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
    }
  }
  if (!order) {
    return NextResponse.json(
      { ok: false, error: 'Could not create your order. Please try again.' },
      { status: 500 }
    );
  }

  await db.orderEvent.create({
    data: {
      orderId: order.id,
      type: 'SUBMITTED',
      message: `Order submitted from sales page (${page.slug})`,
    },
  });

  const leadResult = await sendMetaEvent({
    eventName: 'Lead',
    eventId: leadEventId,
    eventSourceUrl: attr.landingUrl,
    value: order.totalValue,
    contentIds: [page.product.slug],
    contentName: page.product.name,
    userData: {
      phone: order.phone,
      ip,
      userAgent,
      fbp: attr.fbp,
      fbc: attr.fbc,
    },
  });
  if (leadResult.status === 'SENT') {
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'LEAD_EVENT_SENT',
        message: 'Meta Lead event sent',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    ref: order.ref,
    leadEventId,
  });
}
