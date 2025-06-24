import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { AppSidebar } from "@/components/app-sidebar";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata = {
  title: "Inventory Management - BaaWA POS",
  description: "Manage your inventory, products, suppliers, and stock levels",
};

export default async function InventoryPage() {
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Check user status
  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // Check role permissions - only staff and above can access inventory
  if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <InventoryDashboard user={session.user} />
      </SidebarInset>
    </SidebarProvider>
  );
}
