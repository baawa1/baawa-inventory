import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import AddSupplierForm from '@/components/inventory/AddSupplierForm';

export const metadata = {
  title: 'Add Supplier | BaaWA Inventory',
  description: 'Add a new supplier to your inventory system',
};

export default async function AddSupplierPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to create suppliers (Admin only)
  if (!hasPermission(session.user.role, 'SUPPLIER_WRITE')) {
    redirect('/unauthorized');
  }

  return <AddSupplierForm />;
}
