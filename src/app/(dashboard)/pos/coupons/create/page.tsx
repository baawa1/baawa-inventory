import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CreateCouponForm } from '@/components/pos/CreateCouponForm';
import { ALL_ROLES, UserRole, USER_ROLES } from '@/lib/auth/roles';

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
    ![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(session.user.role as any)
  ) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <CreateCouponForm user={session.user} />;
}
