import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRolePermissions, UserRole } from "@/lib/auth-rbac";
import SupplierList from "@/components/inventory/SupplierList";

export const metadata = {
  title: "Suppliers Management | BaaWA Inventory",
  description: "Manage suppliers and vendor information",
};

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to manage suppliers
  const permissions = getRolePermissions(session.user.role as UserRole);
  if (!permissions.canManageSuppliers) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
      </div>
      <SupplierList />
    </div>
  );
}
