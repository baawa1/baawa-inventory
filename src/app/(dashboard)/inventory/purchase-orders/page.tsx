import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import PurchaseOrderList from "@/components/inventory/PurchaseOrderList";

export const metadata = {
  title: "Purchase Orders - BaaWA Inventory POS",
  description:
    "Manage purchase orders, create new orders, and track supplier deliveries",
};

export default async function PurchaseOrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return <PurchaseOrderList user={session.user} />;
}
