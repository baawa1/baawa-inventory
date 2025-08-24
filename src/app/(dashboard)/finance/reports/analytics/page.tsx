import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/roles';

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Financial Analytics</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}
