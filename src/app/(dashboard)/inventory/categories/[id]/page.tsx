import { Metadata } from 'next';
import CategoryDetail from '@/components/inventory/CategoryDetail';
import { auth } from '#root/auth';

export const metadata: Metadata = {
  title: 'Category Details | BaaWA Inventory Manager',
  description: 'View detailed information about a category',
};

interface CategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please log in to view category details.
          </p>
        </div>
      </div>
    );
  }

  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">Invalid Category ID</h2>
          <p className="text-muted-foreground">
            The category ID provided is not valid.
          </p>
        </div>
      </div>
    );
  }

  return <CategoryDetail categoryId={categoryId} user={session.user} />;
}
