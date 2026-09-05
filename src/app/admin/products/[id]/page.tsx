import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import ProductForm from '../ProductForm';
import { updateProduct } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { salesPage: { select: { id: true, status: true, slug: true } } },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gold">← Products</Link>
          <h1 className="text-2xl font-bold text-navy">{product.name}</h1>
        </div>
        {product.salesPage && (
          <Link href={`/admin/pages/${product.salesPage.id}`} className="btn-navy">
            Edit Sales Page ({product.salesPage.status})
          </Link>
        )}
      </div>
      <ProductForm
        product={product}
        action={updateProduct.bind(null, product.id)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
