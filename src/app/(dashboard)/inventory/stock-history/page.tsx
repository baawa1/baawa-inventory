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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock History</h2>
          <p className="text-muted-foreground">
            Monitor all stock additions and purchase transactions
          </p>
        </div>
      </div>
      <StockHistoryList user={session.user} />
    </div>
  );
}
