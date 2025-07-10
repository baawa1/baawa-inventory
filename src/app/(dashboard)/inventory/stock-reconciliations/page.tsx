import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { StockReconciliationList } from "@/components/inventory/StockReconciliationList";

export const metadata = {
  title: "Stock Reconciliations - BaaWA Inventory POS",
  description:
    "Manage stock reconciliations and inventory adjustments with approval workflow",
};

export default async function StockReconciliationsPage() {
  const session = await auth();

  // Check role permissions - only managers and above can access stock reconciliations
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <StockReconciliationList
      userRole={session.user.role}
      userId={parseInt(session.user.id, 10)}
      user={session.user}
    />
  );
}
