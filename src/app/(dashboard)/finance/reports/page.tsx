import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { FinanceReports } from "@/components/finance/FinanceReports";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Finance Reports - BaaWA Inventory POS",
  description: "Financial reports and analytics",
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return <FinanceReports user={session.user as any} />;
}
