import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createStaff, setStaffPageAccess, toggleStaffActive } from './actions';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SUPPORT: 'Customer Support',
  CONTENT_ADMIN: 'Technical / Content Admin',
};

export default async function StaffPage() {
  const me = await requireRole('SUPER_ADMIN');
  const [staff, pages] = await Promise.all([
    db.user.findMany({
      include: { pageAccess: { select: { salesPageId: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    db.salesPage.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Staff Management</h1>

      <div className="admin-card">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-gold">Create Staff Account</h2>
        <form action={createStaff} className="grid gap-3 md:grid-cols-5">
          <input className="input" name="name" placeholder="Full name" required />
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input className="input" name="password" type="password" placeholder="Password (min 8 chars)" required minLength={8} />
          <select className="input" name="role" defaultValue="SUPPORT">
            <option value="SUPPORT">Customer Support</option>
            <option value="CONTENT_ADMIN">Technical / Content Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <button type="submit" className="btn-gold py-2.5">Create</button>
        </form>
      </div>

      <div className="space-y-4">
        {staff.map((u) => {
          const accessIds = new Set(u.pageAccess.map((a) => a.salesPageId));
          const isSupport = u.role === 'SUPPORT';
          return (
            <div key={u.id} className="admin-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">
                    {u.name}
                    {!u.active && <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Deactivated</span>}
                    {u.id === me.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </p>
                  <p className="text-sm text-gray-500">{u.email} · {ROLE_LABELS[u.role] ?? u.role}</p>
                </div>
                {u.id !== me.id && (
                  <form action={toggleStaffActive.bind(null, u.id)}>
                    <button type="submit" className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${u.active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </form>
                )}
              </div>

              {isSupport && (
                <form action={setStaffPageAccess.bind(null, u.id)} className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">
                    Sales-Page Access ({accessIds.size} of {pages.length})
                  </p>
                  {pages.length === 0 ? (
                    <p className="text-sm text-gray-500">No sales pages exist yet.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {pages.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-sm text-charcoal">
                            <input
                              type="checkbox"
                              name="pageIds"
                              value={p.id}
                              defaultChecked={accessIds.has(p.id)}
                              className="h-4 w-4 accent-gold"
                            />
                            {p.product.name}
                          </label>
                        ))}
                      </div>
                      <button type="submit" className="btn-navy mt-3 py-2 text-xs">Save Access</button>
                    </>
                  )}
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
