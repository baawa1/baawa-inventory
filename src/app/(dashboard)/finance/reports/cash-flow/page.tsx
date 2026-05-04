import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { hasPermission } from '@/lib/auth/roles';
import { CashFlowReport } from '@/components/finance/CashFlowReport';

export const metadata = {
  title: 'Cash Flow Report - BaaWA Inventory POS',
  description: 'View cash flow report and analytics',
};

export default async function CashFlowPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to access financial reports (Admin only)
  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <CashFlowReport user={session.user} />;
}
