import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { CategoryList } from "@/components/inventory/CategoryList";

export const metadata = {
  title: "Categories - BaaWA Inventory POS",
  description:
    "Manage product categories, create new categories, and organize your inventory",
};

export default async function CategoriesPage() {
  const session = await getServerSession();

  // Check role permissions - only staff and above can access category management
  if (
    !session?.user ||
    !["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)
  ) {
    redirect("/unauthorized");
  }

  return <CategoryList user={session.user} />;
}
