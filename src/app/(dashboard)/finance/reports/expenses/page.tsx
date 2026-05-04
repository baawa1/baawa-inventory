import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { hasPermission } from '@/lib/auth/roles';
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

  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <ExpenseReport user={session.user} />;
}
