import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth-rbac";
import { UserRole } from "@/types/user";
import AddSupplierForm from "@/components/inventory/AddSupplierForm";

export const metadata = {
  title: "Add Supplier | BaaWA Inventory",
  description: "Add a new supplier to your inventory system",
};

export default async function AddSupplierPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to manage suppliers (inventory:write includes supplier management)
  if (!hasPermission(session.user.role as UserRole, "inventory:write")) {
    redirect("/unauthorized");
  }

  return <AddSupplierForm />;
}
