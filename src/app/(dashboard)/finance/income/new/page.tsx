import { auth } from "#root/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import AddIncomeForm from "@/components/finance/AddIncomeForm";

export const metadata: Metadata = {
  title: "Add Income - BaaWA Inventory",
  description: "Add a new income transaction",
};

export default async function AddIncomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return <AddIncomeForm user={session.user} />;
}
