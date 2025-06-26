import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRolePermissions } from "@/lib/auth-rbac";
import AddSupplierForm from "@/components/inventory/AddSupplierForm";

export const metadata = {
  title: "Add Supplier | BaaWA Inventory",
  description: "Add a new supplier to your inventory system",
};

export default async function AddSupplierPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to manage suppliers
  const permissions = getRolePermissions(session.user.role as any);
  if (!permissions.canManageSuppliers) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Add Supplier</h2>
      </div>
      <AddSupplierForm />
    </div>
  );
}
