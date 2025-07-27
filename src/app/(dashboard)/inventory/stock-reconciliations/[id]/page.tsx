import { auth } from '../../../../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StockReconciliationDetail } from '@/components/inventory/StockReconciliationDetail';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';

export const metadata = {
  title: 'Stock Reconciliation Details - BaaWA Inventory POS',
  description: 'View and manage stock reconciliation details',
};

interface ReconciliationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReconciliationDetailPage({
  params,
}: ReconciliationDetailPageProps) {
  const session = await auth();

  // Check role permissions - only staff and above can access inventory
  if (
    !session?.user ||
    !['ADMIN', 'MANAGER', 'STAFF'].includes(session.user.role)
  ) {
    redirect('/unauthorized');
  }

  const resolvedParams = await params;
  const reconciliationId = parseInt(resolvedParams.id);

  if (isNaN(reconciliationId)) {
    redirect('/inventory/stock-reconciliations');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 px-4 lg:px-6">
          <Link href="/inventory/stock-reconciliations">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Reconciliations
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Reconciliation Details</h1>
          <p className="text-muted-foreground">
            View and manage this stock reconciliation
          </p>
        </div>
      </div>

      {/* Details Component */}
      <StockReconciliationDetail
        reconciliationId={reconciliationId}
        userRole={session.user.role}
        userId={parseInt(session.user.id)}
      />
    </div>
  );
}
