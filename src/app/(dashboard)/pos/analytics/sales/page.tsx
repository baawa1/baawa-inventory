import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { SalesAnalytics } from "@/components/pos/SalesAnalytics";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { ALL_ROLES, UserRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Sales Analytics - BaaWA Inventory POS",
  description: "Analyze sales performance and business insights",
};

export default async function SalesAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - all authenticated users can access sales analytics
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect("/unauthorized");
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
