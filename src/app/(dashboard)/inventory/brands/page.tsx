import { auth } from '#root/auth';
import { redirect } from 'next/navigation';
import MobileBrandList from '@/components/inventory/MobileBrandList';

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

  return <MobileBrandList user={session.user} />;
}
