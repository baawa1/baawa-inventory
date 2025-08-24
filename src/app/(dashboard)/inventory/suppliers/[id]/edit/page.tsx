import { Metadata } from 'next';
import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import EditSupplierForm from '@/components/inventory/EditSupplierForm';

export const metadata: Metadata = {
  title: 'Edit Supplier | BaaWA Inventory Manager',
  description: 'Edit supplier information in your inventory system',
};

interface EditSupplierPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to edit suppliers (Admin only)
  if (!hasPermission(session.user.role, 'SUPPLIER_WRITE')) {
    redirect('/unauthorized');
  }

  const { id } = await params;

  return <EditSupplierForm supplierId={parseInt(id)} />;
}
