import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Financial Reports - BaaWA Inventory POS",
  description: "View financial reports and analytics",
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Financial Reports</h1>
      <p className="text-muted-foreground">
        Financial reporting features are currently under development.
      </p>
    </div>
  );
}