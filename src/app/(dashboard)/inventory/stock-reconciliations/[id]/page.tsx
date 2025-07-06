import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-helpers";
import { StockReconciliationDetail } from "@/components/inventory/StockReconciliationDetail";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

export const metadata = {
  title: "Stock Reconciliation Details - BaaWA Inventory POS",
  description: "View and manage stock reconciliation details",
};

interface ReconciliationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReconciliationDetailPage({
  params,
}: ReconciliationDetailPageProps) {
  const session = await getServerSession();

  // Check role permissions - only staff and above can access inventory
  if (
    !session?.user ||
    !["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)
  ) {
    redirect("/unauthorized");
  }

  const resolvedParams = await params;
  const reconciliationId = parseInt(resolvedParams.id);

  if (isNaN(reconciliationId)) {
    redirect("/inventory/stock-reconciliations");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/inventory/stock-reconciliations">
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to Reconciliations
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reconciliation Details
          </h1>
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
