import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AddStockAdjustmentForm } from "@/components/inventory/AddStockAdjustmentForm";

export const metadata: Metadata = {
  title: "Add Stock Adjustment - BaaWA Inventory",
  description: "Create a new stock adjustment with reason tracking",
};

export default async function AddStockAdjustmentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to create stock adjustments
  const userRole = session.user.role;
  if (!userRole || !["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Add Stock Adjustment
        </h2>
      </div>
      <AddStockAdjustmentForm />
    </div>
  );
}
