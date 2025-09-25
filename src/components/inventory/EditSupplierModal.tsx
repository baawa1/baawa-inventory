'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Supplier } from '@/hooks/api/suppliers';

interface EditSupplierModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSupplierModal({
  supplier,
  isOpen,
  onClose,
}: EditSupplierModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Supplier</CardTitle>
          <CardDescription>
            Edit supplier information. Supplier ID: {supplier?.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Supplier editing functionality is currently under development.
          </p>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground mt-4 rounded px-4 py-2"
          >
            Close
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
