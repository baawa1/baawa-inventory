import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { hasPermission } from '@/lib/auth/roles';

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Cash Flow Report</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}
