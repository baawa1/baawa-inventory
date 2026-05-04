import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';
import { AnalyticsReportPage } from '@/components/finance/AnalyticsReportPage';

export const metadata: Metadata = {
  title: 'Financial Analytics - BaaWA Inventory',
  description: 'Comprehensive financial analytics and insights',
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to access financial reports (Admin only)
  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  return <AnalyticsReportPage />;
}
