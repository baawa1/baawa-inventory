import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { StockReconciliationForm } from "@/components/inventory/StockReconciliationForm";

export const metadata = {
  title: "New Stock Reconciliation - BaaWA Inventory POS",
  description: "Create a new stock reconciliation for inventory management",
};

export default async function NewStockReconciliationPage() {
  const session = await getServerSession();

  // Check role permissions - only managers and above can create stock reconciliations
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            New Stock Reconciliation
          </h1>
          <p className="text-muted-foreground">
            Create a new stock reconciliation to track inventory discrepancies
          </p>
        </div>

        <StockReconciliationForm />
      </div>
    </div>
  );
}
