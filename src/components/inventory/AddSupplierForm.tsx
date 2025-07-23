"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormLoading } from "@/components/ui/form-loading";
import { toast } from "sonner";
import { nameSchema, phoneSchema } from "@/lib/validations/common";
import { useCreateSupplier } from "@/hooks/api/suppliers";
import { logger } from "@/lib/logger";

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationErrorResponse {
  details: ValidationError[];
}

// Form validation schema - using proper validation schemas
const supplierFormSchema = z.object({
  name: nameSchema,
  contactPerson: z
    .string()
    .max(255, "Contact person must be 255 characters or less")
    .optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional(),
  city: z.string().max(100, "City must be 100 characters or less").optional(),
  state: z.string().max(100, "State must be 100 characters or less").optional(),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional(),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  taxNumber: z
    .string()
    .max(100, "Tax number must be 100 characters or less")
    .optional(),
  paymentTerms: z
    .string()
    .max(255, "Payment terms must be 255 characters or less")
    .optional(),
  creditLimit: z.string().optional(),
  isActive: z.boolean(),
  notes: z
    .string()
    .max(1000, "Notes must be 1000 characters or less")
    .optional(),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function AddSupplierForm() {
  const router = useRouter();
  const createSupplierMutation = useCreateSupplier();

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
      website: "",
      taxNumber: "",
      paymentTerms: "",
      creditLimit: "",
      isActive: true,
      notes: "",
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    // Validate credit limit if provided
    if (data.creditLimit && data.creditLimit.trim()) {
      const creditLimitValue = parseFloat(data.creditLimit);
      if (isNaN(creditLimitValue) || creditLimitValue <= 0) {
        form.setError("creditLimit", {
          type: "manual",
          message: "Credit limit must be a positive number",
        });
        toast.error("Please fix the validation errors below");
        return;
      }
    }

    // Validate phone number if provided
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^(\+234[7-9]\d{9}|0[7-9]\d{9})$/;
      if (!phoneRegex.test(data.phone)) {
        form.setError("phone", {
          type: "manual",
          message:
            "Phone number must be in Nigerian format: +2347087367278 or 07039893476",
        });
        toast.error("Please fix the validation errors below");
        return;
      }
    }

    // Transform form data to match API expectations
    const supplierData = {
      name: data.name,
      contactPerson: data.contactPerson || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      postalCode: data.postalCode || undefined,
      website: data.website || undefined,
      taxNumber: data.taxNumber || undefined,
      paymentTerms: data.paymentTerms || undefined,
      creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : undefined,
      isActive: data.isActive,
      notes: data.notes || undefined,
    };

    try {
      createSupplierMutation.mutate(supplierData, {
        onSuccess: () => {
          toast.success("Supplier created successfully!");
          router.push("/inventory/suppliers");
        },
        onError: (error) => {
          // Handle validation errors from backend
          if (error instanceof Error) {
            const errorMessage = error.message;

            // Check if it's a validation error response
            if (
              errorMessage === "Validation failed" &&
              (error as unknown as ValidationErrorResponse).details
            ) {
              // Set form errors for each validation field
              (error as unknown as ValidationErrorResponse).details.forEach(
                (detail: ValidationError) => {
                  if (detail.field && detail.message) {
                    form.setError(detail.field as keyof SupplierFormData, {
                      type: "server",
                      message: detail.message,
                    });
                  }
                }
              );
              toast.error("Please fix the validation errors below");
              return;
            }

            // Show specific error message if available
            if (errorMessage.includes("already exists")) {
              toast.error("A supplier with this name already exists");
            } else {
              toast.error(
                errorMessage ||
                  "Failed to create supplier. Please check your input and try again."
              );
            }
          } else {
            toast.error("Failed to create supplier");
          }

          logger.error("Failed to create supplier", {
            supplierName: data.name,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      });
    } catch (error) {
      logger.error("Failed to create supplier", {
        supplierName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error("Failed to create supplier");
    }
  };

  // Show loading state
  if (createSupplierMutation.isPending) {
    return (
      <FormLoading
        title="Add Supplier"
        description="Create a new supplier to manage your inventory sources"
        backLabel="Back to Suppliers"
        onBack={() => router.push("/inventory/suppliers")}
        backUrl="/inventory/suppliers"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/inventory/suppliers")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
        <PageHeader
          title="Add Supplier"
          description="Create a new supplier to manage your inventory sources"
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the supplier's contact and business details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        disabled={createSupplierMutation.isPending}
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
                        disabled={createSupplierMutation.isPending}
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
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => {
                  const isValidPhone =
                    !field.value ||
                    /^(\+234[7-9]\d{9}|0[7-9]\d{9})$/.test(field.value);

                  return (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="e.g., +2347087367278 or 07039893476"
                          pattern="^(\+234[7-9]\d{9}|0[7-9]\d{9})$"
                          maxLength={14}
                          onKeyPress={(e) => {
                            // Allow only numbers, +, and backspace
                            const allowedChars = /[0-9+]/;
                            if (
                              !allowedChars.test(e.key) &&
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== "Tab"
                            ) {
                              e.preventDefault();
                            }
                          }}
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow numbers, +, and basic phone characters
                            const cleanedValue = value.replace(/[^0-9+]/g, "");
                            field.onChange(cleanedValue);
                          }}
                          onBlur={field.onBlur}
                          disabled={createSupplierMutation.isPending}
                          className={
                            !isValidPhone && field.value ? "border-red-500" : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Nigerian phone number format: +2347087367278 or
                        07039893476
                        {field.value && !isValidPhone && (
                          <span className="text-red-500 block mt-1">
                            Invalid phone number format
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="Enter website URL"
                        {...field}
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Supplier's physical address and location details.
              </CardDescription>
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
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city"
                          {...field}
                          disabled={createSupplierMutation.isPending}
                        />
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
                          disabled={createSupplierMutation.isPending}
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
                        <Input
                          placeholder="Enter country"
                          {...field}
                          disabled={createSupplierMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter postal code"
                          {...field}
                          disabled={createSupplierMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Financial and business-related details for the supplier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tax number"
                        {...field}
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Net 30, Due on receipt"
                        {...field}
                        disabled={createSupplierMutation.isPending}
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
                        placeholder="Enter credit limit"
                        {...field}
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum credit amount for this supplier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this supplier
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Any additional notes or comments about this supplier.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        rows={4}
                        {...field}
                        disabled={createSupplierMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/inventory/suppliers")}
              disabled={createSupplierMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSupplierMutation.isPending}>
              {createSupplierMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Supplier"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
