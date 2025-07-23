import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { AddTransactionForm } from "@/components/finance/AddTransactionForm";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Add Transaction - BaaWA Inventory POS",
  description: "Create a new financial transaction",
};

export default async function AddTransactionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  return <AddTransactionForm user={session.user} />;
}
