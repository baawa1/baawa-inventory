import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
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
  const session = await auth();

  // Check role permissions - only managers and above can edit stock reconciliations
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const reconciliationId = parseInt(id);

  if (isNaN(reconciliationId)) {
    redirect("/inventory/stock-reconciliations");
  }

  return <StockReconciliationEditForm reconciliationId={reconciliationId} />;
}
