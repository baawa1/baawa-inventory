import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import ProductList from '@/components/inventory/ProductList';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Products - BaaWA Inventory POS',
  description:
    'Manage your product inventory, view stock levels, and track product details',
};

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - only staff and above can access inventory
  if (
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.STAFF,
    ])
  ) {
    redirect('/unauthorized');
  }

  return <ProductList user={session.user} />;
}
