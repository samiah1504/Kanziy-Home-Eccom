// Client-side attribution capture.
//
// On landing we persist UTM/click IDs in sessionStorage so they survive
// navigation to the order form and are attached to the resulting order.

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  fbp?: string;
  fbc?: string;
  landingUrl?: string;
  referrer?: string;
};

const KEY = 'kanziy_attribution';

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const existing: Attribution = JSON.parse(
      sessionStorage.getItem(KEY) || '{}'
    );
    const next: Attribution = {
      ...existing,
      utmSource: params.get('utm_source') || existing.utmSource,
      utmMedium: params.get('utm_medium') || existing.utmMedium,
      utmCampaign: params.get('utm_campaign') || existing.utmCampaign,
      utmContent: params.get('utm_content') || existing.utmContent,
      utmTerm: params.get('utm_term') || existing.utmTerm,
      fbclid: params.get('fbclid') || existing.fbclid,
      gclid: params.get('gclid') || existing.gclid,
      landingUrl: existing.landingUrl || window.location.href,
      referrer: existing.referrer || document.referrer || undefined,
    };
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — attribution is best-effort
  }
}

export function getAttribution(): Attribution {
  let stored: Attribution = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    // ignore
  }
  // _fbp/_fbc cookies are set by the Meta Pixel — read live at submit time.
  try {
    stored.fbp = readCookie('_fbp') || stored.fbp;
    stored.fbc = readCookie('_fbc') || stored.fbc;
    if (!stored.fbc && stored.fbclid) {
      stored.fbc = `fb.1.${Date.now()}.${stored.fbclid}`;
    }
  } catch {
    // ignore
  }
  return stored;
}
