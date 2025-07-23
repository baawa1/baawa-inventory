import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { FinanceOverview } from "@/components/finance/FinanceDashboard";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Finance Overview - BaaWA Inventory POS",
  description: "Manage business finances, track income and expenses",
};

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - only admin and manager can access finance
  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return <FinanceOverview user={session.user as any} />;
}
