import { auth } from '#root/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AddCategoryForm from '@/components/inventory/AddCategoryForm';

export const metadata: Metadata = {
  title: 'Add Category - BaaWA Inventory',
  description: 'Add a new product category to organize your inventory',
};

export default async function AddCategoryPage() {
  const session = await auth();

  // Check if user has permission to add categories
  if (session?.user.role !== 'ADMIN' && session?.user.role !== 'MANAGER') {
    redirect('/unauthorized');
  }

  return <AddCategoryForm />;
}
