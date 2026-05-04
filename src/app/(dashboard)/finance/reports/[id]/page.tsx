import { Metadata } from 'next';
import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Report Details | BaaWA Finance Manager',
  description: 'View detailed information about a financial report',
};

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({
  params: _params,
}: ReportDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  redirect('/finance/reports');
}
