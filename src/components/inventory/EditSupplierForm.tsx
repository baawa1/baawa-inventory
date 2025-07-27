'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditSupplierFormProps {
  supplierId: number;
}

export default function EditSupplierForm({
  supplierId,
}: EditSupplierFormProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/inventory/suppliers')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Supplier</CardTitle>
          <CardDescription>
            Edit supplier information. Supplier ID: {supplierId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Supplier editing functionality is currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
