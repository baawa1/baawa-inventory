import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import CategoryList from "@/components/inventory/CategoryList";

export const metadata = {
  title: "Categories - BaaWA Inventory POS",
  description:
    "Manage product categories, create new categories, and organize your inventory",
};

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/pending-approval");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage your product categories and organize your inventory
        </p>
      </div>
      <CategoryList user={session.user} />
    </div>
  );
}
