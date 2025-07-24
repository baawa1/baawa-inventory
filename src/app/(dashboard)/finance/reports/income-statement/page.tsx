import { redirect } from "next/navigation";
import { auth } from "#root/auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Income Statement</h1>
      <p className="text-muted-foreground">
        Income statement report is currently under development.
      </p>
    </div>
  );
}