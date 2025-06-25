import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";

export const metadata = {
  title: "Dashboard - BaaWA Inventory POS",
  description: "Inventory management and POS system dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Check user status
  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return <InventoryDashboard user={session.user} />;
}
