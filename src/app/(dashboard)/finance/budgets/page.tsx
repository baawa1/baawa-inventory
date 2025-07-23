import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Budget Management - BaaWA Inventory POS",
  description: "Manage budgets and financial planning",
};

export default async function BudgetsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Budget Management</h1>
      <p className="text-muted-foreground">
        Budget management features are currently under development.
      </p>
    </div>
  );
}