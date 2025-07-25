import { redirect } from "next/navigation";
import { auth } from "#root/auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Expense Report - BaaWA Inventory POS",
  description: "View expense report and analytics",
};

export default async function ExpenseReportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Expense Report</h1>
      <p className="text-muted-foreground">
        Expense report features are currently under development.
      </p>
    </div>
  );
}