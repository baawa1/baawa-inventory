import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { ComprehensiveDashboard } from "@/components/dashboard/ComprehensiveDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div data-testid="dashboard-content" className="space-y-6">
      <ComprehensiveDashboard user={session.user} />
    </div>
  );
}
