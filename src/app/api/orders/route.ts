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
    colorSelections,
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

  // Quantity is required. Customers who pick several colours send a quantity
  // per colour; the order stores the combined quantity and a readable colour
  // summary, e.g. "Black (2), Brown (1)". Visitors still on the previous
  // version of the page send a single selectedColor + quantity instead.
  const toQty = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
    return Number.isInteger(n) && n >= 1 ? n : null;
  };

  let qty: number | null;
  let colorSummary: string | undefined;
  if (Array.isArray(colorSelections) && colorSelections.length > 0) {
    const merged = new Map<string, number>();
    for (const c of colorSelections.slice(0, 50)) {
      const name = typeof c?.name === 'string' ? c.name.trim().slice(0, 100) : '';
      const q = toQty(c?.quantity);
      if (!name || q === null) {
        return NextResponse.json(
          { ok: false, error: 'Please enter the quantity you want for each colour you selected.' },
          { status: 400 }
        );
      }
      merged.set(name, (merged.get(name) ?? 0) + q);
    }
    const entries = Array.from(merged.entries());
    qty = entries.reduce((sum, [, q]) => sum + q, 0);
    colorSummary =
      entries.length === 1
        ? entries[0][0]
        : entries.map(([name, q]) => `${name} (${q})`).join(', ');
  } else {
    qty = toQty(quantity);
    colorSummary =
      typeof selectedColor === 'string' && selectedColor.trim()
        ? selectedColor.trim().slice(0, 100)
        : undefined;
  }
  if (qty === null) {
    return NextResponse.json(
      { ok: false, error: 'Please enter the quantity you want.' },
      { status: 400 }
    );
  }
  if (qty > 100) {
    return NextResponse.json(
      { ok: false, error: 'The maximum is 100 items per order. Please call or WhatsApp us for larger orders.' },
      { status: 400 }
    );
  }
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
          selectedColor: colorSummary,
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
        message: `Meta Lead event sent (${leadResult.detail})`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    ref: order.ref,
    leadEventId,
  });
}
