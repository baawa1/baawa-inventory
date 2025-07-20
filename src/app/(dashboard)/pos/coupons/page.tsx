import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { CouponsManagement } from "@/components/pos/CouponsManagement";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Coupons Management - BaaWA Inventory POS",
  description: "Create and manage discount coupons and promotional codes",
};

export default async function CouponsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Coupons Management"
      description="Create and manage discount coupons and promotional codes"
    >
      <CouponsManagement user={session.user} />
    </DashboardPageLayout>
  );
}
