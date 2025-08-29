import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CreateCouponForm } from '@/components/pos/CreateCouponForm';
import { USER_ROLES } from '@/lib/auth/roles';

export const metadata = {
  title: 'Create Coupon - BaaWA Inventory POS',
  description: 'Create a new discount coupon or promotional code',
};

export default async function CreateCouponPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - only ADMIN and MANAGER can create coupons
  if (
    session.user.role !== USER_ROLES.ADMIN &&
    session.user.role !== USER_ROLES.MANAGER
  ) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <CreateCouponForm user={session.user} />;
}
