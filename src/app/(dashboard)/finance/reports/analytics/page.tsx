import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FinancialAnalyticsDashboard } from '@/components/finance/FinancialAnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Financial Analytics - BaaWA Inventory',
  description: 'Comprehensive financial analytics and insights',
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!['ADMIN', 'MANAGER'].includes(userRole)) {
    redirect('/unauthorized');
  }

  return <FinancialAnalyticsDashboard user={session.user} />;
}
