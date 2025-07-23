import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Finance Settings - BaaWA Inventory POS",
  description: "Configure finance management settings",
};

export default async function FinanceSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Finance Settings</h1>
      <p className="text-muted-foreground">
        Finance settings are currently under development.
      </p>
    </div>
  );
}