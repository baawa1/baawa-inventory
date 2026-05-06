import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AccountProfile } from '@/components/account/AccountProfile';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { PageLoading } from '@/components/ui/loading';

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/unauthorized');
  }

  return (
    <DashboardPageLayout
      title="Account Settings"
      description="Manage your profile information and account settings"
    >
      <Suspense
        fallback={
          <PageLoading
            title="Loading account settings"
            description="Preparing your profile details"
          />
        }
      >
        <AccountProfile user={session.user} />
      </Suspense>
    </DashboardPageLayout>
  );
}
