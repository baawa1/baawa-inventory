import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth-rbac';
import { UserRole } from '@/types/user';
import SupplierList from '@/components/inventory/SupplierList';

export const metadata = {
  title: 'Suppliers Management | BaaWA Inventory',
  description: 'Manage suppliers and vendor information',
};

export default async function SuppliersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to manage suppliers (inventory:write includes supplier management)
  if (!hasPermission(session.user.role as UserRole, 'inventory:write')) {
    redirect('/unauthorized');
  }

  return <SupplierList user={session.user} />;
}
