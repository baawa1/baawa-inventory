import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { CustomerManagement } from '@/components/pos/CustomerManagement';

export const metadata = {
  title: 'Customer Management - BaaWA Inventory POS',
  description: 'Manage and view all customers with detailed analytics',
};

export default async function CustomerManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <CustomerManagement user={session.user} />;
}
