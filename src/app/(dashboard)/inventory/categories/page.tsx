import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import MobileCategoryList from '@/components/inventory/MobileCategoryList';

export const metadata = {
  title: 'Categories - BaaWA Inventory POS',
  description:
    'Manage product categories, create new categories, and organize your inventory',
};

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <MobileCategoryList user={session.user} />;
}
