/**
 * Transaction History Page
 * Main page for viewing and managing transaction history in the POS system
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TransactionHistory } from "@/components/pos/TransactionHistory";

export const metadata: Metadata = {
  title: "Transaction History | BaaWA Accessories",
  description:
    "View and manage sales transactions from both online and offline sources",
};

export default async function TransactionHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check if user has POS access
  const hasAccess =
    session.user.role === "ADMIN" ||
    session.user.role === "MANAGER" ||
    session.user.role === "STAFF";

  if (!hasAccess) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <TransactionHistory />
    </div>
  );
}
