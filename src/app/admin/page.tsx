import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "User Management - BaaWA Inventory",
  description: "Manage users, pending approvals, and account settings",
};

export default async function UserManagementPage() {
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Check if user is approved and has admin role
  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div data-testid="admin-dashboard" className="container mx-auto py-6">
      <AdminDashboard />
    </div>
  );
}
