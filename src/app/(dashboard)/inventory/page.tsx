import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { ProductList } from "@/components/inventory/ProductList";

export const metadata = {
  title: "Inventory Management - BaaWA POS",
  description: "Manage your inventory, products, suppliers, and stock levels",
};

export default async function InventoryPage() {
  const session = await getServerSession();

  // Check role permissions - only staff and above can access inventory
  if (
    !session?.user ||
    !["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)
  ) {
    redirect("/unauthorized");
  }

  return <ProductList user={session.user} />;
}
