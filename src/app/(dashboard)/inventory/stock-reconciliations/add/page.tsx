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

  return <StockReconciliationForm />;
}
