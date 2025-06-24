import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Check user status
  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  return children;
}
