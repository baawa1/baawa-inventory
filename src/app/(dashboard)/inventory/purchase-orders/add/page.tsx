import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import AddPurchaseOrderForm from "@/components/inventory/AddPurchaseOrderForm";

export const metadata = {
  title: "Create Purchase Order - BaaWA Inventory POS",
  description: "Create a new purchase order",
};

export default async function AddPurchaseOrderPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // Check permissions
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return <AddPurchaseOrderForm />;
}
