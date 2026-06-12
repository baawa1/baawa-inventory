import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CustomerList } from '@/components/pos/CustomerList';
import { ALL_ROLES, type AuthUserRole } from '@/lib/auth/roles';

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
  if (!ALL_ROLES.includes(session.user.role as AuthUserRole)) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/unauthorized');
  }

  return <CustomerList user={session.user} />;
}
