import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { ArchivedProductList } from "@/components/inventory/ArchivedProductList";

export const metadata = {
  title: "Archived Products - BaaWA Inventory POS",
  description:
    "View and manage archived products, restore products from archive",
};

export default async function ArchivedProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // Check if user has permission to view archived products
  const canViewArchived = ["ADMIN", "MANAGER"].includes(session.user.role);

  if (!canViewArchived) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archived Products</h1>
        <p className="text-muted-foreground">
          View and manage archived products in your inventory
        </p>
      </div>
      <ArchivedProductList user={session.user} />
    </div>
  );
}
