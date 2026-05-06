import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { hasPermission } from '@/lib/auth/roles';

export const metadata = {
  title: 'Expense Report - BaaWA Inventory POS',
  description: 'Redirects to the finance analytics page',
};

export default async function ExpenseReportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  redirect('/finance/reports/analytics');
}
