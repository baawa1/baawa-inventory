import { auth } from "#root/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/finance/ExpenseList";

export const metadata: Metadata = {
  title: "Expenses - BaaWA Inventory",
  description: "View and manage all expense transactions",
};

export default async function ExpensePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return <ExpenseList user={session.user} />;
}
