import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { ArchivedProductList } from "@/components/inventory/ArchivedProductList";

export default async function ArchivedProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to view archived products
  const canViewArchived = ["ADMIN", "MANAGER"].includes(session.user.role);

  if (!canViewArchived) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-6">
      <ArchivedProductList user={session.user} />
    </div>
  );
}
