// Seeds the initial Super Admin account, default settings and sample
// products/sales pages so the platform is explorable immediately.
//
// Run with: npm run db:seed
// IMPORTANT: change the seeded passwords before going live.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

// Demo placeholder images shipped with the repo — replace with real Kanziy
// product photography from the admin (Products → Image URLs).
const img = (name: string) => `/demo/${name}.svg`;

const SHARED_FAQS = JSON.stringify([
  { q: 'Do you deliver to my state?', a: 'Yes — Kanziy delivers nationwide across Nigeria.' },
  { q: 'Is delivery free?', a: 'Yes, delivery is completely free.' },
  { q: 'Is installation free?', a: 'Yes, our team installs your furniture free of charge.' },
  { q: 'When do I pay?', a: 'You pay only after delivery, installation and your inspection.' },
  { q: 'Can I order multiple quantities?', a: 'Absolutely — set the quantity you need on the order form or tell our support team.' },
  { q: 'How do I confirm availability?', a: 'Our Customer Support team confirms availability when they call to confirm your order.' },
]);

const TESTIMONIALS = JSON.stringify([
  { name: 'Mrs Adebayo', location: 'Lagos', rating: 5, text: 'Excellent quality. Delivered and installed within the week — I only paid after inspecting everything.' },
  { name: 'Engr. Musa', location: 'Abuja', rating: 5, text: 'The pay-after-inspection process gave me total confidence. The furniture speaks for itself.' },
  { name: 'Chinedu O.', location: 'Port Harcourt', rating: 4, text: 'Professional installation team and genuinely premium finishing.' },
]);

async function main() {
  // ── Staff ──
  const password = (p: string) => bcrypt.hashSync(p, 10);
  await db.user.upsert({
    where: { email: 'admin@kanziy.com' },
    update: {},
    create: {
      email: 'admin@kanziy.com',
      name: 'Kanziy Admin',
      role: 'SUPER_ADMIN',
      passwordHash: password('admin12345'),
    },
  });
  const support = await db.user.upsert({
    where: { email: 'support@kanziy.com' },
    update: {},
    create: {
      email: 'support@kanziy.com',
      name: 'Customer Support',
      role: 'SUPPORT',
      passwordHash: password('support12345'),
    },
  });
  await db.user.upsert({
    where: { email: 'content@kanziy.com' },
    update: {},
    create: {
      email: 'content@kanziy.com',
      name: 'Content Admin',
      role: 'CONTENT_ADMIN',
      passwordHash: password('content12345'),
    },
  });

  // ── Settings ──
  for (const [key, value] of Object.entries({
    phone: '+2348000000000',
    whatsapp: '2348000000000',
  })) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // ── Products + sales pages ──
  const products = [
    {
      name: 'Executive Office Chair',
      slug: 'executive-chair',
      category: 'Office Chairs',
      price: 185000,
      shortPitch: 'Premium executive seating for your workspace.',
      description:
        'A commanding executive chair built for long working days. High-density moulded foam, full lumbar support and a reinforced chrome base — designed to look as good in your office as it feels.',
      features: ['Ergonomic lumbar support', 'Premium PU leather finish', '360° swivel with tilt-lock', 'Reinforced chrome base', 'Supports up to 150kg'],
      specifications: [
        { label: 'Weight capacity', value: '150kg' },
        { label: 'Seat height', value: 'Adjustable 45–55cm' },
        { label: 'Warranty', value: '12 months' },
      ],
      dimensions: 'H120 × W65 × D70 cm',
      materials: 'PU leather, high-density foam, chrome',
      colors: ['Black', 'Brown'],
      template: 'bold',
      images: [img('executive-chair-1'), img('executive-chair-2')],
    },
    {
      name: 'Executive Desk',
      slug: 'executive-desk',
      category: 'Desks',
      price: 420000,
      shortPitch: 'A statement desk for serious work.',
      description:
        'An expansive executive desk with integrated cable management and a premium walnut finish. Built to anchor an office that means business.',
      features: ['Premium walnut finish', 'Integrated cable management', 'Soft-close drawers', 'Scratch-resistant surface'],
      specifications: [
        { label: 'Surface', value: 'Scratch-resistant laminate' },
        { label: 'Drawers', value: '3 soft-close' },
        { label: 'Warranty', value: '12 months' },
      ],
      dimensions: 'H76 × W180 × D80 cm',
      materials: 'Engineered wood, walnut veneer, steel',
      colors: ['Walnut', 'Dark Oak'],
      template: 'editorial',
      images: [img('executive-desk-1'), img('executive-desk-2')],
    },
    {
      name: 'Office Workstation (4-Seater)',
      slug: 'office-workstation',
      category: 'Workstations',
      price: 650000,
      shortPitch: 'Modern 4-seater workstation for productive teams.',
      description:
        'A modular 4-seater workstation with privacy screens and under-desk cable trays. Scales with your team and keeps the office looking sharp.',
      features: ['4 individual work areas', 'Frosted privacy screens', 'Under-desk cable trays', 'Modular — expandable to 6 or 8 seats'],
      specifications: [
        { label: 'Seats', value: '4 (expandable)' },
        { label: 'Per-seat surface', value: '120 × 60 cm' },
        { label: 'Warranty', value: '12 months' },
      ],
      dimensions: 'H75 × W240 × D120 cm',
      materials: 'Engineered wood, powder-coated steel, acrylic',
      colors: ['White/Grey', 'Oak/White'],
      template: 'clean',
      images: [img('workstation-1'), img('workstation-2')],
    },
  ];

  for (const p of products) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        category: p.category,
        price: p.price,
        shortPitch: p.shortPitch,
        description: p.description,
        features: JSON.stringify(p.features),
        specifications: JSON.stringify(p.specifications),
        dimensions: p.dimensions,
        materials: p.materials,
        colors: JSON.stringify(p.colors),
        deliveryInfo: 'Free nationwide delivery within 3–7 working days.',
        installationInfo: 'Free professional installation included.',
        images: JSON.stringify(p.images),
        featured: true,
        onHomepage: true,
        bestSeller: true,
        active: true,
        seoTitle: `${p.name} — Free Delivery & Installation | Kanziy`,
        seoDescription: `${p.shortPitch} Free delivery, free installation, pay after inspection. Order from Kanziy today.`,
      },
    });
    const page = await db.salesPage.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        slug: p.slug,
        template: p.template,
        status: 'PUBLISHED',
        subheadline: p.shortPitch,
        ctaText: 'Order Now',
        sellingPoints: JSON.stringify(p.features),
        testimonials: TESTIMONIALS,
        deliveryPhotos: JSON.stringify([img('delivery-1'), img('delivery-2'), img('delivery-3')]),
        faqs: SHARED_FAQS,
      },
    });
    // Give the seeded support account access to every seeded page.
    await db.staffPageAccess.upsert({
      where: { userId_salesPageId: { userId: support.id, salesPageId: page.id } },
      update: {},
      create: { userId: support.id, salesPageId: page.id },
    });
  }

  console.log('Seed complete.');
  console.log('Logins: admin@kanziy.com / admin12345 · support@kanziy.com / support12345 · content@kanziy.com / content12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
