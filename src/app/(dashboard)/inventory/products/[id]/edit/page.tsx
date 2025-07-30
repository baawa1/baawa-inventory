import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import EditProductForm from '@/components/inventory/EditProductForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await auth();

  // Only admins, managers, and staffs can edit products
  if (!['ADMIN', 'MANAGER', 'STAFF'].includes(session?.user.role || '')) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    redirect('/inventory/products');
  }

  return <EditProductForm productId={productId} />;
}
