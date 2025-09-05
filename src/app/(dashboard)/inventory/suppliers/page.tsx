import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import MobileSupplierList from '@/components/inventory/MobileSupplierList';

export const metadata = {
  title: 'Suppliers Management | BaaWA Inventory',
  description: 'Manage suppliers and vendor information',
};

export default async function SuppliersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to read supplier details (Admin only)
  if (!hasPermission(session.user.role, 'SUPPLIER_READ')) {
    redirect('/unauthorized');
  }

  return <MobileSupplierList user={session.user} />;
}
