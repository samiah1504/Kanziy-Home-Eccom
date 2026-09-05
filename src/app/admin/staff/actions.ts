'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const ROLES = ['SUPER_ADMIN', 'SUPPORT', 'CONTENT_ADMIN'];

export async function createStaff(formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const role = String(formData.get('role') || 'SUPPORT');
  if (!name || !email || password.length < 8 || !ROLES.includes(role)) {
    throw new Error('Name, email, role and a password of at least 8 characters are required');
  }
  await db.user.create({
    data: { name, email, role, passwordHash: bcrypt.hashSync(password, 10) },
  });
  revalidatePath('/admin/staff');
}

export async function toggleStaffActive(userId: string) {
  const admin = await requireRole('SUPER_ADMIN');
  if (admin.id === userId) throw new Error('You cannot deactivate your own account');
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await db.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });
  revalidatePath('/admin/staff');
}

/** Replace a staff member's sales-page access with the submitted set. */
export async function setStaffPageAccess(userId: string, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const pageIds = formData.getAll('pageIds').map(String);
  await db.$transaction([
    db.staffPageAccess.deleteMany({ where: { userId } }),
    ...(pageIds.length
      ? [
          db.staffPageAccess.createMany({
            data: pageIds.map((salesPageId) => ({ userId, salesPageId })),
          }),
        ]
      : []),
  ]);
  revalidatePath('/admin/staff');
}
