import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { CustomerLeaderboard } from "@/components/pos/CustomerLeaderboard";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Customer Leaderboard - BaaWA Inventory POS",
  description: "View top customers and their purchase statistics",
};

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Customer Leaderboard"
      description="View top customers and their purchase statistics"
    >
      <CustomerLeaderboard user={session.user} />
    </DashboardPageLayout>
  );
}
