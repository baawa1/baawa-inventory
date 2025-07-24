import { auth } from "#root/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinanceOverview } from "@/components/finance/FinanceOverview";

export const metadata: Metadata = {
  title: "Finance Overview - BaaWA Inventory",
  description: "Financial overview and summary dashboard",
};

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return <FinanceOverview user={session.user} />;
}
