import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AccountProfile } from '@/components/account/AccountProfile';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return (
    <DashboardPageLayout
      title="Account Settings"
      description="Manage your profile information and account settings"
    >
      <Suspense fallback={<div>Loading account settings...</div>}>
        <AccountProfile user={session.user} />
      </Suspense>
    </DashboardPageLayout>
  );
}
