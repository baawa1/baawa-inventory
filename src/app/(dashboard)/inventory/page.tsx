import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export default async function InventoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // Check if user has inventory access permissions
  const hasInventoryAccess = ["ADMIN", "MANAGER", "STAFF"].includes(
    session.user.role as string
  );

  if (!hasInventoryAccess) {
    redirect("/unauthorized");
  }

  return (
    <DashboardPageLayout
      title="Inventory Management"
      description="Manage your products, stock levels, and inventory operations"
    >
      <Suspense fallback={<div>Loading inventory...</div>}>
        <InventoryDashboard user={session.user} />
      </Suspense>
    </DashboardPageLayout>
  );
}
