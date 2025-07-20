import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { ProductAnalytics } from "@/components/pos/ProductAnalytics";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Product Performance - BaaWA Inventory POS",
  description: "Analyze individual product sales performance and trends",
};

export default async function ProductAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Product Performance Analytics"
      description="Analyze individual product sales performance and trends"
    >
      <ProductAnalytics user={session.user} />
    </DashboardPageLayout>
  );
}
