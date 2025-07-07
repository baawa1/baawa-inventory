import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRolePermissions, UserRole } from "@/lib/auth-rbac";
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
  const permissions = getRolePermissions(session.user.role as UserRole);
  if (!permissions.canManageSuppliers) {
    redirect("/unauthorized");
  }

  return <AddSupplierForm />;
}
