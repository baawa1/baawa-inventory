import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EditStockAdjustmentForm } from "@/components/inventory/EditStockAdjustmentForm";

export const metadata: Metadata = {
  title: "Edit Stock Adjustment - BaaWA Inventory",
  description: "Edit pending stock adjustment",
};

interface EditStockAdjustmentPageProps {
  params: {
    id: string;
  };
}

export default async function EditStockAdjustmentPage({
  params,
}: EditStockAdjustmentPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to access stock adjustments
  const userRole = session.user.role;
  if (!userRole || !["ADMIN", "MANAGER", "EMPLOYEE"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Edit Stock Adjustment
        </h2>
      </div>
      <EditStockAdjustmentForm adjustmentId={params.id} />
    </div>
  );
}
