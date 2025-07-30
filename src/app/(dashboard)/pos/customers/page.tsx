import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CustomerAnalytics } from '@/components/pos/CustomerAnalytics';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { ALL_ROLES, UserRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Customer Analytics - BaaWA Inventory POS',
  description: 'Comprehensive customer insights and analytics',
};

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - all authenticated users can access customers
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <CustomerAnalytics user={session.user} />;
}
