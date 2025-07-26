import { redirect } from "next/navigation";
import { auth } from "#root/auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";
import { IncomeStatementReport } from "@/components/finance/IncomeStatementReport";

export const metadata = {
  title: "Income Statement - BaaWA Inventory POS",
  description: "View income statement report",
};

export default async function IncomeStatementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return <IncomeStatementReport user={session.user} />;
}
