import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/roles";
import { POSInterface } from "@/components/pos/POSInterface";

export const metadata: Metadata = {
  title: "Point of Sale - BaaWA Accessories",
  description: "Process sales transactions and manage customer orders.",
};

export default async function POSPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check if user is active and approved
  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // POS access requires POS_ACCESS permission
  if (!hasPermission(session.user.role, "POS_ACCESS")) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Logged in as: {session.user.name}
            </span>
          </div>
        </div>
        <POSInterface />
      </div>
    </div>
  );
}
