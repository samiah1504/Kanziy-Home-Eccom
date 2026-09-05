// First line of defence for /admin: requires a validly signed session cookie.
// Role checks and data scoping happen server-side in layouts, pages and
// actions (middleware cannot reach the DB on the edge runtime).

import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'kanziy_session';

async function verify(token: string | undefined, secret: string) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [userId, expires, sig] = parts;
  if (Number(expires) < Date.now()) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${userId}.${expires}`)
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === sig;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret =
    process.env.AUTH_SECRET || 'dev-only-secret-do-not-use-in-production';
  if (!(await verify(token, secret))) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
