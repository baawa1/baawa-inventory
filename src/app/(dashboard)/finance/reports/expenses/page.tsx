import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';
import { ExpenseReport } from '@/components/finance/ExpenseReport';

export const metadata = {
  title: 'Expense Report - BaaWA Inventory POS',
  description: 'View expense report and analytics',
};

export default async function ExpenseReportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect('/unauthorized');
  }

  return <ExpenseReport user={session.user} />;
}
