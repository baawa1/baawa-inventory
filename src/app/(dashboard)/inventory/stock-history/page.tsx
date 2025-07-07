import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StockHistoryList } from "@/components/inventory/StockHistoryList";

export const metadata: Metadata = {
  title: "Stock History - BaaWA Inventory",
  description: "Track and monitor all stock additions and purchase history",
};

export default async function StockHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to access stock history
  const userRole = session.user.role;
  if (!userRole || !["ADMIN", "MANAGER", "USER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return <StockHistoryList user={session.user} />;
}
