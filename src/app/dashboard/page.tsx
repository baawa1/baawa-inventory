import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { SimpleDashboard } from "@/components/dashboard/SimpleDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div data-testid="dashboard-content" className="space-y-6">
      <SimpleDashboard user={session.user} />
    </div>
  );
}
