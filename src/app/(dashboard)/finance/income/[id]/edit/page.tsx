import { auth } from "#root/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import EditIncomeForm from "@/components/finance/edit-income/EditIncomeForm";

export const metadata: Metadata = {
  title: "Edit Income - BaaWA Inventory",
  description: "Edit an income transaction",
};

interface EditIncomePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditIncomePage({ params }: EditIncomePageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has finance access
  const userRole = session.user.role;
  if (!["ADMIN", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return <EditIncomeForm user={session.user} incomeId={id} />;
}
