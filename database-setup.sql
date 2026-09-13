-- ════════════════════════════════════════════════════════════════════
-- KANZIY SALES COMMERCE PLATFORM — DATABASE SETUP
-- Run this ONCE in Supabase → SQL Editor → New query → paste all → Run.
-- Run it on a fresh (empty) database. If you accidentally run it twice,
-- it stops with a harmless "relation already exists" error and changes
-- nothing — your data is safe.
-- ════════════════════════════════════════════════════════════════════

-- PART 1 — TABLES

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SUPPORT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPageAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salesPageId" TEXT NOT NULL,

    CONSTRAINT "StaffPageAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "price" INTEGER NOT NULL,
    "shortPitch" TEXT,
    "description" TEXT,
    "features" TEXT,
    "specifications" TEXT,
    "dimensions" TEXT,
    "materials" TEXT,
    "colors" TEXT,
    "colorVariants" TEXT,
    "deliveryInfo" TEXT,
    "installationInfo" TEXT,
    "images" TEXT,
    "videoUrl" TEXT,
    "videos" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "onHomepage" BOOLEAN NOT NULL DEFAULT false,
    "bestSeller" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'clean',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT,
    "subheadline" TEXT,
    "sellingPoints" TEXT,
    "testimonials" TEXT,
    "deliveryPhotos" TEXT,
    "deliveryVideos" TEXT,
    "faqs" TEXT,
    "ctaText" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "salesPageId" TEXT,
    "productName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalValue" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "customerNote" TEXT,
    "selectedColor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "followUpAt" TIMESTAMP(3),
    "followUpNote" TEXT,
    "trafficSource" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "fbclid" TEXT,
    "gclid" TEXT,
    "fbp" TEXT,
    "fbc" TEXT,
    "landingUrl" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "leadEventId" TEXT,
    "purchaseEventId" TEXT,
    "purchaseEventStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "purchaseEventSentAt" TIMESTAMP(3),
    "purchaseEventError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPageAccess_userId_salesPageId_key" ON "StaffPageAccess"("userId", "salesPageId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPage_productId_key" ON "SalesPage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPage_slug_key" ON "SalesPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_ref_key" ON "Order"("ref");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_salesPageId_idx" ON "Order"("salesPageId");

-- AddForeignKey
ALTER TABLE "StaffPageAccess" ADD CONSTRAINT "StaffPageAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPageAccess" ADD CONSTRAINT "StaffPageAccess_salesPageId_fkey" FOREIGN KEY ("salesPageId") REFERENCES "SalesPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPage" ADD CONSTRAINT "SalesPage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_salesPageId_fkey" FOREIGN KEY ("salesPageId") REFERENCES "SalesPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderNote" ADD CONSTRAINT "OrderNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderNote" ADD CONSTRAINT "OrderNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ════════════════════════════════════════════════════════════════════
-- PART 2 — STARTER DATA
-- Staff accounts, settings, demo products and sales pages.
-- Passwords: admin12345 / support12345 / content12345 — CHANGE AFTER LOGIN.
-- ════════════════════════════════════════════════════════════════════

-- Staff accounts
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "active") VALUES
('user-admin',   'admin@kanziy.com',   'Kanziy Admin',     '$2a$10$fIh9s1iYHBxWsLmp.a3a2eb42N1JqVfkaHWtDKT0bJxEp/Qfw7nm2', 'SUPER_ADMIN',   true),
('user-support', 'support@kanziy.com', 'Customer Support', '$2a$10$3mUGbn0RlXQ9gAb3PdZGQ.Dh8NUfa0iYFQE12XMeMgTaWtk7Rcr1C', 'SUPPORT',       true),
('user-content', 'content@kanziy.com', 'Content Admin',    '$2a$10$kI3FvLlq3kWv8Z5fyIb6c./ctkRJLiioMRfNvhkfz2bcvjck5CSLi', 'CONTENT_ADMIN', true)
ON CONFLICT ("id") DO NOTHING;

-- Site settings (update these from Admin → Settings after launch)
INSERT INTO "Setting" ("key", "value") VALUES
('phone',    '+2348000000000'),
('whatsapp', '2348000000000')
ON CONFLICT ("key") DO NOTHING;

-- Demo products (placeholder images ship with the app in /public/demo)
INSERT INTO "Product" ("id", "name", "slug", "category", "price", "shortPitch", "description", "features", "specifications", "dimensions", "materials", "colors", "deliveryInfo", "installationInfo", "images", "featured", "onHomepage", "bestSeller", "active", "seoTitle", "seoDescription", "updatedAt") VALUES
(
  'prod-executive-chair', 'Executive Office Chair', 'executive-chair', 'Office Chairs', 185000,
  'Premium executive seating for your workspace.',
  $$A commanding executive chair built for long working days. High-density moulded foam, full lumbar support and a reinforced chrome base — designed to look as good in your office as it feels.$$,
  $$["Ergonomic lumbar support","Premium PU leather finish","360° swivel with tilt-lock","Reinforced chrome base","Supports up to 150kg"]$$,
  $$[{"label":"Weight capacity","value":"150kg"},{"label":"Seat height","value":"Adjustable 45–55cm"},{"label":"Warranty","value":"12 months"}]$$,
  'H120 × W65 × D70 cm', 'PU leather, high-density foam, chrome',
  $$["Black","Brown"]$$,
  'Free nationwide delivery within 3–7 working days.', 'Free professional installation included.',
  $$["/demo/executive-chair-1.svg","/demo/executive-chair-2.svg"]$$,
  true, true, true, true,
  'Executive Office Chair — Free Delivery & Installation | Kanziy',
  'Premium executive seating for your workspace. Free delivery, free installation, pay after inspection. Order from Kanziy today.',
  CURRENT_TIMESTAMP
),
(
  'prod-executive-desk', 'Executive Desk', 'executive-desk', 'Desks', 420000,
  'A statement desk for serious work.',
  $$An expansive executive desk with integrated cable management and a premium walnut finish. Built to anchor an office that means business.$$,
  $$["Premium walnut finish","Integrated cable management","Soft-close drawers","Scratch-resistant surface"]$$,
  $$[{"label":"Surface","value":"Scratch-resistant laminate"},{"label":"Drawers","value":"3 soft-close"},{"label":"Warranty","value":"12 months"}]$$,
  'H76 × W180 × D80 cm', 'Engineered wood, walnut veneer, steel',
  $$["Walnut","Dark Oak"]$$,
  'Free nationwide delivery within 3–7 working days.', 'Free professional installation included.',
  $$["/demo/executive-desk-1.svg","/demo/executive-desk-2.svg"]$$,
  true, true, true, true,
  'Executive Desk — Free Delivery & Installation | Kanziy',
  'A statement desk for serious work. Free delivery, free installation, pay after inspection. Order from Kanziy today.',
  CURRENT_TIMESTAMP
),
(
  'prod-office-workstation', 'Office Workstation (4-Seater)', 'office-workstation', 'Workstations', 650000,
  'Modern 4-seater workstation for productive teams.',
  $$A modular 4-seater workstation with privacy screens and under-desk cable trays. Scales with your team and keeps the office looking sharp.$$,
  $$["4 individual work areas","Frosted privacy screens","Under-desk cable trays","Modular — expandable to 6 or 8 seats"]$$,
  $$[{"label":"Seats","value":"4 (expandable)"},{"label":"Per-seat surface","value":"120 × 60 cm"},{"label":"Warranty","value":"12 months"}]$$,
  'H75 × W240 × D120 cm', 'Engineered wood, powder-coated steel, acrylic',
  $$["White/Grey","Oak/White"]$$,
  'Free nationwide delivery within 3–7 working days.', 'Free professional installation included.',
  $$["/demo/workstation-1.svg","/demo/workstation-2.svg"]$$,
  true, true, true, true,
  'Office Workstation (4-Seater) — Free Delivery & Installation | Kanziy',
  'Modern 4-seater workstation for productive teams. Free delivery, free installation, pay after inspection. Order from Kanziy today.',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Published sales pages (one per product, different template each)
INSERT INTO "SalesPage" ("id", "productId", "slug", "template", "status", "subheadline", "ctaText", "sellingPoints", "testimonials", "deliveryPhotos", "faqs", "updatedAt") VALUES
(
  'page-executive-chair', 'prod-executive-chair', 'executive-chair', 'bold', 'PUBLISHED',
  'Premium executive seating for your workspace.', 'Order Now',
  $$["Ergonomic lumbar support","Premium PU leather finish","360° swivel with tilt-lock","Reinforced chrome base","Supports up to 150kg"]$$,
  $$[{"name":"Mrs Adebayo","location":"Lagos","rating":5,"text":"Excellent quality. Delivered and installed within the week — I only paid after inspecting everything."},{"name":"Engr. Musa","location":"Abuja","rating":5,"text":"The pay-after-inspection process gave me total confidence. The furniture speaks for itself."},{"name":"Chinedu O.","location":"Port Harcourt","rating":4,"text":"Professional installation team and genuinely premium finishing."}]$$,
  $$["/demo/delivery-1.svg","/demo/delivery-2.svg","/demo/delivery-3.svg"]$$,
  $$[{"q":"Do you deliver to my state?","a":"Yes — Kanziy delivers nationwide across Nigeria."},{"q":"Is delivery free?","a":"Yes, delivery is completely free."},{"q":"Is installation free?","a":"Yes, our team installs your furniture free of charge."},{"q":"When do I pay?","a":"You pay only after delivery, installation and your inspection."},{"q":"Can I order multiple quantities?","a":"Absolutely — set the quantity you need on the order form or tell our support team."},{"q":"How do I confirm availability?","a":"Our Customer Support team confirms availability when they call to confirm your order."}]$$,
  CURRENT_TIMESTAMP
),
(
  'page-executive-desk', 'prod-executive-desk', 'executive-desk', 'editorial', 'PUBLISHED',
  'A statement desk for serious work.', 'Order Now',
  $$["Premium walnut finish","Integrated cable management","Soft-close drawers","Scratch-resistant surface"]$$,
  $$[{"name":"Mrs Adebayo","location":"Lagos","rating":5,"text":"Excellent quality. Delivered and installed within the week — I only paid after inspecting everything."},{"name":"Engr. Musa","location":"Abuja","rating":5,"text":"The pay-after-inspection process gave me total confidence. The furniture speaks for itself."},{"name":"Chinedu O.","location":"Port Harcourt","rating":4,"text":"Professional installation team and genuinely premium finishing."}]$$,
  $$["/demo/delivery-1.svg","/demo/delivery-2.svg","/demo/delivery-3.svg"]$$,
  $$[{"q":"Do you deliver to my state?","a":"Yes — Kanziy delivers nationwide across Nigeria."},{"q":"Is delivery free?","a":"Yes, delivery is completely free."},{"q":"Is installation free?","a":"Yes, our team installs your furniture free of charge."},{"q":"When do I pay?","a":"You pay only after delivery, installation and your inspection."},{"q":"Can I order multiple quantities?","a":"Absolutely — set the quantity you need on the order form or tell our support team."},{"q":"How do I confirm availability?","a":"Our Customer Support team confirms availability when they call to confirm your order."}]$$,
  CURRENT_TIMESTAMP
),
(
  'page-office-workstation', 'prod-office-workstation', 'office-workstation', 'clean', 'PUBLISHED',
  'Modern 4-seater workstation for productive teams.', 'Order Now',
  $$["4 individual work areas","Frosted privacy screens","Under-desk cable trays","Modular — expandable to 6 or 8 seats"]$$,
  $$[{"name":"Mrs Adebayo","location":"Lagos","rating":5,"text":"Excellent quality. Delivered and installed within the week — I only paid after inspecting everything."},{"name":"Engr. Musa","location":"Abuja","rating":5,"text":"The pay-after-inspection process gave me total confidence. The furniture speaks for itself."},{"name":"Chinedu O.","location":"Port Harcourt","rating":4,"text":"Professional installation team and genuinely premium finishing."}]$$,
  $$["/demo/delivery-1.svg","/demo/delivery-2.svg","/demo/delivery-3.svg"]$$,
  $$[{"q":"Do you deliver to my state?","a":"Yes — Kanziy delivers nationwide across Nigeria."},{"q":"Is delivery free?","a":"Yes, delivery is completely free."},{"q":"Is installation free?","a":"Yes, our team installs your furniture free of charge."},{"q":"When do I pay?","a":"You pay only after delivery, installation and your inspection."},{"q":"Can I order multiple quantities?","a":"Absolutely — set the quantity you need on the order form or tell our support team."},{"q":"How do I confirm availability?","a":"Our Customer Support team confirms availability when they call to confirm your order."}]$$,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Give the Customer Support account access to all three sales pages
INSERT INTO "StaffPageAccess" ("id", "userId", "salesPageId") VALUES
('access-support-chair',       'user-support', 'page-executive-chair'),
('access-support-desk',        'user-support', 'page-executive-desk'),
('access-support-workstation', 'user-support', 'page-office-workstation')
ON CONFLICT ("id") DO NOTHING;


-- ════════════════════════════════════════════════════════════════════
-- PART 3 — MEDIA STORAGE BUCKET (for direct image/video uploads)
-- ════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'media', 'media', true, 209715200,
      ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
    )
    ON CONFLICT (id) DO UPDATE
      SET public = true,
          file_size_limit = EXCLUDED.file_size_limit,
          allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
