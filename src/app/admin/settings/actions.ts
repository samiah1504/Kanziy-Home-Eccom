'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { saveSettings } from '@/lib/settings';

export async function updateSettings(formData: FormData) {
  await requireRole('SUPER_ADMIN');
  await saveSettings({
    phone: String(formData.get('phone') || '').trim(),
    whatsapp: String(formData.get('whatsapp') || '').trim(),
    metaPixelId: String(formData.get('metaPixelId') || '').trim(),
    metaCapiToken: String(formData.get('metaCapiToken') || '').trim(),
    metaTestEventCode: String(formData.get('metaTestEventCode') || '').trim(),
  });
  revalidatePath('/');
  revalidatePath('/admin/settings');
}
