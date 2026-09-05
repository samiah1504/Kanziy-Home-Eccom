import Link from 'next/link';
import Image from 'next/image';
import { whatsappLink } from '@/lib/settings';

export default function SiteHeader({
  phone,
  whatsapp,
}: {
  phone?: string;
  whatsapp?: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Kanziy" width={40} height={40} className="rounded bg-white p-0.5" />
          <div>
            <span className="block text-lg font-extrabold tracking-wide text-white">KANZIY</span>
            <span className="hidden text-[10px] tracking-widest text-gold-soft sm:block">SPACES THAT WORK FOR YOU.</span>
          </div>
        </Link>
        <nav className="flex items-center gap-3">
          {phone && (
            <a href={`tel:${phone}`} className="hidden text-sm font-medium text-white hover:text-gold sm:block">
              {phone}
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, 'Hello Kanziy, I would like to make an enquiry.')}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-bright"
            >
              WhatsApp
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
