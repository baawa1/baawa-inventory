"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SupplierForm } from "./supplier/SupplierForm";
import { useSupplierSubmit } from "./supplier/useSupplierSubmit";
import { createSupplierSchema } from "@/lib/validations/supplier";
import { CreateSupplierData } from "./supplier/types";

export default function AddSupplierForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateSupplierData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: null,
      email: null,
      phone: undefined,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      taxNumber: null,
      paymentTerms: null,
      creditLimit: null,
      isActive: true,
      notes: null,
    },
  });

  const { onSubmit } = useSupplierSubmit(
    form,
    null, // No supplier ID for creation
    setIsSubmitting,
    setSubmitError,
    () => {
      // Success callback
      router.push("/inventory/suppliers");
    }
  );

  const handleCancel = () => {
    router.push("/inventory/suppliers");
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/inventory/suppliers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Supplier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <SupplierForm
            form={form}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isEditing={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
