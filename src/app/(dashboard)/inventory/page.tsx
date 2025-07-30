import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { USER_ROLES } from '@/lib/auth/roles';

export default async function InventoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  // Check if user has inventory access permissions
  const hasInventoryAccess = [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ].includes(session.user.role as keyof typeof USER_ROLES);

  if (!hasInventoryAccess) {
    redirect('/unauthorized');
  }

  return (
    <DashboardPageLayout
      title="Inventory Management"
      description="Manage your products, stock levels, and inventory operations"
    >
      <Suspense fallback={<div>Loading inventory...</div>}>
        <InventoryDashboard user={session.user} />
      </Suspense>
    </DashboardPageLayout>
  );
}
