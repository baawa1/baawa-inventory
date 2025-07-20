import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { ReviewsManagement } from "@/components/pos/ReviewsManagement";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Product Reviews - BaaWA Inventory POS",
  description: "Manage and moderate product reviews from customers",
};

export default async function ReviewsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Product Reviews"
      description="Manage and moderate product reviews from customers"
    >
      <ReviewsManagement user={session.user} />
    </DashboardPageLayout>
  );
}
