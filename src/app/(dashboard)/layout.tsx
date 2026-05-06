import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { USER_STATUS } from '@/lib/constants';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/login');
  }

  if (
    session.user.status !== USER_STATUS.APPROVED ||
    !session.user.isEmailVerified
  ) {
    redirect('/unauthorized');
  }

  const sidebarUser = {
    name: session.user.name || session.user.email || 'User',
    email: session.user.email || '',
    avatar: session.user.avatar_url || session.user.image || '',
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={sidebarUser} />
        <main className="flex flex-1 flex-col">
          <SiteHeader />
          <div className="flex-1 space-y-4">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
