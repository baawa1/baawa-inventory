import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { canViewLowStock } from "@/lib/roles";
import { LowStockAlerts } from "@/components/inventory/LowStockAlerts";

export const metadata = {
  title: "Low Stock Alerts - BaaWA Inventory POS",
  description: "Monitor and manage products with low stock levels",
};

export default async function LowStockAlertsPage() {
  const session = await getServerSession();

  // Check role permissions - only authorized users can access low stock alerts
  if (!session?.user || !canViewLowStock(session.user.role)) {
    redirect("/unauthorized");
  }

  return <LowStockAlerts />;
}
