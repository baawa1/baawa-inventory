import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div data-testid="dashboard-content" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}!
        </p>
      </div>
      <DashboardCard />
    </div>
  );
}
