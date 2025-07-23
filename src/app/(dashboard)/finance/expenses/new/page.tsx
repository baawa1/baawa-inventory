import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Add Expense - BaaWA Inventory POS",
  description: "Add new expense transaction",
};

export default async function AddExpensePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF])) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Expense</h1>
      <p className="text-muted-foreground">
        Add expense form is currently under development.
      </p>
    </div>
  );
}