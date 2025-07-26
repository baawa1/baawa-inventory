import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { DailyOrdersDetails } from "@/components/pos/DailyOrdersDetails";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";

export const metadata = {
  title: "Daily Orders - BaaWA Inventory POS",
  description: "View detailed orders for a specific date",
};

export default async function DailyOrdersPage({
  params,
}: {
  params: { date: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title={`Daily Orders - ${new Date(params.date).toLocaleDateString()}`}
      description={`View all orders for ${new Date(params.date).toLocaleDateString()}`}
    >
      <DailyOrdersDetails user={session.user} date={params.date} />
    </DashboardPageLayout>
  );
}
