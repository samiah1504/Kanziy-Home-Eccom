// Meta Conversions API (server-side events).
//
// Browser Pixel events fire from <MetaPixel/> with an eventID; the matching
// server event is sent here with the same event_id so Meta deduplicates the
// pair. Purchase has no browser counterpart — it fires server-side only, when
// Customer Support confirms an order (see confirmOrder in order actions),
// guarded so it can never be sent twice for the same order.

import { createHash, randomUUID } from 'crypto';
import { getSettings } from './settings';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

export type CapiUserData = {
  phone?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type CapiResult =
  | { status: 'SENT' }
  | { status: 'SKIPPED'; reason: string }
  | { status: 'FAILED'; error: string };

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

/** Normalize a Nigerian phone number to E.164 digits before hashing. */
function normalizePhone(phone: string) {
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = '234' + digits.slice(1);
  return digits;
}

export function newEventId() {
  return randomUUID();
}

export async function sendMetaEvent(params: {
  eventName: 'ViewContent' | 'Lead' | 'Purchase';
  eventId: string;
  eventSourceUrl?: string | null;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  userData?: CapiUserData;
}): Promise<CapiResult> {
  const settings = await getSettings();
  if (!settings.metaPixelId || !settings.metaCapiToken) {
    return {
      status: 'SKIPPED',
      reason: 'Meta Pixel ID / CAPI token not configured',
    };
  }

  const u = params.userData ?? {};
  const user_data: Record<string, unknown> = {};
  if (u.phone) user_data.ph = [sha256(normalizePhone(u.phone))];
  if (u.ip) user_data.client_ip_address = u.ip;
  if (u.userAgent) user_data.client_user_agent = u.userAgent;
  if (u.fbp) user_data.fbp = u.fbp;
  if (u.fbc) user_data.fbc = u.fbc;

  const event: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: 'website',
    user_data,
  };
  if (params.eventSourceUrl) event.event_source_url = params.eventSourceUrl;

  const custom_data: Record<string, unknown> = {};
  if (params.value !== undefined) custom_data.value = params.value;
  custom_data.currency = params.currency ?? 'NGN';
  if (params.contentIds) {
    custom_data.content_ids = params.contentIds;
    custom_data.content_type = 'product';
  }
  if (params.contentName) custom_data.content_name = params.contentName;
  event.custom_data = custom_data;

  const body: Record<string, unknown> = { data: [event] };
  if (settings.metaTestEventCode) {
    body.test_event_code = settings.metaTestEventCode;
  }

  try {
    const res = await fetch(
      `${GRAPH_URL}/${settings.metaPixelId}/events?access_token=${encodeURIComponent(settings.metaCapiToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        status: 'FAILED',
        error: `Meta API ${res.status}: ${text.slice(0, 500)}`,
      };
    }
    return { status: 'SENT' };
  } catch (err) {
    return { status: 'FAILED', error: String(err).slice(0, 500) };
  }
}
