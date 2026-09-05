import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { updateSettings } from './actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole('SUPER_ADMIN');
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-navy">Settings</h1>

      <form action={updateSettings} className="space-y-5">
        <div className="admin-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Customer Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Phone Number</label>
              <input className="input" name="phone" defaultValue={settings.phone} placeholder="+234 801 234 5678" />
              <p className="mt-1 text-xs text-gray-400">Used for click-to-call across the site.</p>
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <input className="input" name="whatsapp" defaultValue={settings.whatsapp} placeholder="2348012345678" />
              <p className="mt-1 text-xs text-gray-400">International format, digits only.</p>
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gold">Meta Tracking</h2>
          <div>
            <label className="label">Meta Pixel ID</label>
            <input className="input" name="metaPixelId" defaultValue={settings.metaPixelId} />
          </div>
          <div>
            <label className="label">Conversions API Access Token</label>
            <input className="input" name="metaCapiToken" type="password" defaultValue={settings.metaCapiToken} />
            <p className="mt-1 text-xs text-gray-400">
              Server-side events (Lead, Purchase, ViewContent) are sent with event IDs for deduplication.
            </p>
          </div>
          <div>
            <label className="label">Test Event Code (optional)</label>
            <input className="input" name="metaTestEventCode" defaultValue={settings.metaTestEventCode} />
            <p className="mt-1 text-xs text-gray-400">Set while testing in Meta Events Manager; clear for live traffic.</p>
          </div>
        </div>

        <button type="submit" className="btn-gold">Save Settings</button>
      </form>
    </div>
  );
}
