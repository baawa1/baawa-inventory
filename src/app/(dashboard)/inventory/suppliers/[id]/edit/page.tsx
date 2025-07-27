import { Metadata } from 'next';
import EditSupplierForm from '@/components/inventory/EditSupplierForm';

export const metadata: Metadata = {
  title: 'Edit Supplier | BaaWA Inventory Manager',
  description: 'Edit supplier information in your inventory system',
};

interface EditSupplierPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const { id } = await params;

  return <EditSupplierForm supplierId={parseInt(id)} />;
}
