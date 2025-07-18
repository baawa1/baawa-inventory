import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth-rbac";
import { UserRole } from "@/types/user";
import SupplierDetailView from "@/components/inventory/SupplierDetailView";

export const metadata = {
  title: "Supplier Details | BaaWA Inventory",
  description: "View supplier information and manage supplier data",
};

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to view suppliers (inventory:read includes supplier viewing)
  if (!hasPermission(session.user.role as UserRole, "inventory:read")) {
    redirect("/unauthorized");
  }

  const resolvedParams = await params;
  const supplierId = parseInt(resolvedParams.id);

  if (isNaN(supplierId)) {
    redirect("/inventory/suppliers");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SupplierDetailView supplierId={supplierId} />
    </div>
  );
}
