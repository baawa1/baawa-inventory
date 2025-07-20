import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { CategoryAnalytics } from "@/components/pos/CategoryAnalytics";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Category Performance - BaaWA Inventory POS",
  description: "Analyze sales performance across product categories",
};

export default async function CategoryAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Category Performance Analytics"
      description="Analyze sales performance across product categories"
    >
      <CategoryAnalytics user={session.user} />
    </DashboardPageLayout>
  );
}
