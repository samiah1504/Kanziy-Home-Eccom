// Session + role-based authorization.
//
// Sessions are HMAC-signed cookies (userId.expiry.signature) verified
// server-side on every request — no client-trusted state. All admin server
// actions and pages call requireUser()/requireRole(), so permissions cannot
// be bypassed by manipulating URLs.

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { redirect } from 'next/navigation';
import { db } from './db';

export type Role = 'SUPER_ADMIN' | 'SUPPORT' | 'CONTENT_ADMIN';

export const SESSION_COOKIE = 'kanziy_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.AUTH_SECRET || 'dev-only-secret-do-not-use-in-production';
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createSessionToken(userId: string) {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expires, sig] = parts;
  const expected = sign(`${userId}.${expires}`);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  if (Number(expires) < Date.now()) return null;
  return userId;
}

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return null;
  return user;
}

/** Redirects to /login when unauthenticated. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** Redirects to /admin when the user lacks one of the allowed roles. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) redirect('/admin');
  return user;
}

export function isAdmin(role: string) {
  return role === 'SUPER_ADMIN';
}

export function canManageContent(role: string) {
  return role === 'SUPER_ADMIN' || role === 'CONTENT_ADMIN';
}

/** Sales-page IDs a user may see orders for; null = all pages (admins). */
export async function accessibleSalesPageIds(user: {
  id: string;
  role: string;
}): Promise<string[] | null> {
  if (user.role === 'SUPER_ADMIN' || user.role === 'CONTENT_ADMIN') return null;
  const access = await db.staffPageAccess.findMany({
    where: { userId: user.id },
    select: { salesPageId: true },
  });
  return access.map((a) => a.salesPageId);
}
