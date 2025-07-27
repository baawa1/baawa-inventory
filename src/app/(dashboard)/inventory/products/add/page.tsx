import { auth } from '../../../../../../auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AddProductForm from '@/components/inventory/AddProductForm';

export const metadata: Metadata = {
  title: 'Add Product - BaaWA Inventory',
  description: 'Add a new product to your inventory',
};

export default async function AddProductPage() {
  const session = await auth();

  // Check if user has permission to add products
  if (session?.user.role !== 'ADMIN' && session?.user.role !== 'MANAGER') {
    redirect('/unauthorized');
  }

  return <AddProductForm />;
}
