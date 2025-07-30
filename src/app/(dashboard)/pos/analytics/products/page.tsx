import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { ProductPerformance } from '@/components/pos/ProductPerformance';
import { ALL_ROLES, UserRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Product Performance - BaaWA Inventory POS',
  description: 'Analyze product performance and sales metrics',
};

export default async function ProductPerformancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - all authenticated users can access product performance
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <ProductPerformance user={session.user} />;
}
