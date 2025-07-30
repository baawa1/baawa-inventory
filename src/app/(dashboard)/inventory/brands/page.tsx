import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import BrandList from '@/components/inventory/BrandList';

export const metadata = {
  title: 'Brands - BaaWA Inventory POS',
  description:
    'Manage product brands, create new brands, and organize your inventory',
};

export default async function BrandsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/pending-approval');
  }

  return <BrandList user={session.user} />;
}
