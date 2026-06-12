import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { CouponList } from '@/components/pos/CouponList';
import { ALL_ROLES, type AuthUserRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Coupons - BaaWA Inventory POS',
  description: 'Manage discount coupons and promotional codes',
};

export default async function CouponsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - all authenticated users can access coupons
  if (!ALL_ROLES.includes(session.user.role as AuthUserRole)) {
    redirect('/unauthorized');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/unauthorized');
  }

  return <CouponList user={session.user} />;
}
