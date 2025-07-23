"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EditSupplierModalProps {
  supplier: any;
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
      <Card className="w-full max-w-2xl mx-4">
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
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Close
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
