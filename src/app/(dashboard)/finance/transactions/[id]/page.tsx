import { Metadata } from "next";
import { auth } from "#root/auth";
import { redirect } from "next/navigation";
import { TransactionDetail } from "@/components/finance/TransactionDetail";

export const metadata: Metadata = {
  title: "Transaction Details | BaaWA Finance Manager",
  description: "View detailed information about a financial transaction",
};

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only admins and managers can access finance details
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const transactionId = parseInt(id);

  if (isNaN(transactionId)) {
    redirect("/finance");
  }

  return (
    <TransactionDetail transactionId={transactionId} user={session.user} />
  );
}
