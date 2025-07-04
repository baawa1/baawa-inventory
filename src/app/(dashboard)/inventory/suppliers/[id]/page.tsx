import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRolePermissions, UserRole } from "@/lib/auth-rbac";
import SupplierDetailView from "@/components/inventory/SupplierDetailView";

export const metadata = {
  title: "Supplier Details | BaaWA Inventory",
  description: "View supplier information and manage supplier data",
};

interface SupplierDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to view suppliers
  const permissions = getRolePermissions(session.user.role as UserRole);
  if (!permissions.canManageSuppliers) {
    redirect("/unauthorized");
  }

  const supplierId = parseInt(params.id);

  if (isNaN(supplierId)) {
    redirect("/inventory/suppliers");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SupplierDetailView supplierId={supplierId} />
    </div>
  );
}
