import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { SalesAnalytics } from "@/components/pos/SalesAnalytics";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Sales Analytics - BaaWA Inventory POS",
  description: "Analyze sales performance and business insights",
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Sales Analytics"
      description="Analyze sales performance and business insights"
    >
      <SalesAnalytics user={session.user} />
    </DashboardPageLayout>
  );
}
