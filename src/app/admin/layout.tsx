import Link from 'next/link';
import Image from 'next/image';
import { requireUser, canManageContent, isAdmin } from '@/lib/auth';
import { logout } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const role = user.role;

  const nav = [
    { href: '/admin', label: 'Dashboard', show: true },
    { href: '/admin/orders', label: 'Orders', show: true },
    { href: '/admin/products', label: 'Products', show: canManageContent(role) },
    { href: '/admin/pages', label: 'Sales Pages', show: canManageContent(role) },
    { href: '/admin/analytics', label: 'Analytics', show: isAdmin(role) },
    { href: '/admin/staff', label: 'Staff', show: isAdmin(role) },
    { href: '/admin/settings', label: 'Settings', show: isAdmin(role) },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Kanziy" width={32} height={32} className="rounded bg-white p-0.5" />
            <span className="font-extrabold tracking-wide">KANZIY ADMIN</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-white/70 sm:inline">
              {user.name} · {role.replace('_', ' ')}
            </span>
            <form action={logout}>
              <button type="submit" className="rounded-md border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10">
                Sign Out
              </button>
            </form>
          </div>
        </div>
        <nav className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-white/80 hover:border-b-2 hover:border-gold hover:text-white"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
