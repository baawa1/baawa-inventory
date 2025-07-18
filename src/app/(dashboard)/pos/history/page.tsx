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

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return <TransactionHistory />;
}
