"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "./supplier/SupplierForm";
import { useSupplierData } from "./supplier/useSupplierData";
import { useSupplierSubmit } from "./supplier/useSupplierSubmit";
import { EditSupplierModalProps, SupplierFormData } from "./supplier/types";
import { updateSupplierSchema } from "@/lib/validations/supplier";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function EditSupplierModal({
  supplier,
  isOpen,
  onClose,
  onSave,
}: EditSupplierModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(updateSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      taxId: "",
      paymentTerms: "",
      creditLimit: null,
      isActive: true,
      notes: "",
    },
  });

  const { onSubmit } = useSupplierSubmit(
    form,
    supplier?.id || null,
    setIsSubmitting,
    setSubmitError,
    () => {
      if (supplier) {
        onSave(supplier);
      }
    },
    onClose
  );

  // Populate form when supplier data changes
  useEffect(() => {
    if (supplier && isOpen) {
      form.reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        country: supplier.country || "",
        postalCode: supplier.postalCode || "",
        taxId: supplier.taxId || "",
        paymentTerms: supplier.paymentTerms || "",
        creditLimit: supplier.creditLimit,
        isActive: supplier.isActive,
        notes: supplier.notes || "",
      });
      setSubmitError(null);
    }
  }, [supplier, isOpen, form]);

  const handleClose = () => {
    onClose();
    form.reset();
    setSubmitError(null);
  };

  const handleCancel = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
          <DialogDescription>
            Make changes to the supplier information. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>

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
          isEditing={true}
        />
      </DialogContent>
    </Dialog>
  );
}
