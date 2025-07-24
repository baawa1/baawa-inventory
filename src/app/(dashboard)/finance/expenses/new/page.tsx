import { auth } from "#root/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddExpenseForm } from "@/components/finance/AddExpenseForm";

export const metadata: Metadata = {
  title: "Add Expense - BaaWA Inventory",
  description: "Add a new expense transaction",
};

export default async function AddExpensePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return <AddExpenseForm user={session.user} />;
}
