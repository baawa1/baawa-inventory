import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { AppSidebar } from "@/components/app-sidebar";
import { ProductList } from "@/components/inventory/ProductList";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata = {
  title: "Products - BaaWA Inventory POS",
  description:
    "Manage your product inventory, view stock levels, and track product details",
};

export default async function ProductsPage() {
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
        <ProductList user={session.user} />
      </SidebarInset>
    </SidebarProvider>
  );
}
