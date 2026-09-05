import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xl font-extrabold tracking-wide">KANZIY</p>
          <p className="text-sm text-gold-soft">Spaces That Work for You.</p>
          <p className="max-w-md text-xs text-white/60">
            Free Delivery • Free Installation • Pay After Inspection • Nationwide Delivery
          </p>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Kanziy Home & Interiors. All rights reserved.
            {' · '}
            <Link href="/login" className="hover:text-white/70">Staff Login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
