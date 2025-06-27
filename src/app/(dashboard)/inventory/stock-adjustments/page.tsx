import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StockAdjustmentList } from "@/components/inventory/StockAdjustmentList";

export const metadata: Metadata = {
  title: "Stock Adjustments - BaaWA Inventory",
  description: "Manage inventory stock adjustments with reason tracking",
};

export default async function StockAdjustmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to access stock adjustments
  const userRole = session.user.role;
  if (!userRole || !["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Stock Adjustments</h2>
      </div>
      <StockAdjustmentList />
    </div>
  );
}
