import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { TransactionList } from "@/components/inventory/TransactionList";

export const metadata = {
  title: "Transaction History - BaaWA Inventory POS",
  description: "View and manage all sales transactions and payment history",
};

export default async function POSHistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return <TransactionList user={session.user} />;
}
