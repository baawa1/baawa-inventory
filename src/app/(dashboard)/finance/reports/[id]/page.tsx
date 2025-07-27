import { Metadata } from 'next';
import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { ReportDetail } from '@/components/finance/ReportDetail';

export const metadata: Metadata = {
  title: 'Report Details | BaaWA Finance Manager',
  description: 'View detailed information about a financial report',
};

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only admins and managers can access finance details
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  const reportId = parseInt(id);

  if (isNaN(reportId)) {
    redirect('/finance/reports');
  }

  return <ReportDetail reportId={reportId} user={session.user} />;
}
