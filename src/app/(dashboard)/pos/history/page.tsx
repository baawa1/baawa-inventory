import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { TransactionHistory } from "@/components/pos/TransactionHistory";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { ALL_ROLES, UserRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Transaction History - BaaWA Inventory POS",
  description: "View and manage transaction history",
};

export default async function TransactionHistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - all authenticated users can access transaction history
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect("/unauthorized");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Transaction History"
      description="View and manage transaction history"
    >
      <TransactionHistory />
    </DashboardPageLayout>
  );
}
