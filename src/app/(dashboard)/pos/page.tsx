import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { POSInterface } from '@/components/pos/POSInterface';
import { ALL_ROLES, UserRole } from '@/lib/auth/roles';

export default async function POSPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check role permissions - all authenticated users can access POS
  if (!ALL_ROLES.includes(session.user.role as UserRole)) {
    redirect('/unauthorized');
  }

  return <POSInterface />;
}
