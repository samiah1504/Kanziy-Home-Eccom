'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: 'Invalid email or password.' };
  }

  cookies().set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect('/admin');
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect('/login');
}
