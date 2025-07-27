import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';
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

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect('/unauthorized');
  }

  return <CashFlowReport user={session.user} />;
}
