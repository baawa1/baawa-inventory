import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user account is active - match middleware logic
  if (session.user.status === "PENDING") {
    // PENDING users need email verification first
    if (!session.user.isEmailVerified) {
      redirect("/check-email");
    } else {
      // Email verified but still pending admin approval
      redirect("/pending-approval");
    }
  }

  if (session.user.status === "VERIFIED") {
    // Email verified but not yet approved by admin
    redirect("/pending-approval");
  }

  if (
    session.user.status === "REJECTED" ||
    session.user.status === "SUSPENDED"
  ) {
    redirect("/unauthorized");
  }

  // At this point, user should be APPROVED
  if (session.user.status !== "APPROVED") {
    redirect("/unauthorized");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 space-y-4 p-4 pt-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
