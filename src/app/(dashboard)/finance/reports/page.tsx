import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import { ReportsList } from '@/components/finance/ReportsList';

export const metadata: Metadata = {
  title: 'Financial Reports - BaaWA Inventory',
  description: 'View and generate financial reports',
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to access financial reports (Admin only)
  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <ReportsList user={session.user} />;
}
