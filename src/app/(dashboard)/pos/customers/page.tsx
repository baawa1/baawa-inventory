import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { CustomerList } from "@/components/pos/CustomerList";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { ALL_ROLES, UserRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Customers - BaaWA Inventory POS",
  description: "Manage customer information and view customer analytics",
};

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - all authenticated users can access customers
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect("/unauthorized");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return (
    <DashboardPageLayout
      title="Customers"
      description="Manage customer information and view customer analytics"
    >
      <CustomerList user={session.user} />
    </DashboardPageLayout>
  );
}
