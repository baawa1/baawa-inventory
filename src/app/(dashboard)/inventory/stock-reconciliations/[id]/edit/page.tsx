import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { StockReconciliationEditForm } from "@/components/inventory/StockReconciliationEditForm";

export const metadata = {
  title: "Edit Stock Reconciliation - BaaWA Inventory POS",
  description: "Edit an existing stock reconciliation",
};

interface EditStockReconciliationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStockReconciliationPage({
  params,
}: EditStockReconciliationPageProps) {
  const session = await getServerSession();

  // Check role permissions - only managers and above can edit stock reconciliations
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const reconciliationId = parseInt(id);

  if (isNaN(reconciliationId)) {
    redirect("/inventory/stock-reconciliations");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Stock Reconciliation
          </h1>
          <p className="text-muted-foreground">
            Modify the stock reconciliation details and items
          </p>
        </div>

        <StockReconciliationEditForm reconciliationId={reconciliationId} />
      </div>
    </div>
  );
}
