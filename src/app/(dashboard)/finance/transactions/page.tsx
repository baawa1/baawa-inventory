import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { FinanceTransactionList } from "@/components/finance/FinanceTransactionList";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Financial Transactions - BaaWA Inventory POS",
  description:
    "View and manage all financial transactions including expenses and income",
};

export default async function FinanceTransactionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - only admin and manager can access finance
  if (!hasRole(session.user.role, [USER_ROLES.ADMIN, USER_ROLES.MANAGER])) {
    redirect("/unauthorized");
  }

  return <FinanceTransactionList user={session.user} />;
}
