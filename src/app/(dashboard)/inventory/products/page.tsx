import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { ProductList } from "@/components/inventory/ProductList";

export const metadata = {
  title: "Products - BaaWA Inventory POS",
  description:
    "Manage your product inventory, view stock levels, and track product details",
};

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - only staff and above can access inventory
  if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return <ProductList user={session.user} />;
}
