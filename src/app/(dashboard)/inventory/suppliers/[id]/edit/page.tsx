import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRolePermissions } from "@/lib/auth-rbac";
import EditSupplierForm from "@/components/inventory/EditSupplierForm";

export const metadata = {
  title: "Edit Supplier | BaaWA Inventory",
  description: "Edit supplier information and settings",
};

interface EditSupplierPageProps {
  params: {
    id: string;
  };
}

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to manage suppliers
  const permissions = getRolePermissions(session.user.role as any);
  if (!permissions.canManageSuppliers) {
    redirect("/unauthorized");
  }

  const supplierId = parseInt(params.id);

  if (isNaN(supplierId)) {
    redirect("/inventory/suppliers");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit Supplier</h2>
      </div>
      <EditSupplierForm supplierId={supplierId} />
    </div>
  );
}
