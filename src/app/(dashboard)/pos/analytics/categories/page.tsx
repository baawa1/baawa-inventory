import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { CategoryPerformance } from "@/components/pos/CategoryPerformance";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { ALL_ROLES, UserRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Category Performance - BaaWA Inventory POS",
  description: "Analyze category performance and sales metrics",
};

export default async function CategoryPerformancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - all authenticated users can access category performance
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect("/unauthorized");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Category Performance"
      description="Analyze category performance and sales metrics"
    >
      <CategoryPerformance user={session.user} />
    </DashboardPageLayout>
  );
}
