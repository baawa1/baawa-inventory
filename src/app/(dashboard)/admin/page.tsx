import { redirect } from 'next/navigation';
import { auth } from '#root/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { USER_ROLES } from '@/lib/auth/roles';

export const metadata = {
  title: 'User Management - BaaWA Inventory',
  description: 'Manage users, pending approvals, and account settings',
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has admin access
  if (session.user.role !== USER_ROLES.ADMIN) {
    redirect('/unauthorized');
  }

  return (
    <div data-testid="admin-content" className="space-y-6">
      <AdminDashboard />
    </div>
  );
}
