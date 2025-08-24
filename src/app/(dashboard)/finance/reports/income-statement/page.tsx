import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { hasPermission } from '@/lib/auth/roles';
import { IncomeStatementReport } from '@/components/finance/IncomeStatementReport';

export const metadata = {
  title: 'Income Statement - BaaWA Inventory POS',
  description: 'View income statement report',
};

export default async function IncomeStatementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to access financial reports (Admin only)
  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <IncomeStatementReport user={session.user} />;
}
