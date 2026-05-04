import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import { OverlapAuditReport } from '@/components/finance/OverlapAuditReport';

export const metadata = {
  title: 'Finance Overlap Audit - BaaWA Inventory POS',
  description:
    'Review legacy manual finance entries excluded from reports because they overlap with operational data',
};

export default async function OverlapAuditPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <OverlapAuditReport />;
}
