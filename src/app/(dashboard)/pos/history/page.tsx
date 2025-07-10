/**
 * Transaction History Page
 * Main page for viewing and managing transaction history in the POS system
 */

import React from "react";
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { TransactionHistory } from "@/components/pos/TransactionHistory";

export default async function POSHistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/pending-approval");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            View and manage your point-of-sale transaction history
          </p>
        </div>
        <TransactionHistory />
      </div>
    </div>
  );
}
