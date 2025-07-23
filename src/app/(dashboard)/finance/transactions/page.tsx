import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
// import { TransactionList } from "@/components/finance/TransactionList";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Financial Transactions - BaaWA Inventory POS",
  description: "Manage income and expense transactions",
};

export default async function TransactionsPage() {
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

  // Temporarily disabled - finance features under development
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Financial Transactions</h1>
      <p className="text-muted-foreground">
        Financial transaction management features are currently under
        development.
      </p>
    </div>
  );
}
