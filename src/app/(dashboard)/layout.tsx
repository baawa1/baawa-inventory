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

  // Check if user account is active
  if (session.user.status !== "ACTIVE") {
    redirect("/pending-approval");
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
