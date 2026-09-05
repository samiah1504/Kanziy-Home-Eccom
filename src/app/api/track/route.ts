import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendMetaEvent } from '@/lib/meta';

export const runtime = 'nodejs';

// Records a sales-page view and mirrors ViewContent to the Conversions API
// with the browser event's eventID for deduplication.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salesPageId, slug, eventId, url } = body ?? {};
    if (typeof salesPageId !== 'string' || typeof eventId !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const page = await db.salesPage.findUnique({
      where: { id: salesPageId },
      include: { product: true },
    });
    if (!page) return NextResponse.json({ ok: false }, { status: 404 });

    await db.salesPage.update({
      where: { id: page.id },
      data: { views: { increment: 1 } },
    });

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;

    await sendMetaEvent({
      eventName: 'ViewContent',
      eventId,
      eventSourceUrl: typeof url === 'string' ? url : `/products/${slug}`,
      value: page.product.price,
      contentIds: [page.product.slug],
      contentName: page.product.name,
      userData: {
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
