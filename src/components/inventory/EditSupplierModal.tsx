"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconEdit, IconLoader2, IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";
import { phoneSchema, emailSchema } from "@/lib/validations/common";

// Form validation schema
const supplierFormSchema = z.object({
  name: z
    .string()
    .min(1, "Supplier name is required")
    .max(255, "Name must be less than 255 characters"),
  contactPerson: z
    .string()
    .max(255, "Contact person name must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .max(100, "State must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .max(20, "Postal code must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  taxId: z
    .string()
    .max(50, "Tax ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  paymentTerms: z
    .string()
    .max(255, "Payment terms must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  creditLimit: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Credit limit must be a valid positive number")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditSupplierModalProps {
  supplierId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditSupplierModal({
  supplierId,
  isOpen,
  onClose,
  onSuccess,
}: EditSupplierModalProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
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
      creditLimit: "",
      isActive: true,
      notes: "",
    },
  });

  // Fetch supplier details when modal opens
  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplierDetails();
    }
  }, [isOpen, supplierId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSupplier(null);
      setError(null);
      setSubmitError(null);
    }
  }, [isOpen, form]);

  const fetchSupplierDetails = async () => {
    if (!supplierId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/suppliers/${supplierId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch supplier details");
      }

      const data = await response.json();
      const supplierData = data.data;
      setSupplier(supplierData);

      // Populate form with supplier data
      form.reset({
        name: supplierData.name || "",
        contactPerson: supplierData.contactPerson || "",
        email: supplierData.email || "",
        phone: supplierData.phone || "",
        address: supplierData.address || "",
        city: supplierData.city || "",
        state: supplierData.state || "",
        country: supplierData.country || "",
        postalCode: supplierData.postalCode || "",
        taxId: supplierData.taxId || "",
        paymentTerms: supplierData.paymentTerms || "",
        creditLimit: supplierData.creditLimit
          ? supplierData.creditLimit.toString()
          : "",
        isActive: supplierData.isActive,
        notes: supplierData.notes || "",
      });
    } catch (err) {
      console.error("Error fetching supplier details:", err);
      setError("Failed to load supplier details. Please try again.");
      toast.error("Failed to load supplier details");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    if (!supplierId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Transform data for API
      const apiData = {
        name: data.name,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        taxId: data.taxId || null,
        paymentTerms: data.paymentTerms || null,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null,
        isActive: data.isActive,
        notes: data.notes || null,
      };

      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update supplier");
      }

      toast.success("Supplier updated successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating supplier:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update supplier";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconEdit className="h-5 w-5" />
            Edit Supplier
          </DialogTitle>
          <DialogDescription>
            Update supplier information and settings
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading supplier details...
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSupplierDetails} variant="outline">
              Try Again
            </Button>
          </div>
        ) : supplier ? (
          <div className="space-y-6">
            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter supplier name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter contact person name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter email address"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="Enter phone number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Active Status
                            </FormLabel>
                            <FormDescription>
                              Enable this supplier for new orders and
                              transactions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter full address"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter state/province"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem className="md:w-1/3">
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Business Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter tax identification number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creditLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Limit</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Net 30, COD, 2/10 Net 30"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Describe the payment terms for this supplier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional notes about this supplier"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <IconDeviceFloppy className="h-4 w-4 mr-2" />
                        Update Supplier
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
