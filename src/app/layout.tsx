import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kanziy.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kanziy — Spaces That Work for You.',
    template: '%s | Kanziy',
  },
  description:
    'Premium furniture for homes and offices. Free delivery, free installation, pay after inspection, nationwide delivery.',
  openGraph: {
    siteName: 'Kanziy',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
