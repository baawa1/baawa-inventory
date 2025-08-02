import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CustomerList } from '@/components/pos/CustomerList';
import { ALL_ROLES, UserRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Customer Management - BaaWA Inventory POS',
  description: 'Manage and view all customer information',
};

export default async function CustomerManagementPage() {
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

  return <CustomerList user={session.user} />;
}
