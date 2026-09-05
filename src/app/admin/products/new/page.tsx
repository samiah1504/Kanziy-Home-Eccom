import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import ProductForm from '../ProductForm';
import { createProduct } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gold">← Products</Link>
      <h1 className="text-2xl font-bold text-navy">New Product</h1>
      <ProductForm action={createProduct} submitLabel="Create Product" />
    </div>
  );
}
