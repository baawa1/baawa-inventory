import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import ProductList from '@/components/inventory/ProductList';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { USER_ROLES, hasPermission, hasRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Manage Products - BaaWA Inventory POS',
  description:
    'Advanced product management with bulk operations, search, and export capabilities',
};

export default async function ManageProductsPage() {
  const session = await auth();

  // Check role permissions - only staff and above can access inventory
  if (
    !session?.user ||
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.STAFF,
    ])
  ) {
    redirect('/unauthorized');
  }

  const canManageProducts = hasPermission(session.user.role, 'INVENTORY_WRITE');

  return (
    <DashboardPageLayout
      title="Product Management"
      description="Advanced inventory management with bulk operations and analytics"
      actions={
        canManageProducts ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory/products/add">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        ) : undefined
      }
    >
      <ProductList user={session.user} />
    </DashboardPageLayout>
  );
}
