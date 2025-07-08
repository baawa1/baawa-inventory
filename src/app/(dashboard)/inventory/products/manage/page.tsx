import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductsTable } from "@/components/inventory/products-table";
import { Button } from "@/components/ui/button";
import { IconPlus, IconFileExport } from "@tabler/icons-react";
import Link from "next/link";
import { USER_ROLES, hasPermission, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Manage Products - BaaWA Inventory POS",
  description:
    "Advanced product management with bulk operations, search, and export capabilities",
};

export default async function ManageProductsPage() {
  const session = await getServerSession();

  // Check role permissions - only staff and above can access inventory
  if (
    !session?.user ||
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.EMPLOYEE,
    ])
  ) {
    redirect("/unauthorized");
  }

  const canManageProducts = hasPermission(session.user.role, "INVENTORY_WRITE");

  const handleExportAll = async () => {
    "use client";
    try {
      const response = await fetch("/api/products/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportAll: true }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-products-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Product Management"
        description="Advanced inventory management with bulk operations and analytics"
      >
        <div className="flex items-center gap-2">
          {canManageProducts && (
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory/products/add">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Advanced Products Table */}
      <ProductsTable userRole={session.user.role} />
    </DashboardLayout>
  );
}
