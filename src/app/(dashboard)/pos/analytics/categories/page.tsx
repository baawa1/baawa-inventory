import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CategoryPerformance } from '@/components/pos/CategoryPerformance';
import { ALL_ROLES, UserRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Category Performance - BaaWA Inventory POS',
  description: 'Analyze category performance and sales metrics',
};

export default async function CategoryPerformancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - all authenticated users can access category performance
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <CategoryPerformance user={session.user} />;
}
